/**
 * Serverless health check endpoint.
 * Route: /api/health
 */

export default async function handler(req: any, res: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.writeHead(200);
    return res.end();
  }

  const payload = {
    status: 'ok',
    service: 'Smart Haze Monitoring & OneMap API Service',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  if (typeof res.status === 'function') {
    return res.status(200).json(payload);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(payload));
  }
}
