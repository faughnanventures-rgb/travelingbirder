import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowed eBird API endpoints (whitelist)
const ALLOWED_ENDPOINT_PATTERNS = [
  /^\/data\/obs\/geo\/recent/,
  /^\/data\/obs\/[A-Z]{2}(-[A-Z0-9]+)*\/recent/,
  /^\/ref\/hotspot\/geo/,
  /^\/ref\/hotspot\/[A-Z]{2}(-[A-Z0-9]+)*/,
  /^\/ref\/region\/list\/[a-z]+\/[A-Z]{2}/,
  /^\/ref\/region\/info\/[A-Z]{2}/,
  /^\/product\/top100\/[A-Z]{2}/,
  /^\/product\/spplist\/[A-Z]{2}/,
  /^\/product\/checklist\/view/,
];

// Simple in-memory rate limiting (resets on cold start)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get client IP for rate limiting
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                   req.socket?.remoteAddress || 
                   'unknown';

  // CORS headers - restrict to your domains in production
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://birding-nu.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin === '')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Get endpoint from query
  const { endpoint } = req.query;
  
  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  // Decode and validate endpoint
  const decodedEndpoint = decodeURIComponent(endpoint);
  
  // Security: Validate against whitelist
  const isAllowed = ALLOWED_ENDPOINT_PATTERNS.some(pattern => pattern.test(decodedEndpoint));
  if (!isAllowed) {
    console.warn(`Blocked invalid endpoint request: ${decodedEndpoint}`);
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  // Get API key from environment
  const apiKey = process.env.EBIRD_API_KEY;
  
  if (!apiKey) {
    console.error('EBIRD_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Build eBird URL
  const ebirdUrl = `https://api.ebird.org/v2${decodedEndpoint}`;

  try {
    const response = await fetch(ebirdUrl, {
      headers: {
        'X-eBirdApiToken': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`eBird API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `eBird API error: ${response.status}` 
      });
    }

    const data = await response.json();
    
    // Cache successful responses for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
