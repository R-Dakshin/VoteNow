# VoteHub - Digital Voting System

A full-stack voting system built with React frontend and Node.js/Express backend with MongoDB.

## Prerequisites

Before running the application, make sure you have installed:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - **Local MongoDB**: [Download MongoDB Community Edition](https://www.mongodb.com/try/download/community)
   - **MongoDB Atlas** (Cloud): [Sign up for free](https://www.mongodb.com/cloud/atlas)

## Installation & Setup

### Step 1: Install Backend Dependencies

Open a terminal in the project root directory (`C:\Users\HP\Downloads\Vote`) and run:

```bash
npm install
```

This will install:
- express
- mongoose
- cors
- bcryptjs

### Step 2: Install Frontend Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd votehub-frontend
npm install
cd ..
```

## Running the Application

### Step 1: Start MongoDB

**Option A: Local MongoDB**
- If you installed MongoDB locally, start the MongoDB service:
  - **Windows**: MongoDB should start automatically as a service, or run `mongod` in a terminal
  - **Mac/Linux**: Run `mongod` or `sudo systemctl start mongod`

**Option B: MongoDB Atlas (Cloud)**
- No local setup needed! Just get your connection string from MongoDB Atlas dashboard.

### Step 2: Start the Backend Server

Open a terminal in the project root directory and run:

```bash
node server.js
```

Or use npm:

```bash
npm start
```

You should see:
```
✅ VoteHub Backend Server running on port 5000
📡 API available at http://localhost:5000/api
```

**Keep this terminal window open!**

### Step 3: Start the Frontend Application

Open a **NEW** terminal window, navigate to the frontend directory, and run:

```bash
cd votehub-frontend
npm start
```

The React app will automatically open in your browser at `http://localhost:3000`

**Keep this terminal window open too!**

## Initial Setup in the Application

1. **Database Connection**:
   - When the app opens, you'll see the Database Setup screen
   - Enter your MongoDB connection URI:
     - **Local**: `mongodb://localhost:27017`
     - **MongoDB Atlas**: See detailed instructions below
   - Database Name: `votingSystem` (or your preferred name)
   - Click "Connect to Database"

### MongoDB Atlas Connection Setup

**Step 1: Get Your Connection String**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (it will look like):
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=Voting
   ```

**Step 2: Replace Placeholders**
- Replace `<username>` with your database username (e.g., `rdakshin7_db_user`)
- Replace `<password>` with your actual database password
- **Important**: If your password contains special characters like `@`, `#`, `%`, `&`, etc., you need to URL encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `%` becomes `%25`
  - `&` becomes `%26`
  - `/` becomes `%2F`
  - `:` becomes `%3A`

**Step 3: Format the Connection String**
Your final connection string should look like:
```
mongodb+srv://rdakshin7_db_user:YourActualPassword@voting.inpdqma.mongodb.net/?appName=Voting
```

**Step 4: Common Issues**
- ❌ **"Authentication failed"**: Check your username and password are correct
- ❌ **"Cannot reach server"**: Check your internet connection
- ❌ **"IP not whitelisted"**: Go to MongoDB Atlas → Network Access → Add your IP address (or use `0.0.0.0/0` for all IPs - less secure)
- ❌ **"Invalid password"**: Make sure you replaced `<db_password>` with your actual password

**Example with special characters in password:**
If your password is `MyP@ss#123`, the connection string should be:
```
mongodb+srv://rdakshin7_db_user:MyP%40ss%23123@voting.inpdqma.mongodb.net/?appName=Voting
```

2. **Default Admin Credentials**:
   - After connecting, you can login as admin with:
     - **Email**: `admin@vote.com`
     - **Password**: `admin123`

3. **Create Voters**:
   - Login as admin
   - Go to "Manage Voters" tab
   - Add voter accounts with name, email, and password

4. **Add Candidates**:
   - Go to "Manage Candidates" tab
   - Add candidates with title, description, and optional image URL

5. **Configure Settings**:
   - Go to "Settings" tab
   - Set how many votes each person can cast (default: 1)

## Usage

### As Admin:
- Manage candidates
- View voting results
- Manage voters and admins
- Configure voting settings

### As Voter:
- Login with voter credentials
- View available candidates
- Cast your vote(s)
- View confirmation after voting

## Project Structure

```
Vote/
├── server.js                 # Backend Express server
├── package.json              # Backend dependencies
├── votehub-frontend/        # React frontend
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   └── index.js         # React entry point
│   └── package.json         # Frontend dependencies
└── README.md                # This file
```

## API Endpoints

The backend server provides these endpoints:

- `POST /api/init` - Initialize database connection
- `POST /api/admin/login` - Admin login
- `POST /api/voter/login` - Voter login
- `GET /api/admins` - Get all admins
- `POST /api/admins` - Create admin
- `GET /api/voters` - Get all voters
- `POST /api/voters` - Create voter
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate
- `DELETE /api/candidates/:id` - Delete candidate
- `POST /api/vote` - Submit vote
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/health` - Health check

## Troubleshooting

### Port Already in Use
- **Backend (port 5000)**: Change `PORT` in `server.js` or stop the process using port 5000
- **Frontend (port 3000)**: React will ask to use a different port automatically

### MongoDB Connection Issues
- Make sure MongoDB is running (if using local)
- Check your connection string is correct
- For MongoDB Atlas, ensure your IP is whitelisted and credentials are correct

### CORS Errors
- Make sure the backend server is running before starting the frontend
- Check that the API_URL in `App.js` matches your backend URL

### Module Not Found Errors
- Run `npm install` in both root and `votehub-frontend` directories
- Delete `node_modules` folders and `package-lock.json`, then reinstall

## Stopping the Application

1. Press `Ctrl + C` in both terminal windows to stop the servers
2. Close the browser tab

## Notes

- The backend server must be running for the frontend to work
- Database must be initialized through the UI before using other features
- Default admin account is created automatically on first database connection
- All passwords are hashed using bcryptjs for security
