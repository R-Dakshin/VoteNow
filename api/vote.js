// Submit Vote
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { Voter, Candidate, Settings } = await connectToDatabase();
    const { voterId, candidateIds } = req.body;

    if (!voterId || !candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.json({ success: false, message: 'Invalid vote data' });
    }

    // Check if voter has already voted
    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.json({ success: false, message: 'Voter not found' });
    }
    
    if (voter.hasVoted) {
      return res.json({ success: false, message: 'You have already voted' });
    }

    // Check votes per person limit and whether voting is open
    const settings = await Settings.findOne();
    if (!settings) {
      return res.json({ success: false, message: 'Settings not found' });
    }

    if (settings.votingOpen === false) {
      return res.json({ success: false, message: 'Voting is currently closed' });
    }
    
    if (candidateIds.length > settings.votesPerPerson) {
      return res.json({
        success: false,
        message: `You can only vote for ${settings.votesPerPerson} candidate(s)`
      });
    }

    // Update candidate vote counts
    await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      { $inc: { votes: 1 } }
    );

    // Mark voter as voted
    await Voter.findByIdAndUpdate(voterId, {
      hasVoted: true,
      votes: candidateIds
    });

    res.json({ success: true, message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('Vote submission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
