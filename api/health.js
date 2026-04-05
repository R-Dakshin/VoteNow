// Health Check Endpoint
const { setSecureHeaders } = require('./_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  res.json({ success: true, message: 'Server is running' });
};
