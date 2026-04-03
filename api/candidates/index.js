// Candidate CRUD Operations
const { connectToDatabase } = require('../_db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Candidate, Voter } = await connectToDatabase();

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

    // Delete Candidate fallback by query/body id (for clients hitting /api/candidates with DELETE)
    if (req.method === 'DELETE') {
      const candidateId = req.query.id || (req.body && req.body.id);
      if (!candidateId) {
        return res.status(400).json({ success: false, message: 'Candidate ID is required for delete' });
      }

      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(candidateId)) {
        return res.status(400).json({ success: false, message: 'Invalid candidate ID format' });
      }

      const candidate = await Candidate.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Candidate not found' });
      }

      const { Voter } = await connectToDatabase();
      await Voter.updateMany({ votes: candidateId }, { $pull: { votes: candidateId } });
      await Candidate.findByIdAndDelete(candidateId);
      return res.json({ success: true, message: 'Candidate deleted successfully' });
    }

    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed on candidates list endpoint` });
  } catch (error) {
    console.error('Candidates API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
