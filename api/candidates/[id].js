// Delete Candidate
const { connectToDatabase } = require('../../_db');
const mongoose = require('mongoose');
const { setSecureHeaders, requireAuth } = require('../../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'DELETE,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const isDeleteOverride =
    req.method === 'POST' &&
    (req.query._method === 'DELETE' || (req.body && req.body._method === 'DELETE'));

  if (req.method !== 'DELETE' && !isDeleteOverride) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed on candidate delete endpoint. Use DELETE (or POST with _method=DELETE)`,
    });
  }

  const auth = requireAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { Candidate, Voter } = await connectToDatabase();
    const candidateId = req.query.id;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ success: false, message: 'Valid candidate ID is required' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    await Voter.updateMany({ votes: candidateId }, { $pull: { votes: candidateId } });
    await Candidate.findByIdAndDelete(candidateId);

    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete candidate' });
  }
};
