// Bulk Upload Voters from CSV
const { connectToDatabase } = require('../_db');
const bcrypt = require('bcryptjs');

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
    const { Voter } = await connectToDatabase();
    const { voters } = req.body;

    if (!voters || !Array.isArray(voters) || voters.length === 0) {
      return res.json({ success: false, message: 'No voters data provided' });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const voterData of voters) {
      try {
        const { name, email, password } = voterData;

        // Validate required fields
        if (!name || !email || !password) {
          results.failed.push({
            email: email || 'N/A',
            reason: 'Missing required fields (name, email, or password)'
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            email,
            reason: 'Invalid email format'
          });
          continue;
        }

        // Check if voter already exists
        const existingVoter = await Voter.findOne({ email });
        if (existingVoter) {
          // Update existing voter
          const hashedPassword = await bcrypt.hash(password, 10);
          await Voter.findByIdAndUpdate(existingVoter._id, {
            name,
            password: hashedPassword
          });
          results.success.push({
            email,
            action: 'updated'
          });
        } else {
          // Create new voter
          const hashedPassword = await bcrypt.hash(password, 10);
          await Voter.create({
            name,
            email,
            password: hashedPassword
          });
          results.success.push({
            email,
            action: 'created'
          });
        }
      } catch (error) {
        results.failed.push({
          email: voterData.email || 'N/A',
          reason: error.message || 'Unknown error'
        });
      }
    }

    const totalProcessed = results.success.length + results.failed.length;
    res.json({
      success: true,
      message: `Processed ${totalProcessed} voters. ${results.success.length} successful, ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
