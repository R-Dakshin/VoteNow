// Settings Management
const { connectToDatabase } = require('./_db');
const { setSecureHeaders, requireAuth } = require('./_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'GET,PUT,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { Settings } = await connectToDatabase();

    if (req.method === 'GET') {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({ votesPerPerson: 1, votingOpen: true });
      }
      return res.json({ success: true, data: settings });
    }

    if (req.method === 'PUT') {
      const auth = requireAuth(req, res, 'admin');
      if (!auth) return;

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
