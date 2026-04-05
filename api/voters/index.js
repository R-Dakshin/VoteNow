// Voter CRUD Operations + Bulk Operations
const { connectToDatabase } = require('../_db');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { setSecureHeaders, requireAuth, validateEmail } = require('../_auth');

module.exports = async (req, res) => {
  setSecureHeaders(req, res, 'GET,POST,PUT,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const auth = requireAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { Voter, Candidate } = await connectToDatabase();
    const action = req.query.action;

    if (req.method === 'GET') {
      const voters = await Voter.find().select('-password');
      return res.json({ success: true, data: voters });
    }

    if (req.method === 'POST' && action === 'bulk-upload') {
      const { voters: votersData } = req.body;
      if (!votersData || !Array.isArray(votersData) || votersData.length === 0) {
        return res.status(400).json({ success: false, message: 'No voters data provided' });
      }

      const results = { success: [], failed: [] };
      for (const voterData of votersData) {
        try {
          const { name, email, password } = voterData;
          if (!name || !email || !password) {
            results.failed.push({ email: email || 'N/A', reason: 'Missing required fields' });
            continue;
          }
          if (!validateEmail(email)) {
            results.failed.push({ email, reason: 'Invalid email format' });
            continue;
          }

          const existingVoter = await Voter.findOne({ email });
          const hashedPassword = await bcrypt.hash(password, 10);
          if (existingVoter) {
            await Voter.findByIdAndUpdate(existingVoter._id, { name, password: hashedPassword });
            results.success.push({ email, action: 'updated' });
          } else {
            await Voter.create({ name, email, password: hashedPassword });
            results.success.push({ email, action: 'created' });
          }
        } catch (error) {
          results.failed.push({ email: voterData.email || 'N/A', reason: error.message || 'Unknown error' });
        }
      }

      const total = results.success.length + results.failed.length;
      return res.json({ success: true, message: `Processed ${total} voters. ${results.success.length} successful, ${results.failed.length} failed.`, results });
    }

    if (req.method === 'POST') {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required' });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      const existingVoter = await Voter.findOne({ email });
      if (existingVoter) {
        return res.status(409).json({ success: false, message: 'Voter with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const voter = await Voter.create({ name, email, password: hashedPassword });
      return res.json({ success: true, data: { _id: voter._id, name: voter.name, email: voter.email, hasVoted: voter.hasVoted } });
    }

    if (req.method === 'DELETE' && action === 'bulk-delete') {
      const { voterIds } = req.body;
      if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No voter IDs provided' });
      }

      const results = { deleted: [], notFound: [], errors: [] };
      for (const voterId of voterIds) {
        if (!mongoose.Types.ObjectId.isValid(voterId)) {
          results.errors.push({ voterId, error: 'Invalid voter ID format' });
          continue;
        }
        try {
          const voter = await Voter.findById(voterId);
          if (!voter) {
            results.notFound.push(voterId);
            continue;
          }
          if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
            await Candidate.updateMany({ _id: { $in: voter.votes } }, { $inc: { votes: -1 } });
          }
          await Voter.findByIdAndDelete(voterId);
          results.deleted.push(voterId);
        } catch (error) {
          results.errors.push({ voterId, error: error.message });
        }
      }

      const total = results.deleted.length + results.notFound.length + results.errors.length;
      return res.json({ success: true, message: `Processed ${total} voters. ${results.deleted.length} deleted, ${results.notFound.length} not found, ${results.errors.length} errors.`, results });
    }

    if (req.method === 'PUT' && action === 'bulk-reset') {
      const { voterIds } = req.body;
      if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No voter IDs provided' });
      }

      const results = { reset: [], notFound: [], errors: [] };
      for (const voterId of voterIds) {
        if (!mongoose.Types.ObjectId.isValid(voterId)) {
          results.errors.push({ voterId, error: 'Invalid voter ID format' });
          continue;
        }
        try {
          const voter = await Voter.findById(voterId);
          if (!voter) {
            results.notFound.push(voterId);
            continue;
          }
          if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
            await Candidate.updateMany({ _id: { $in: voter.votes } }, { $inc: { votes: -1 } });
          }
          await Voter.findByIdAndUpdate(voterId, { hasVoted: false, votes: [] });
          results.reset.push(voterId);
        } catch (error) {
          results.errors.push({ voterId, error: error.message });
        }
      }

      const total = results.reset.length + results.notFound.length + results.errors.length;
      return res.json({ success: true, message: `Processed ${total} voters. ${results.reset.length} reset, ${results.notFound.length} not found, ${results.errors.length} errors.`, results });
    }

    if (req.method === 'PUT' && action === 'bulk-reset-all') {
      const votersToReset = await Voter.find({ hasVoted: true });
      const results = { reset: [], errors: [] };
      for (const voter of votersToReset) {
        try {
          if (voter.votes && voter.votes.length > 0) {
            await Candidate.updateMany({ _id: { $in: voter.votes } }, { $inc: { votes: -1 } });
          }
          await Voter.findByIdAndUpdate(voter._id, { hasVoted: false, votes: [] });
          results.reset.push(voter._id);
        } catch (error) {
          results.errors.push({ voterId: voter._id, error: error.message });
        }
      }
      await Voter.updateMany({ hasVoted: true }, { hasVoted: false, votes: [] });
      return res.json({ success: true, message: `Reset ${results.reset.length} voters. ${results.errors.length} errors.`, results });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Voters API error:', error);
    res.status(500).json({ success: false, message: 'Failed to process voters request' });
  }
};
