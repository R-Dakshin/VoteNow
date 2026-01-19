// Settings Management
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Settings } = await connectToDatabase();

    // Get Settings
    if (req.method === 'GET') {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({ votesPerPerson: 1, votingOpen: true });
      }
      return res.json({ success: true, data: settings });
    }

    // Update Settings
    if (req.method === 'PUT') {
      const { votesPerPerson, votingOpen } = req.body;

      const update = { updatedAt: Date.now() };
      if (typeof votesPerPerson === 'number') {
        update.votesPerPerson = votesPerPerson;
      }
      if (typeof votingOpen === 'boolean') {
        update.votingOpen = votingOpen;
      }

      const settings = await Settings.findOneAndUpdate(
        {},
        update,
        { new: true, upsert: true }
      );
      return res.json({ success: true, data: settings });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
