// Candidate CRUD Operations
const { connectToDatabase } = require('./_db');

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
    const { Candidate } = await connectToDatabase();

    // Get All Candidates
    if (req.method === 'GET') {
      const candidates = await Candidate.find();
      return res.json({ success: true, data: candidates });
    }

    // Create Candidate
    if (req.method === 'POST') {
      const { title, description, image } = req.body;
      const candidate = await Candidate.create({ title, description, image });
      return res.json({ success: true, data: candidate });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Candidates API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
