/**
 * Serverless function for pulling live Singapore 24-hour weather forecasts from NEA.
 * Route: /api/weather
 *
 * Primary Endpoint:
 * GET https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast
 *
 * This is keyless open API data.
 */

export default async function handler(req: any, res: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.writeHead(200);
    return res.end();
  }

  const endpoint = 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Smart-Haze-Monitoring-Weather/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errPayload = {
        status: 'error',
        error: `NEA Weather service returned HTTP ${response.status}`,
        message: 'Unable to retrieve weather forecast from National Environment Agency.',
      };
      if (typeof res.status === 'function') {
        return res.status(response.status).json(errPayload);
      }
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errPayload));
    }

    const payload = await response.json();
    const records = payload?.data?.records || [];

    if (!records || records.length === 0) {
      const emptyPayload = {
        status: 'error',
        error: 'Empty weather data received from National Environment Agency.',
      };
      if (typeof res.status === 'function') {
        return res.status(404).json(emptyPayload);
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(emptyPayload));
    }

    const latest = records[0];
    const general = latest.general || {};
    const periods = latest.periods || [];

    // Extract current active period's regional forecasts
    const currentPeriod = periods.length > 0 ? periods[0] : null;
    const regionalForecasts: Record<string, { code: string; text: string }> =
      currentPeriod?.regions || {};

    const formattedData = {
      status: 'success',
      date: latest.date || new Date().toISOString().slice(0, 10),
      timestamp: latest.timestamp || new Date().toISOString(),
      updatedTimestamp: latest.updatedTimestamp || new Date().toISOString(),
      general: {
        forecastText: general.forecast?.text || 'Partly Cloudy',
        forecastCode: general.forecast?.code || 'PC',
        validPeriod: general.validPeriod?.text || 'Current Forecast',
        temperature: {
          low: general.temperature?.low ?? 25,
          high: general.temperature?.high ?? 33,
          unit: '°C',
        },
        humidity: {
          low: general.relativeHumidity?.low ?? 65,
          high: general.relativeHumidity?.high ?? 95,
          unit: '%',
        },
        wind: general.wind || { direction: 'SSE', speed: { low: 5, high: 15 } },
      },
      periods,
      regionalForecasts: {
        central: regionalForecasts.central || { code: 'CL', text: 'Cloudy' },
        east: regionalForecasts.east || { code: 'CL', text: 'Cloudy' },
        north: regionalForecasts.north || { code: 'CL', text: 'Cloudy' },
        south: regionalForecasts.south || { code: 'CL', text: 'Cloudy' },
        west: regionalForecasts.west || { code: 'CL', text: 'Cloudy' },
      },
      dataSource: 'National Environment Agency',
      credits: 'Data: National Environment Agency',
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(formattedData);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(formattedData));
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    const errPayload = {
      status: 'error',
      code: isTimeout ? 'TIMEOUT' : 'FETCH_FAILED',
      error: isTimeout
        ? 'NEA weather service request timed out after 7 seconds.'
        : 'Failed to communicate with NEA weather servers.',
      message: err.message || 'Connection failure',
    };
    const code = isTimeout ? 504 : 502;
    if (typeof res.status === 'function') {
      return res.status(code).json(errPayload);
    } else {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errPayload));
    }
  }
}
