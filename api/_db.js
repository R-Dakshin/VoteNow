// Shared database connection module for Vercel serverless functions
const mongoose = require('mongoose');

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
let cachedConnection = null;

// Connect to MongoDB with connection caching for serverless
async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return { Admin, Voter, Candidate, Settings };
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'votingSystem';

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    // Reuse existing connection if available
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        dbName: MONGODB_DB_NAME,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        tls: true,
        tlsAllowInvalidCertificates: false,
      });
    }

    cachedConnection = mongoose.connection;

    // Initialize Models (only if not already initialized)
    if (!Admin) {
      Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
      Voter = mongoose.models.Voter || mongoose.model('Voter', voterSchema);
      Candidate = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
      Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
    }

    // Create default admin if none exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const bcrypt = require('bcryptjs');
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

    return { Admin, Voter, Candidate, Settings };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };
