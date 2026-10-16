/**
 * Serverless function for pulling live address, building, and geocoding data
 * from the OneMap Singapore public catalogue.
 *
 * Endpoint:
 * GET https://www.onemap.gov.sg/api/common/elastic/search?searchVal=178903&returnGeom=Y&getAddrDetails=Y&pageNum=1
 *
 * This is keyless open API data.
 */

export default async function handler(req: any, res: any) {
  // CORS & caching headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.writeHead(200);
    return res.end();
  }

  // Parse query params (handles both Express req.query and URL searchParams)
  let searchVal = '178903';
  let returnGeom = 'Y';
  let getAddrDetails = 'Y';
  let pageNum = '1';

  if (req.query) {
    if (req.query.searchVal) searchVal = String(req.query.searchVal).trim();
    if (req.query.returnGeom) returnGeom = String(req.query.returnGeom).trim();
    if (req.query.getAddrDetails) getAddrDetails = String(req.query.getAddrDetails).trim();
    if (req.query.pageNum) pageNum = String(req.query.pageNum).trim();
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      searchVal = parsedUrl.searchParams.get('searchVal') || searchVal;
      returnGeom = parsedUrl.searchParams.get('returnGeom') || returnGeom;
      getAddrDetails = parsedUrl.searchParams.get('getAddrDetails') || getAddrDetails;
      pageNum = parsedUrl.searchParams.get('pageNum') || pageNum;
    } catch {
      // fallback to defaults
    }
  }

  const oneMapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
    searchVal
  )}&returnGeom=${encodeURIComponent(returnGeom)}&getAddrDetails=${encodeURIComponent(
    getAddrDetails
  )}&pageNum=${encodeURIComponent(pageNum)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(oneMapUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Smart-Haze-Monitoring-OneMap/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errPayload = {
        status: 'error',
        code: 'ONEMAP_UPSTREAM_ERROR',
        error: `OneMap upstream returned HTTP ${response.status}`,
        message: 'Unable to retrieve location coordinates from OneMap Singapore.',
      };
      if (typeof res.status === 'function') {
        return res.status(response.status).json(errPayload);
      }
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errPayload));
    }

    const data = await response.json();

    const output = {
      status: 'success',
      searchVal,
      pageNum: Number(data.pageNum) || 1,
      totalNumPages: Number(data.totalNumPages) || 1,
      found: Number(data.found) || (data.results ? data.results.length : 0),
      results: data.results || [],
      dataSource: 'OneMap Singapore Catalogue',
      credits: 'Data: OneMap Singapore (Keyless Open API)',
      timestamp: new Date().toISOString(),
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(output);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(output));
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    const errorPayload = {
      status: 'error',
      code: isTimeout ? 'TIMEOUT' : 'FETCH_FAILED',
      error: isTimeout
        ? 'OneMap API request timed out after 8 seconds.'
        : 'Failed to communicate with OneMap Singapore service.',
      message: err.message || 'Connection failure',
    };

    const statusCode = isTimeout ? 504 : 502;
    if (typeof res.status === 'function') {
      return res.status(statusCode).json(errorPayload);
    } else {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errorPayload));
    }
  }
}
