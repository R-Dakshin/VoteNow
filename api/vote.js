// Submit Vote
const { connectToDatabase } = require('./_db');
const mongoose = require('mongoose');
const { setSecureHeaders, requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const auth = requireAuth(req, res, 'voter');
  if (!auth) return;

  try {
    const { Voter, Candidate, Settings } = await connectToDatabase();
    const { candidateIds } = req.body;
    const voterId = auth.id;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid vote data' });
    }

    if (!candidateIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'One or more candidate IDs are invalid' });
    }

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ success: false, message: 'You have already voted' });
    }

    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ success: false, message: 'Settings not found' });
    }

    if (!settings.votingOpen) {
      return res.status(400).json({ success: false, message: 'Voting is currently closed' });
    }

    if (candidateIds.length > settings.votesPerPerson) {
      return res.status(400).json({
        success: false,
        message: `You can only vote for ${settings.votesPerPerson} candidate(s)`
      });
    }

    await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      { $inc: { votes: 1 } }
    );

    await Voter.findByIdAndUpdate(voterId, {
      hasVoted: true,
      votes: candidateIds
    });

    res.json({ success: true, message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('Vote submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit vote' });
  }
};
