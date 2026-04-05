// Admin Login
const { connectToDatabase } = require('../_db');
const bcrypt = require('bcryptjs');
const { setSecureHeaders, createJwt } = require('../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { Admin } = await connectToDatabase();
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = createJwt({ _id: admin._id, email: admin.email, name: admin.name, type: 'admin' });

    res.json({
      success: true,
      token,
      user: { _id: admin._id, name: admin.name, email: admin.email, type: 'admin' }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};
