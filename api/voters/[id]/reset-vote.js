// Reset Voter Vote
const { connectToDatabase } = require('../../_db');
const mongoose = require('mongoose');
const { setSecureHeaders, requireAuth } = require('../../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'PUT,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const auth = requireAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { Voter, Candidate } = await connectToDatabase();
    const voterId = req.query.id || (req.body && req.body.id);

    if (!voterId || !mongoose.Types.ObjectId.isValid(voterId)) {
      return res.status(400).json({ success: false, message: 'Valid voter ID is required' });
    }

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
      await Candidate.updateMany({ _id: { $in: voter.votes } }, { $inc: { votes: -1 } });
    }

    await Voter.findByIdAndUpdate(voterId, { hasVoted: false, votes: [] });

    res.json({ success: true, message: 'Vote reset successfully. Voter can now vote again.' });
  } catch (error) {
    console.error('Reset vote error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset voter vote' });
  }
};
