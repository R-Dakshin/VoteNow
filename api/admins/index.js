// Admin CRUD Operations
const { connectToDatabase } = require('../_db');
const bcrypt = require('bcryptjs');
const { setSecureHeaders, requireAuth, validateEmail } = require('../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const auth = requireAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { Admin } = await connectToDatabase();

    if (req.method === 'GET') {
      const admins = await Admin.find().select('-password');
      return res.json({ success: true, data: admins });
    }

    if (req.method === 'POST') {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(409).json({ success: false, message: 'Admin with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await Admin.create({ name, email, password: hashedPassword });
      return res.json({ success: true, data: { _id: admin._id, name: admin.name, email: admin.email } });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Admins API error:', error);
    res.status(500).json({ success: false, message: 'Failed to process admin request' });
  }
};
