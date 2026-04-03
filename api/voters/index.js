// Voter CRUD Operations + Bulk Operations
const { connectToDatabase } = require('../_db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Voter, Candidate } = await connectToDatabase();
    const action = req.query.action;

    // Get All Voters
    if (req.method === 'GET') {
      const voters = await Voter.find().select('-password');
      return res.json({ success: true, data: voters });
    }

    // Bulk Upload Voters (POST with ?action=bulk-upload)
    if (req.method === 'POST' && action === 'bulk-upload') {
      const { voters: votersData } = req.body;

      if (!votersData || !Array.isArray(votersData) || votersData.length === 0) {
        return res.json({ success: false, message: 'No voters data provided' });
      }

      const results = {
        success: [],
        failed: [],
        skipped: []
      };

      for (const voterData of votersData) {
        try {
          const { name, email, password } = voterData;

          if (!name || !email || !password) {
            results.failed.push({
              email: email || 'N/A',
              reason: 'Missing required fields (name, email, or password)'
            });
            continue;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            results.failed.push({
              email,
              reason: 'Invalid email format'
            });
            continue;
          }

          const existingVoter = await Voter.findOne({ email });
          if (existingVoter) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await Voter.findByIdAndUpdate(existingVoter._id, {
              name,
              password: hashedPassword
            });
            results.success.push({ email, action: 'updated' });
          } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await Voter.create({ name, email, password: hashedPassword });
            results.success.push({ email, action: 'created' });
          }
        } catch (error) {
          results.failed.push({
            email: voterData.email || 'N/A',
            reason: error.message || 'Unknown error'
          });
        }
      }

      const totalProcessed = results.success.length + results.failed.length;
      return res.json({
        success: true,
        message: `Processed ${totalProcessed} voters. ${results.success.length} successful, ${results.failed.length} failed.`,
        results
      });
    }

    // Create Single Voter (POST without action)
    if (req.method === 'POST') {
      const { name, email, password } = req.body;
      
      const existingVoter = await Voter.findOne({ email });
      if (existingVoter) {
        return res.json({ success: false, message: 'Voter with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const voter = await Voter.create({ name, email, password: hashedPassword });
      
      return res.json({ success: true, data: voter });
    }

    // Bulk Delete Voters (DELETE with ?action=bulk-delete)
    if (req.method === 'DELETE' && action === 'bulk-delete') {
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

          if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
            await Candidate.updateMany(
              { _id: { $in: voter.votes } },
              { $inc: { votes: -1 } }
            );
          }

          await Voter.findByIdAndDelete(voterId);
          results.deleted.push(voterId);
        } catch (error) {
          results.errors.push({ voterId, error: error.message });
        }
      }

      const totalProcessed = results.deleted.length + results.notFound.length + results.errors.length;
      return res.json({
        success: true,
        message: `Processed ${totalProcessed} voters. ${results.deleted.length} deleted, ${results.notFound.length} not found, ${results.errors.length} errors.`,
        results
      });
    }

    // Bulk Reset Voters (PUT with ?action=bulk-reset)
    if (req.method === 'PUT' && action === 'bulk-reset') {
      const { voterIds } = req.body;

      if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
        return res.json({ success: false, message: 'No voter IDs provided' });
      }

      const results = {
        reset: [],
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

          if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
            await Candidate.updateMany(
              { _id: { $in: voter.votes } },
              { $inc: { votes: -1 } }
            );
          }

          await Voter.findByIdAndUpdate(voterId, {
            hasVoted: false,
            votes: []
          });

          results.reset.push(voterId);
        } catch (error) {
          results.errors.push({ voterId, error: error.message });
        }
      }

      const totalProcessed = results.reset.length + results.notFound.length + results.errors.length;
      return res.json({
        success: true,
        message: `Processed ${totalProcessed} voters. ${results.reset.length} reset, ${results.notFound.length} not found, ${results.errors.length} errors.`,
        results
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Voters API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
