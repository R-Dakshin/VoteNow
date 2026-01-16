// Bulk Delete Voters
const { connectToDatabase } = require('../_db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { Voter, Candidate } = await connectToDatabase();
    const { voterIds } = req.body;

    if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
      return res.json({ success: false, message: 'No voter IDs provided' });
    }

    const results = {
      deleted: [],
      notFound: [],
      errors: []
    };

    for (const voterId of voterIds) {
      try {
        const voter = await Voter.findById(voterId);
        
        if (!voter) {
          results.notFound.push(voterId);
          continue;
        }

        // If voter had voted, decrement vote counts from candidates
        if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
          await Candidate.updateMany(
            { _id: { $in: voter.votes } },
            { $inc: { votes: -1 } }
          );
        }

        // Delete the voter
        await Voter.findByIdAndDelete(voterId);
        results.deleted.push(voterId);
      } catch (error) {
        results.errors.push({
          voterId,
          error: error.message
        });
      }
    }

    const totalProcessed = results.deleted.length + results.notFound.length + results.errors.length;
    res.json({
      success: true,
      message: `Processed ${totalProcessed} voters. ${results.deleted.length} deleted, ${results.notFound.length} not found, ${results.errors.length} errors.`,
      results
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
