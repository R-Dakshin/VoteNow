// Delete Candidate
const { connectToDatabase } = require('../../_db');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

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

  try {
    const { Candidate, Voter } = await connectToDatabase();
    
    // Get candidate ID from query parameter (Vercel serverless function format)
    const candidateId = req.query.id;
    
    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'Candidate ID is required' });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID format' });
    }

    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Clean up votes from voters who voted for this candidate
    // Remove this candidate ID from all voters' votes array
    await Voter.updateMany(
      { votes: candidateId },
      { $pull: { votes: candidateId } }
    );

    // Delete the candidate
    await Candidate.findByIdAndDelete(candidateId);
    
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete candidate. Please try again.' 
    });
  }
};
