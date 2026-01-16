import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Plus, Trash2, Settings, Users, BarChart3, LogOut, Vote, UserPlus, Shield, Database, CheckCircle, AlertCircle } from 'lucide-react';

const VotingSystem = () => {
  const [currentView, setCurrentView] = useState('setup');
  const [userType, setUserType] = useState('voter');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // MongoDB Connection Config
  const [mongoConfig, setMongoConfig] = useState({
    uri: '',
    dbName: 'votingSystem'
  });

  // State management
  const [admins, setAdmins] = useState([]);
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votesPerPerson, setVotesPerPerson] = useState(1);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [newCandidate, setNewCandidate] = useState({ title: '', description: '', image: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
  const [newVoter, setNewVoter] = useState({ email: '', password: '', name: '' });

  // MongoDB API Base URL
  const API_URL = 'http://localhost:5000/api';

  // Initialize Database
  const initializeDatabase = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mongoConfig)
      });

      const data = await response.json();
      
      if (data.success) {
        setDbConnected(true);
        setCurrentView('login');
        await loadAllData();
      } else {
        setError(data.message || 'Failed to connect to database');
      }
    } catch (err) {
      setError('Backend server not running. Please start the Node.js server on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Load all data from MongoDB
  const loadAllData = async () => {
    try {
      const [adminsRes, votersRes, candidatesRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/admins`),
        fetch(`${API_URL}/voters`),
        fetch(`${API_URL}/candidates`),
        fetch(`${API_URL}/settings`)
      ]);

      const adminsData = await adminsRes.json();
      const votersData = await votersRes.json();
      const candidatesData = await candidatesRes.json();
      const settingsData = await settingsRes.json();

      setAdmins(adminsData.data || []);
      setVoters(votersData.data || []);
      setCandidates(candidatesData.data || []);
      setVotesPerPerson(settingsData.data?.votesPerPerson || 1);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = userType === 'admin' ? 'admin/login' : 'voter/login';
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        setCurrentUser({ ...data.user, type: userType });
        setCurrentView(userType === 'admin' ? 'admin' : 'voting');
        setLoginData({ email: '', password: '' });
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Vote Toggle
  const handleVoteToggle = (candidateId) => {
    if (selectedVotes.includes(candidateId)) {
      setSelectedVotes(selectedVotes.filter(id => id !== candidateId));
    } else {
      if (selectedVotes.length < votesPerPerson) {
        setSelectedVotes([...selectedVotes, candidateId]);
      } else {
        setError(`You can only vote for ${votesPerPerson} candidate(s)`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Submit Votes
  const submitVotes = async () => {
    if (selectedVotes.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: currentUser._id,
          candidateIds: selectedVotes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Your vote has been submitted successfully!');
        handleLogout();
      } else {
        setError(data.message || 'Failed to submit vote');
      }
    } catch (err) {
      setError('Failed to submit vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add Candidate
  const addCandidate = async () => {
    if (!newCandidate.title || !newCandidate.description) {
      setError('Please fill all candidate fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCandidate,
          image: newCandidate.image || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadAllData();
        setNewCandidate({ title: '', description: '', image: '' });
        setError('');
      } else {
        setError(data.message || 'Failed to add candidate');
      }
    } catch (err) {
      setError('Failed to add candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Candidate
  const deleteCandidate = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/candidates/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadAllData();
      } else {
        setError(data.message || 'Failed to delete candidate');
      }
    } catch (err) {
      setError('Failed to delete candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add Admin
  const addAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.name) {
      setError('Please fill all admin fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });

      const data = await response.json();

      if (data.success) {
        await loadAllData();
        setNewAdmin({ email: '', password: '', name: '' });
        setError('');
      } else {
        setError(data.message || 'Failed to add admin');
      }
    } catch (err) {
      setError('Failed to add admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add Voter
  const addVoter = async () => {
    if (!newVoter.email || !newVoter.password || !newVoter.name) {
      setError('Please fill all voter fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVoter)
      });

      const data = await response.json();

      if (data.success) {
        await loadAllData();
        setNewVoter({ email: '', password: '', name: '' });
        setError('');
      } else {
        setError(data.message || 'Failed to add voter');
      }
    } catch (err) {
      setError('Failed to add voter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update Settings
  const updateVotesPerPerson = async (newValue) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votesPerPerson: newValue })
      });

      const data = await response.json();

      if (data.success) {
        setVotesPerPerson(newValue);
      } else {
        setError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setLoginData({ email: '', password: '' });
    setSelectedVotes([]);
    setError('');
  };

  // Database Setup View
  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4">
              <Database className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Database Setup</h1>
            <p className="text-blue-200">Connect to MongoDB to start using VoteHub</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">MongoDB Connection URI</label>
              <input
                type="text"
                value={mongoConfig.uri}
                onChange={(e) => setMongoConfig({ ...mongoConfig, uri: e.target.value })}
                placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">Database Name</label>
              <input
                type="text"
                value={mongoConfig.dbName}
                onChange={(e) => setMongoConfig({ ...mongoConfig, dbName: e.target.value })}
                placeholder="votingSystem"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {dbConnected && (
            <div className="bg-green-500/20 border border-green-500/50 text-white px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Successfully connected to MongoDB!
            </div>
          )}

          <button
            onClick={initializeDatabase}
            disabled={loading || !mongoConfig.uri}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect to Database'}
          </button>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-200">
            <p className="font-semibold mb-2">📝 Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Install MongoDB locally or use MongoDB Atlas</li>
              <li>Create a Node.js backend server (code provided below)</li>
              <li>Start the backend server on port 5000</li>
              <li>Enter your MongoDB URI and click Connect</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Login View
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4">
              <Vote className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">VoteHub</h1>
            <p className="text-blue-200">Secure Digital Voting Platform</p>
            <div className="mt-2 flex items-center justify-center gap-2 text-green-300 text-sm">
              <CheckCircle className="w-4 h-4" />
              Connected to MongoDB
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setUserType('voter')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                userType === 'voter'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Voter Login
            </button>
            <button
              onClick={() => setUserType('admin')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                userType === 'admin'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setCurrentView('setup')}
            className="mt-4 w-full text-blue-200 text-sm hover:text-white transition-all"
          >
            ← Back to Database Setup
          </button>
        </div>
      </div>
    );
  }

  // Voting View
  if (currentView === 'voting') {
    const voterData = voters.find(v => v._id === currentUser._id);
    
    if (voterData && voterData.hasVoted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 text-center max-w-md">
            <div className="inline-block p-4 bg-green-500 rounded-full mb-4">
              <Vote className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
            <p className="text-white/80 mb-6">You have already submitted your vote.</p>
            <button
              onClick={handleLogout}
              className="bg-white text-green-900 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Cast Your Vote</h1>
              <p className="text-blue-200">Welcome, {currentUser.name}</p>
              <p className="text-sm text-blue-300 mt-1">You can vote for up to {votesPerPerson} candidate(s)</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {candidates.map(candidate => (
              <div
                key={candidate._id}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                  selectedVotes.includes(candidate._id)
                    ? 'border-purple-500 shadow-lg shadow-purple-500/50'
                    : 'border-white/20'
                }`}
              >
                <div className="h-48 overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                  <img
                    src={candidate.image}
                    alt={candidate.title}
                    className="w-full h-full object-cover mix-blend-overlay"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{candidate.title}</h3>
                  <p className="text-blue-200 mb-4 line-clamp-3">{candidate.description}</p>
                  <button
                    onClick={() => handleVoteToggle(candidate._id)}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                      selectedVotes.includes(candidate._id)
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {selectedVotes.includes(candidate._id) ? 'Selected ✓' : 'Vote'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedVotes.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={submitVotes}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-12 py-4 rounded-full font-bold text-lg shadow-2xl hover:scale-110 transition-all animate-pulse disabled:opacity-50"
              >
                {loading ? 'Submitting...' : `Submit Vote (${selectedVotes.length}/${votesPerPerson})`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin View
  if (currentView === 'admin') {
    const [adminTab, setAdminTab] = useState('candidates');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-purple-200">Welcome, {currentUser.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'candidates', label: 'Manage Candidates', icon: Vote },
              { id: 'results', label: 'View Results', icon: BarChart3 },
              { id: 'voters', label: 'Manage Voters', icon: Users },
              { id: 'admins', label: 'Manage Admins', icon: Shield },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  adminTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {adminTab === 'candidates' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Add New Candidate
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newCandidate.title}
                    onChange={(e) => setNewCandidate({ ...newCandidate, title: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newCandidate.description}
                    onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Image URL (optional)"
                    value={newCandidate.image}
                    onChange={(e) => setNewCandidate({ ...newCandidate, image: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={addCandidate}
                  disabled={loading}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map(candidate => (
                  <div key={candidate._id} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20">
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                      <img src={candidate.image} alt={candidate.title} className="w-full h-full object-cover mix-blend-overlay" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-white mb-2">{candidate.title}</h3>
                      <p className="text-blue-200 text-sm mb-3 line-clamp-2">{candidate.description}</p>
                      <button
                        onClick={() => deleteCandidate(candidate._id)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-xl transition-all w-full justify-center disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'results' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Voting Results</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map(candidate => (
                  <div key={candidate._id} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20">
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                      <img src={candidate.image} alt={candidate.title} className="w-full h-full object-cover mix-blend-overlay" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-white mb-2">{candidate.title}</h3>
                      <p className="text-blue-200 text-sm mb-3 line-clamp-2">{candidate.description}</p>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-300 mb-1">{candidate.votes}</div>
                        <div className="text-sm text-blue-200">Votes</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'voters' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="w-6 h-6" />
                  Add New Voter
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newVoter.name}
                    onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newVoter.email}
                    onChange={(e) => setNewVoter({ ...newVoter, email: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newVoter.password}
                    onChange={(e) => setNewVoter({ ...newVoter, password: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={addVoter}
                  disabled={loading}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Voter'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voters.map(voter => (
                  <div key={voter._id} className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-2">{voter.name}</h3>
                    <p className="text-blue-200 text-sm mb-2">{voter.email}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${voter.hasVoted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-blue-200">{voter.hasVoted ? 'Voted' : 'Not Voted'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'admins' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Add New Admin
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={addAdmin}
                  disabled={loading}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Admin'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map(admin => (
                  <div key={admin._id} className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-2">{admin.name}</h3>
                    <p className="text-blue-200 text-sm">{admin.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Voting Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Votes per Person</label>
                    <select
                      value={votesPerPerson}
                      onChange={(e) => updateVotesPerPerson(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num} className="bg-slate-800">{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default VotingSystem;