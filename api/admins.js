// Admin CRUD Operations
const { connectToDatabase } = require('./_db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Admin } = await connectToDatabase();

    // Get All Admins
    if (req.method === 'GET') {
      const admins = await Admin.find().select('-password');
      return res.json({ success: true, data: admins });
    }

    // Create Admin
    if (req.method === 'POST') {
      const { name, email, password } = req.body;
      
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.json({ success: false, message: 'Admin with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await Admin.create({ name, email, password: hashedPassword });
      
      return res.json({ success: true, data: admin });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Admins API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
