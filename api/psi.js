/**
 * Serverless function for retrieving real-time Singapore PSI haze data from the National Environment Agency (NEA).
 * Works on Vercel and Express local development server.
 *
 * GUARDRAILS ENFORCED:
 * 1. Read process.env inside api/ only. No VITE_ prefix.
 * 2. If a key variable is empty, return 503 "key not configured" and do not call the provider.
 * 3. Never invent data. Return explicit errors if data is empty, slow, or refused.
 */

export default async function handler(req, res) {
  // Set CORS and JSON headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Guardrail: If a key variable is explicitly configured as empty, return 503 "key not configured"
  const neaKey = process.env.NEA_API_KEY;
  const dataGovKey = process.env.DATA_GOV_SG_API_KEY;

  if (
    (neaKey !== undefined && neaKey.trim() === '') ||
    (dataGovKey !== undefined && dataGovKey.trim() === '')
  ) {
    return res.status(503).json({
      status: 'error',
      code: 'KEY_NOT_CONFIGURED',
      error: 'key not configured',
      message: 'The National Environment Agency API key variable is empty. Key not configured.',
    });
  }

  const activeApiKey = (neaKey && neaKey.trim()) || (dataGovKey && dataGovKey.trim()) || null;

  // Use AbortController for slow network / timeout detection (7 seconds timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  const requestHeaders = {
    Accept: 'application/json',
    'User-Agent': 'Non-Haze-Activities-App/1.0',
  };
  if (activeApiKey) {
    requestHeaders['x-api-key'] = activeApiKey;
  }

  try {
    // Primary endpoint: Data.gov.sg v2 PSI API
    // Secondary fallback: Data.gov.sg v1 PSI API
    const primaryUrl = 'https://api-open.data.gov.sg/v2/real-time/api/psi';
    let response;
    let usedEndpoint = 'v2';

    try {
      response = await fetch(primaryUrl, {
        signal: controller.signal,
        headers: requestHeaders,
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError') {
        clearTimeout(timeoutId);
        return res.status(504).json({
          status: 'error',
          code: 'SLOW_REQUEST',
          error: 'Unable to load haze data from the National Environment Agency because the service request timed out.',
          message: 'The National Environment Agency service took too long to respond (slow connection or high latency).',
        });
      }

      // Try fallback to v1 endpoint
      try {
        usedEndpoint = 'v1';
        response = await fetch('https://api.data.gov.sg/v1/environment/psi', {
          signal: controller.signal,
          headers: requestHeaders,
        });
      } catch (fallbackErr) {
        clearTimeout(timeoutId);
        if (fallbackErr.name === 'AbortError') {
          return res.status(504).json({
            status: 'error',
            code: 'SLOW_REQUEST',
            error: 'Unable to load haze data from the National Environment Agency because the service request timed out.',
            message: 'The National Environment Agency service took too long to respond.',
          });
        }
        return res.status(502).json({
          status: 'error',
          code: 'CONNECTION_REFUSED',
          error: 'The National Environment Agency service refused the connection or is currently unreachable.',
          message: 'Connection to National Environment Agency servers failed.',
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return res.status(response.status).json({
          status: 'error',
          code: 'ACCESS_DENIED',
          error: 'Access refused by National Environment Agency API.',
          message: `The NEA provider refused access with HTTP status ${response.status}.`,
        });
      }

      return res.status(502).json({
        status: 'error',
        code: 'PROVIDER_ERROR',
        error: `National Environment Agency returned HTTP status ${response.status}.`,
        message: 'The National Environment Agency server returned an error response.',
      });
    }

    const payload = await response.json();

    // Check for empty data response
    let items = [];
    let regionMetadata = [];

    if (usedEndpoint === 'v2') {
      items = payload?.data?.items || [];
      regionMetadata = payload?.data?.regionMetadata || [];
    } else {
      items = payload?.items || [];
      regionMetadata = payload?.region_metadata || [];
    }

    if (!items || items.length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 'EMPTY_DATA',
        error: 'National Environment Agency returned empty air quality data for this hour.',
        message: 'The National Environment Agency response contained no active readings.',
      });
    }

    const latestItem = items[0];
    const readings = latestItem.readings;

    if (!readings || Object.keys(readings).length === 0) {
      return res.status(404).json({
        status: 'error',
        code: 'EMPTY_DATA',
        error: 'National Environment Agency returned empty air quality readings.',
        message: 'The National Environment Agency dataset contained no readable air pollutant metrics.',
      });
    }

    const regions = ['central', 'east', 'north', 'south', 'west'];
    const psi24 = readings.psi_twenty_four_hourly || {};
    const pm25TwentyFour = readings.pm25_twenty_four_hourly || {};
    const pm25Sub = readings.pm25_sub_index || {};
    const pm10TwentyFour = readings.pm10_twenty_four_hourly || {};

    // Determine regional PSI and National PSI
    const psiByRegion = {};
    let maxPsi = 0;
    for (const r of regions) {
      const val = psi24[r] ?? pm25Sub[r] ?? 0;
      psiByRegion[r] = val;
      if (val > maxPsi) maxPsi = val;
    }
    psiByRegion['national'] = psi24.national ?? maxPsi;

    const pm25ByRegion = {};
    for (const r of regions) {
      pm25ByRegion[r] = pm25TwentyFour[r] ?? 0;
    }

    const pm10ByRegion = {};
    for (const r of regions) {
      pm10ByRegion[r] = pm10TwentyFour[r] ?? 0;
    }

    // Determine NEA Advisory Band for given PSI value
    const getAdvisoryBand = (psi) => {
      if (psi <= 50) {
        return {
          band: 'Good',
          color: 'emerald',
          badgeText: 'Good (0 - 50)',
          general: 'Normal outdoor activities can be carried out safely.',
          vulnerable: 'Normal outdoor activities can be carried out safely.',
          unwell: 'Normal outdoor activities can be carried out safely.',
          outdoorRisk: 'Minimal',
        };
      }
      if (psi <= 100) {
        return {
          band: 'Moderate',
          color: 'blue',
          badgeText: 'Moderate (51 - 100)',
          general: 'Normal outdoor activities can be carried out.',
          vulnerable: 'Normal activities. Sensitive individuals should monitor symptoms.',
          unwell: 'Individuals with heart or lung conditions should monitor symptoms.',
          outdoorRisk: 'Low to Moderate',
        };
      }
      if (psi <= 200) {
        return {
          band: 'Unhealthy',
          color: 'amber',
          badgeText: 'Unhealthy (101 - 200)',
          general: 'Reduce prolonged or strenuous outdoor physical exertion.',
          vulnerable: 'Elderly, pregnant women and children should minimize outdoor exertion.',
          unwell: 'Avoid outdoor exertion. Stay in sheltered, air-conditioned environments.',
          outdoorRisk: 'Elevated - Indoor venues strongly advised',
        };
      }
      if (psi <= 300) {
        return {
          band: 'Very Unhealthy',
          color: 'orange',
          badgeText: 'Very Unhealthy (201 - 300)',
          general: 'Avoid prolonged or strenuous outdoor physical exertion.',
          vulnerable: 'Elderly, pregnant women and children should avoid all outdoor exertion.',
          unwell: 'Avoid all outdoor activity. Stay indoors with HEPA air filtration.',
          outdoorRisk: 'High - Strictly avoid outdoor activities',
        };
      }
      return {
        band: 'Hazardous',
        color: 'red',
        badgeText: 'Hazardous (Above 300)',
        general: 'Minimize all outdoor activities. Stay indoors with air filtration.',
        vulnerable: 'Stay indoors. Wear certified N95 masks if outdoors is necessary.',
        unwell: 'Stay indoors. Seek prompt medical assistance if experiencing chest tightness.',
        outdoorRisk: 'Severe - Hazardous air quality across Singapore',
      };
    };

    const overallAdvisory = getAdvisoryBand(psiByRegion.national);

    return res.status(200).json({
      status: 'success',
      timestamp: latestItem.timestamp || new Date().toISOString(),
      updatedTimestamp: latestItem.updatedTimestamp || latestItem.update_timestamp || new Date().toISOString(),
      psiByRegion,
      pm25ByRegion,
      pm10ByRegion,
      rawReadings: readings,
      overallAdvisory,
      dataSource: 'National Environment Agency',
      credits: 'Data: National Environment Agency',
    });
  } catch (err) {
    return res.status(502).json({
      status: 'error',
      code: 'FETCH_FAILED',
      error: 'Unable to communicate with National Environment Agency servers.',
      message: err.message || 'Internal connection failure',
    });
  }
}
