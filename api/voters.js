// Voter CRUD Operations
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
    const { Voter } = await connectToDatabase();

    // Get All Voters
    if (req.method === 'GET') {
      const voters = await Voter.find().select('-password');
      return res.json({ success: true, data: voters });
    }

    // Create Voter
    if (req.method === 'POST') {
      const { name, email, password } = req.body;
      
      const existingVoter = await Voter.findOne({ email });
      if (existingVoter) {
        return res.json({ success: false, message: 'Voter with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const voter = await Voter.create({ name, email, password: hashedPassword });
      
      return res.json({ success: true, data: voter });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Voters API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
