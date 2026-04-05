import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Plus, Trash2, Settings, Users, BarChart3, LogOut, Vote, UserPlus, Shield, Database, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import './App.css';
import BackgroundVideo from './components/BackgroundVideo';
import AnimatedParticles from './components/AnimatedParticles';
import AnimatedGrid from './components/AnimatedGrid';

const VotingSystem = () => {
  const [currentView, setCurrentView] = useState('setup');
  const [userType, setUserType] = useState('voter');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // MongoDB Connection Config
  const [mongoConfig, setMongoConfig] = useState({
    uri: '',
    dbName: 'votingSystem'
  });

  const secureFetch = async (path, options = {}) => {
    const url = path.startsWith('http')
      ? path
      : path.startsWith(API_URL)
        ? path
        : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    return fetch(url, { ...options, headers });
  };

  // State management
  const [admins, setAdmins] = useState([]);
  const [voters, setVoters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votesPerPerson, setVotesPerPerson] = useState(1);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [cardLayout, setCardLayout] = useState('vertical');
  const [newCandidate, setNewCandidate] = useState({ title: '', description: '', image: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
  const [newVoter, setNewVoter] = useState({ email: '', password: '', name: '' });
  const [adminTab, setAdminTab] = useState('candidates');

  // MongoDB API Base URL
  const API_URL = process.env.REACT_APP_API_URL || '/api';

  // Initialize Database
  const initializeDatabase = async (uri = null, dbName = null) => {
    setLoading(true);
    setError('');
    
    try {
      // In production (Vercel), database is configured via environment variables
      // In development, we can still pass URI if provided
      const requestBody = uri ? { uri, dbName: dbName || 'votingSystem' } : {};
      
      const response = await fetch(`${API_URL}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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

  // Auto-connect on mount if in production (environment variables are set)
  useEffect(() => {
    // Check if we're in production (API_URL is relative path)
    const isProduction = API_URL === '/api' || !API_URL.includes('localhost');
    
    if (isProduction && currentView === 'setup') {
      // Try to auto-connect in production
      initializeDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all data from MongoDB
  const loadAllData = async () => {
    try {
      const fetchPromises = [
        secureFetch(`${API_URL}/candidates`),
        secureFetch(`${API_URL}/settings`)
      ];

      if (currentUser?.type === 'admin') {
        fetchPromises.unshift(
          secureFetch(`${API_URL}/admins`),
          secureFetch(`${API_URL}/voters`)
        );
      }

      const responses = await Promise.all(fetchPromises);
      let adminsData = { data: [] };
      let votersData = { data: [] };
      let candidatesData = { data: [] };
      let settingsData = { data: { votesPerPerson: 1 } };

      if (currentUser?.type === 'admin') {
        [adminsData, votersData, candidatesData, settingsData] = await Promise.all(
          responses.map((res) => res.json())
        );
      } else {
        [candidatesData, settingsData] = await Promise.all(
          responses.map((res) => res.json())
        );
      }

      setAdmins(adminsData.data || []);
      setVoters(votersData.data || []);
      setCandidates(candidatesData.data || []);
      setVotesPerPerson(settingsData.data?.votesPerPerson || 1);

      const savedLayout = localStorage.getItem('cardLayout');
      if (savedLayout === 'horizontal' || savedLayout === 'vertical') {
        setCardLayout(savedLayout);
      }
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
        const token = data.token || '';
        setAuthToken(token);
        localStorage.setItem('authToken', token);
        setCurrentUser({ ...data.user, type: userType });
        await loadAllData();
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

    // Double check if user has already voted
    const voterData = voters.find(v => v._id === currentUser._id);
    if (voterData && voterData.hasVoted) {
      setError('You have already voted. Please contact admin to reset your vote.');
      return;
    }

    setLoading(true);
    try {
      const response = await secureFetch(`${API_URL}/vote`, {
        method: 'POST',
        body: JSON.stringify({ candidateIds: selectedVotes })
      });

      const data = await response.json();

      if (data.success) {
        // Reload all data to get updated vote counts
        await loadAllData();
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
      const response = await secureFetch(`${API_URL}/candidates`, {
        method: 'POST',
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
    if (!id) {
      setError('Candidate ID is missing or invalid before delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      let response = await secureFetch(`${API_URL}/candidates/${id}`, {
        method: 'DELETE'
      });

      if (response.status === 405) {
        // Retry fallback route in case the delete URL is not supported by platform
        response = await secureFetch(`${API_URL}/candidates?id=${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      }

      const data = await response.json();

      if (response.status === 405) {
        setError('Delete failed: method not allowed (405) after fallback.');
        return;
      }

      if (data.success) {
        await loadAllData();
        setError('');
      } else {
        setError(data.message || `Failed to delete candidate (status ${response.status})`);
      }
    } catch (err) {
      console.error('Delete candidate network error:', err);
      setError(`Failed to delete candidate: ${err.message || 'network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset Voter Vote
  const resetVoterVote = async (voterId) => {
    if (!voterId) {
      setError('Missing voter ID to reset vote');
      return;
    }

    if (!window.confirm('Are you sure you want to reset this voter\'s vote? They will be able to vote again.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await secureFetch(`${API_URL}/voters/${voterId}/reset-vote`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        await loadAllData();
        setError('');
      } else {
        setError(data.message || `Failed to reset vote (status ${response.status})`);
      }
    } catch (err) {
      console.error('Reset voter vote error:', err);
      setError(`Failed to reset vote: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset all voters (bulk reset)
  const resetAllVoters = async () => {
    if (!window.confirm('Reset all voters? This will clear all votes and allow everyone to vote again.')) {
      return;
    }

    if (!voters || voters.length === 0) {
      setError('No voters available to reset');
      return;
    }

    setLoading(true);
    try {
      const voterIds = voters.map((v) => v._id);
      const response = await secureFetch(`${API_URL}/voters?action=bulk-reset-all`, {
        method: 'PUT',
        body: JSON.stringify({ voterIds })
      });

      const data = await response.json();

      if (data.success) {
        await loadAllData();
        setError('');
      } else {
        setError(data.message || `Failed to reset all voters (status ${response.status})`);
      }
    } catch (err) {
      console.error('Reset all voters error:', err);
      setError(`Failed to reset all voters: ${err.message || 'Please try again.'}`);
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
      const response = await secureFetch(`${API_URL}/admins`, {
        method: 'POST',
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
      const response = await secureFetch(`${API_URL}/voters`, {
        method: 'POST',
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
      const response = await secureFetch(`${API_URL}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ votesPerPerson: newValue })
      });

      const data = await response.json();

      if (data.success) {
        setVotesPerPerson(newValue);
      } else {
        setError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const updateCardLayout = (layout) => {
    if (layout !== 'vertical' && layout !== 'horizontal') return;
    setCardLayout(layout);
    localStorage.setItem('cardLayout', layout);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('authToken');
    setCurrentView('login');
    setLoginData({ email: '', password: '' });
    setSelectedVotes([]);
    setError('');
  };

  // Database Setup View
  if (currentView === 'setup') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ minHeight: '100vh' }}>
        <BackgroundVideo />
        <AnimatedParticles />
        <AnimatedGrid />
        <div className="relative z-10 content-card slide-in-up" style={{ maxWidth: '520px', margin: 'auto' }}>
          <div className="text-center mb-6">
            <div className="icon-container">
              <Database />
            </div>
            <h1 className="title-primary">Database Setup</h1>
            <p className="subtitle">Connect to MongoDB to start using VoteHub</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-label">MongoDB Connection URI</label>
              <input
                type="text"
                value={mongoConfig.uri}
                onChange={(e) => setMongoConfig({ ...mongoConfig, uri: e.target.value })}
                placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                className="input-field"
              />
            </div>

            <div>
              <label className="text-label">Database Name</label>
              <input
                type="text"
                value={mongoConfig.dbName}
                onChange={(e) => setMongoConfig({ ...mongoConfig, dbName: e.target.value })}
                placeholder="votingSystem"
                className="input-field"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle />
              {error}
            </div>
          )}

          {dbConnected && (
            <div className="success-message">
              <CheckCircle />
              Successfully connected to MongoDB!
            </div>
          )}

          <button
            onClick={() => initializeDatabase(mongoConfig.uri, mongoConfig.dbName)}
            disabled={loading || !mongoConfig.uri}
            className="btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Connecting...
              </>
            ) : (
              'Connect to Database'
            )}
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-12 text-sm text-body" style={{ borderRadius: '12px' }}>
            <p className="font-semibold mb-2" style={{ color: '#0F172A' }}>📝 Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1" style={{ color: '#64748B' }}>
              <li>Install MongoDB locally or use MongoDB Atlas</li>
              <li>Start the backend server on port 5000 (for local development)</li>
              <li>Enter your MongoDB URI and click Connect</li>
              <li><strong>Note:</strong> In production (Vercel), database connection is configured via environment variables</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Login View
  if (currentView === 'login') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden" style={{ minHeight: '100vh' }}>
        <BackgroundVideo />
        <AnimatedParticles />
        <AnimatedGrid />
        <div className="relative z-10 content-card slide-in-up" style={{ margin: 'auto' }}>
          <div className="text-center mb-6">
            <div className="icon-container">
              <Vote />
            </div>
            <h1 className="title-primary">VoteHub</h1>
            <p className="subtitle">Secure Digital Voting Platform</p>
            <div className="status-badge">
              <CheckCircle />
              Connected to MongoDB
            </div>
          </div>

          <div className="segmented-control">
            <button
              onClick={() => setUserType('voter')}
              className={userType === 'voter' ? 'active' : ''}
            >
              Voter Login
            </button>
            <button
              onClick={() => setUserType('admin')}
              className={userType === 'admin' ? 'active' : ''}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-label">Email Address</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="text-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-icon"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !loginData.email || !loginData.password}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <button
            onClick={() => setCurrentView('setup')}
            className="btn-secondary mt-4 w-full"
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
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
          <BackgroundVideo />
          <AnimatedParticles />
          <AnimatedGrid />
          <div className="relative z-10 content-card text-center slide-in-up">
            <div className="icon-container" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', margin: '0 auto 16px' }}>
              <Vote />
            </div>
            <h2 className="title-primary mb-3">Thank You!</h2>
            <p className="text-body mb-6">You have already submitted your vote.</p>
            <button
              onClick={handleLogout}
              className="btn-primary"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <BackgroundVideo />
        <AnimatedParticles />
        <AnimatedGrid />
        <div className="relative z-10 container mx-auto px-4 py-8" style={{ maxWidth: '1400px' }}>
          <div className="content-card content-card-large mb-6 fade-in">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div style={{ flex: 1 }}>
                <h1 className="title-secondary mb-2">Cast Your Vote</h1>
                <p className="text-body" style={{ fontSize: '16px', marginBottom: '4px' }}>Welcome, <strong style={{ color: '#1E40AF' }}>{currentUser.name}</strong></p>
                <p className="text-body" style={{ fontSize: '14px' }}>You can vote for up to <strong style={{ color: '#1E40AF' }}>{votesPerPerson}</strong> candidate(s)</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message mb-6" style={{ maxWidth: '100%' }}>
              <AlertCircle />
              {error}
            </div>
          )}

          {candidates.length === 0 ? (
            <div className="content-card content-card-large text-center">
              <p className="text-body" style={{ fontSize: '18px' }}>No candidates available yet. Please check back later.</p>
            </div>
          ) : (
            <div className={`card-grid ${cardLayout === 'horizontal' ? 'horizontal' : 'vertical'}`}>
            {candidates.map((candidate, index) => (
              <div
                key={candidate._id}
                className={`candidate-card slide-in-up ${
                  selectedVotes.includes(candidate._id) ? 'selected' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => !loading && handleVoteToggle(candidate._id)}
              >
                <img
                  src={candidate.image}
                  alt={candidate.title}
                  className="candidate-image"
                />
                <div className="candidate-content">
                  <h3 className="candidate-title">{candidate.title}</h3>
                  <p className="candidate-description">{candidate.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoteToggle(candidate._id);
                    }}
                    disabled={loading}
                    className={selectedVotes.includes(candidate._id) ? 'btn-primary' : 'btn-secondary'}
                    style={{ width: '100%' }}
                  >
                    {selectedVotes.includes(candidate._id) ? 'Selected ✓' : 'Vote'}
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}

          {selectedVotes.length > 0 && (
            <div className="submit-button-fixed scale-in">
              <button
                onClick={submitVotes}
                disabled={loading}
                className="btn-primary"
                style={{ background: '#059669' }}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Submitting...
                  </>
                ) : (
                  `Submit Vote (${selectedVotes.length}/${votesPerPerson})`
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin View
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <BackgroundVideo />
        <AnimatedParticles />
        <AnimatedGrid />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="content-card content-card-large mb-6 fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="title-secondary mb-2">Admin Dashboard</h1>
                <p className="text-body">Welcome, {currentUser.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="content-card content-card-large mb-6">
            <div className="tab-nav">
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
                  className={`tab-button ${adminTab === tab.id ? 'active' : ''}`}
                >
                  <tab.icon />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message mb-6">
              <AlertCircle />
              {error}
            </div>
          )}

          {adminTab === 'candidates' && (
            <div className="fade-in">
              <div className="form-section slide-in-up">
                <h2 className="form-section-title">
                  <Plus />
                  Add New Candidate
                </h2>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newCandidate.title}
                    onChange={(e) => setNewCandidate({ ...newCandidate, title: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newCandidate.description}
                    onChange={(e) => setNewCandidate({ ...newCandidate, description: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Image URL (optional)"
                    value={newCandidate.image}
                    onChange={(e) => setNewCandidate({ ...newCandidate, image: e.target.value })}
                    className="input-field"
                  />
                </div>
                <button
                  onClick={addCandidate}
                  disabled={loading || !newCandidate.title || !newCandidate.description}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Candidate'
                  )}
                </button>
              </div>

              <div className="card-grid">
                {candidates.map((candidate, index) => (
                  <div key={candidate._id} className="candidate-card slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <img src={candidate.image} alt={candidate.title} className="candidate-image" />
                    <div className="candidate-content">
                      <h3 className="candidate-title">{candidate.title}</h3>
                      <p className="candidate-description">{candidate.description}</p>
                      <button
                        onClick={() => deleteCandidate(candidate._id)}
                        disabled={loading}
                        className="btn-danger"
                        style={{ width: '100%' }}
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
            <div className="fade-in">
              <div className="content-card content-card-large mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="title-secondary mb-0">Voting Results</h2>
                  <button
                    onClick={loadAllData}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="card-grid">
                {candidates.length === 0 ? (
                  <div className="content-card content-card-large text-center">
                    <p className="text-body" style={{ fontSize: '18px' }}>No candidates available.</p>
                  </div>
                ) : (
                  candidates.map((candidate, index) => (
                    <div key={candidate._id} className="candidate-card slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <img src={candidate.image} alt={candidate.title} className="candidate-image" />
                      <div className="candidate-content">
                        <h3 className="candidate-title">{candidate.title}</h3>
                        <p className="candidate-description">{candidate.description}</p>
                        <div className="text-center mt-4">
                          <div className="text-4xl font-bold mb-1" style={{ color: '#1E40AF' }}>
                            {typeof candidate.votes === 'number' ? candidate.votes : 0}
                          </div>
                          <div className="text-body">Votes</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminTab === 'voters' && (
            <div className="fade-in">
              <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                <button
                  onClick={resetAllVoters}
                  disabled={loading || voters.length === 0}
                  className="btn-danger"
                >
                  Reset All Voters
                </button>
              </div>
              <div className="form-section slide-in-up">
                <h2 className="form-section-title">
                  <UserPlus />
                  Add New Voter
                </h2>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newVoter.name}
                    onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newVoter.email}
                    onChange={(e) => setNewVoter({ ...newVoter, email: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newVoter.password}
                    onChange={(e) => setNewVoter({ ...newVoter, password: e.target.value })}
                    className="input-field"
                  />
                </div>
                <button
                  onClick={addVoter}
                  disabled={loading || !newVoter.name || !newVoter.email || !newVoter.password}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Voter'
                  )}
                </button>
              </div>

              <div className="card-grid">
                {voters.map((voter, index) => (
                  <div key={voter._id} className="candidate-card slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="candidate-content">
                      <h3 className="candidate-title">{voter.name}</h3>
                      <p className="text-body mb-3">{voter.email}</p>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-3 h-3 rounded-full ${voter.hasVoted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-body">{voter.hasVoted ? 'Voted' : 'Not Voted'}</span>
                      </div>
                      {voter.hasVoted && (
                        <button
                          onClick={() => resetVoterVote(voter._id)}
                          disabled={loading}
                          className="btn-secondary"
                          style={{ width: '100%', marginTop: '8px' }}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset Vote
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'admins' && (
            <div className="fade-in">
              <div className="form-section slide-in-up">
                <h2 className="form-section-title">
                  <Shield />
                  Add New Admin
                </h2>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="input-field"
                  />
                </div>
                <button
                  onClick={addAdmin}
                  disabled={loading || !newAdmin.name || !newAdmin.email || !newAdmin.password}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Admin'
                  )}
                </button>
              </div>

              <div className="card-grid">
                {admins.map((admin, index) => (
                  <div key={admin._id} className="candidate-card slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="candidate-content">
                      <h3 className="candidate-title">{admin.name}</h3>
                      <p className="text-body">{admin.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'settings' && (
            <div className="fade-in">
              <div className="form-section slide-in-up">
                <h2 className="form-section-title">
                  <Settings />
                  Voting Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-label">Votes per Person</label>
                    <select
                      value={votesPerPerson}
                      onChange={(e) => updateVotesPerPerson(parseInt(e.target.value))}
                      className="input-field"
                      style={{ cursor: 'pointer' }}
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-label">Candidate Card Layout</label>
                    <select
                      value={cardLayout}
                      onChange={(e) => updateCardLayout(e.target.value)}
                      className="input-field"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                    <p className="text-xs" style={{ color: '#64748B', marginTop: '4px' }}>
                      Choose how candidates are displayed on voting page.
                    </p>
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

function App() {
  return <VotingSystem />;
}

export default App;
