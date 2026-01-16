// Reset Voter Vote
const { connectToDatabase } = require('../../_db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { Voter, Candidate } = await connectToDatabase();
    const voterId = req.query.id;

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.json({ success: false, message: 'Voter not found' });
    }

    // If voter had voted, we need to decrement the vote counts from candidates
    if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
      await Candidate.updateMany(
        { _id: { $in: voter.votes } },
        { $inc: { votes: -1 } }
      );
    }

    // Reset voter's vote status
    await Voter.findByIdAndUpdate(voterId, {
      hasVoted: false,
      votes: []
    });

    res.json({ success: true, message: 'Vote reset successfully. Voter can now vote again.' });
  } catch (error) {
    console.error('Reset vote error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
