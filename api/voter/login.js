// Voter Login
const { connectToDatabase } = require('../_db');
const bcrypt = require('bcryptjs');
const { setSecureHeaders, createJwt } = require('../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { Voter } = await connectToDatabase();
    const { email, password } = req.body;
    const voter = await Voter.findOne({ email });

    if (!voter) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, voter.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = createJwt({ _id: voter._id, email: voter.email, name: voter.name, type: 'voter' });

    res.json({
      success: true,
      token,
      user: {
        _id: voter._id,
        name: voter.name,
        email: voter.email,
        hasVoted: voter.hasVoted,
        votes: voter.votes,
        type: 'voter'
      }
    });
  } catch (error) {
    console.error('Voter login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};
