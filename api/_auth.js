const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_secret';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().toLowerCase())
  .filter(Boolean);

function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return '';
  const normalizedOrigin = requestOrigin.toLowerCase();
  if (ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS.includes(normalizedOrigin) ? requestOrigin : '';
  }

  if (process.env.VERCEL_URL) {
    const vercelOrigin = `https://${process.env.VERCEL_URL}`;
    if (normalizedOrigin === vercelOrigin) {
      return requestOrigin;
    }
  }

  if (normalizedOrigin.startsWith('http://localhost') || normalizedOrigin.startsWith('http://127.0.0.1')) {
    return requestOrigin;
  }

  return '';
}

function setSecureHeaders(req, res, methods = 'GET,POST,PUT,DELETE,OPTIONS') {
  const origin = getAllowedOrigin(req.headers.origin) || req.headers.origin || '';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Requested-With, X-CSRF-Token'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

function verifyToken(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Missing authorization token' });
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
}

function requireAuth(req, res, requiredRole = null) {
  const payload = verifyToken(req, res);
  if (!payload) return null;

  if (requiredRole && payload.type !== requiredRole) {
    res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    return null;
  }

  return payload;
}

function createJwt(user) {
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      name: user.name,
      type: user.type
    },
    JWT_SECRET,
    { expiresIn: '4h' }
  );
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  setSecureHeaders,
  requireAuth,
  createJwt,
  validateEmail
};
