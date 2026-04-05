// Candidate CRUD Operations
const { connectToDatabase } = require('../_db');
const mongoose = require('mongoose');
const { setSecureHeaders, requireAuth } = require('../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'GET,POST,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Candidate, Voter } = await connectToDatabase();

    if (req.method === 'GET') {
      const candidates = await Candidate.find();
      return res.json({ success: true, data: candidates });
    }

    const auth = requireAuth(req, res, 'admin');
    if (!auth) return;

    if (req.method === 'POST') {
      const { title, description, image } = req.body;
      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Title and description are required' });
      }
      const candidate = await Candidate.create({ title, description, image });
      return res.json({ success: true, data: candidate });
    }

    if (req.method === 'DELETE') {
      const candidateId = req.query.id || (req.body && req.body.id);
      if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
        return res.status(400).json({ success: false, message: 'Valid candidate ID is required for delete' });
      }

      const candidate = await Candidate.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({ success: false, message: 'Candidate not found' });
      }

      await Voter.updateMany({ votes: candidateId }, { $pull: { votes: candidateId } });
      await Candidate.findByIdAndDelete(candidateId);
      return res.json({ success: true, message: 'Candidate deleted successfully' });
    }

    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed on candidates list endpoint` });
  } catch (error) {
    console.error('Candidates API error:', error);
    res.status(500).json({ success: false, message: 'Failed to process candidate request' });
  }
};
