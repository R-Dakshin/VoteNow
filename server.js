// server.js - Node.js Backend for VoteHub Voting System
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_secret';
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : [];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

function getBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

function verifyAuth(req, res, requiredRole = null) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Missing authorization token' });
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (requiredRole && payload.type !== requiredRole) {
      res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
      return null;
    }
    return payload;
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return null;
  }
}

function createJwt(user) {
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      name: user.name,
      type: user.type
    },
    JWT_SECRET,
    { expiresIn: '4h' }
  );
}

// MongoDB Schemas
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const voterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hasVoted: { type: Boolean, default: false },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
  createdAt: { type: Date, default: Date.now }
});

const candidateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, default: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400' },
  votes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  votesPerPerson: { type: Number, default: 1 },
  votingOpen: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

let Admin, Voter, Candidate, Settings;
let dbConnection;

// Middleware to check if database is initialized
const checkDbInitialized = (req, res, next) => {
  if (!Admin || !Voter || !Candidate || !Settings) {
    return res.json({ 
      success: false, 
      message: 'Database not initialized. Please call /api/init first.' 
    });
  }
  next();
};

// Initialize Database Connection
app.post('/api/init', async (req, res) => {
  try {
    const { uri, dbName } = req.body;

    if (!uri) {
      return res.json({ success: false, message: 'MongoDB URI is required' });
    }

    // Close existing connection if any
    if (dbConnection) {
      await mongoose.disconnect();
    }

    // Connect to MongoDB
    await mongoose.connect(uri, {
      dbName: dbName || 'votingSystem',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    dbConnection = mongoose.connection;
    
    // Handle connection events
    dbConnection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    dbConnection.once('open', () => {
      console.log('✅ Connected to MongoDB successfully');
    });

    // Initialize Models
    Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
    Voter = mongoose.models.Voter || mongoose.model('Voter', voterSchema);
    Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
    Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

    // Create default admin if none exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        name: 'Main Admin',
        email: 'admin@vote.com',
        password: hashedPassword
      });
    }

    // Create default settings if none exists
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({ votesPerPerson: 1, votingOpen: true });
    }

    res.json({ success: true, message: 'Connected to MongoDB successfully' });
  } catch (error) {
    console.error('Database connection error:', error);
    let errorMessage = error.message;
    
    // Provide more helpful error messages
    if (error.message.includes('authentication failed')) {
      errorMessage = 'Authentication failed. Please check your username and password.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      errorMessage = 'Cannot reach MongoDB server. Check your internet connection and cluster URL.';
    } else if (error.message.includes('password')) {
      errorMessage = 'Invalid password. Make sure you replaced <db_password> with your actual password.';
    } else if (error.message.includes('IP')) {
      errorMessage = 'Your IP address is not whitelisted in MongoDB Atlas. Add your IP in Network Access.';
    }
    
    res.json({ success: false, message: errorMessage });
  }
});

// ============== ADMIN ROUTES ==============

// Admin Login
app.post('/api/admin/login', checkDbInitialized, async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = createJwt({ _id: admin._id, email: admin.email, name: admin.name, type: 'admin' });

    res.json({
      success: true,
      token,
      user: { _id: admin._id, name: admin.name, email: admin.email, type: 'admin' }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Get All Admins
app.get('/api/admins', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const admins = await Admin.find().select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Create Admin
app.post('/api/admins', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { name, email, password } = req.body;
    
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.json({ success: false, message: 'Admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hashedPassword });
    
    res.json({ success: true, data: { _id: admin._id, name: admin.name, email: admin.email } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============== VOTER ROUTES ==============

// Voter Login
app.post('/api/voter/login', checkDbInitialized, async (req, res) => {
  try {
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
    res.json({ success: false, message: error.message });
  }
});

// Get All Voters
app.get('/api/voters', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const voters = await Voter.find().select('-password');
    res.json({ success: true, data: voters });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Create Voter
app.post('/api/voters', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { name, email, password } = req.body;
    
    const existingVoter = await Voter.findOne({ email });
    if (existingVoter) {
      return res.json({ success: false, message: 'Voter with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const voter = await Voter.create({ name, email, password: hashedPassword });
    
    res.json({ success: true, data: { _id: voter._id, name: voter.name, email: voter.email, hasVoted: voter.hasVoted } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Reset Voter Vote (Admin only)
app.put('/api/voters/:id/reset-vote', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const voter = await Voter.findById(req.params.id);
    if (!voter) {
      return res.json({ success: false, message: 'Voter not found' });
    }

    if (voter.hasVoted && voter.votes && voter.votes.length > 0) {
      await Candidate.updateMany(
        { _id: { $in: voter.votes } },
        { $inc: { votes: -1 } }
      );
    }

    await Voter.findByIdAndUpdate(req.params.id, {
      hasVoted: false,
      votes: []
    });

    res.json({ success: true, message: 'Vote reset successfully. Voter can now vote again.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============== CANDIDATE ROUTES ==============

// Get All Candidates
app.get('/api/candidates', checkDbInitialized, async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Create Candidate
app.post('/api/candidates', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const { title, description, image } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const candidate = await Candidate.create({ title, description, image });
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Delete Candidate
app.delete('/api/candidates/:id', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
    const candidateId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ success: false, message: 'Invalid candidate ID format' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    await Voter.updateMany(
      { votes: candidateId },
      { $pull: { votes: candidateId } }
    );
    
    await Candidate.findByIdAndDelete(candidateId);
    res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== VOTING ROUTES ==============

// Submit Vote
app.post('/api/vote', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'voter');
  if (!auth) return;

  try {
    const { candidateIds } = req.body;
    const voterId = auth.id;

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid vote data' });
    }

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ success: false, message: 'You have already voted' });
    }

    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ success: false, message: 'Settings not found' });
    }

    if (settings.votingOpen === false) {
      return res.status(400).json({ success: false, message: 'Voting is currently closed' });
    }

    if (candidateIds.length > settings.votesPerPerson) {
      return res.status(400).json({
        success: false,
        message: `You can only vote for ${settings.votesPerPerson} candidate(s)`
      });
    }

    await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      { $inc: { votes: 1 } }
    );

    await Voter.findByIdAndUpdate(voterId, {
      hasVoted: true,
      votes: candidateIds
    });

    res.json({ success: true, message: 'Vote submitted successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============== SETTINGS ROUTES ==============

// Get Settings
app.get('/api/settings', checkDbInitialized, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ votesPerPerson: 1 });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Update Settings
app.put('/api/settings', checkDbInitialized, async (req, res) => {
  const auth = verifyAuth(req, res, 'admin');
  if (!auth) return;

  try {
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
    res.json({ success: true, data: settings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ VoteHub Backend Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
