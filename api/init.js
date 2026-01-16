// Initialize Database Connection (for backward compatibility)
const { connectToDatabase } = require('./_db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    // Connect to database using environment variables
    await connectToDatabase();
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
    } else if (error.message.includes('MONGODB_URI')) {
      errorMessage = 'MongoDB URI not configured. Please set MONGODB_URI environment variable.';
    }
    
    res.status(500).json({ success: false, message: errorMessage });
  }
};
