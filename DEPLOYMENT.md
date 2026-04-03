# VoteHub Deployment Guide - Vercel

This guide will walk you through deploying the VoteHub voting system to Vercel.

## Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster (M0 Sandbox)

2. **Vercel Account** (Free tier available)
   - Sign up at [Vercel](https://vercel.com)
   - Connect your GitHub account (recommended) or use email

3. **Git Repository** (Optional but recommended)
   - GitHub, GitLab, or Bitbucket account

## Step 1: Set Up MongoDB Atlas

### 1.1 Create a Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Create" or "Build a Database"
3. Choose the **FREE (M0) Sandbox** tier
4. Select a cloud provider and region (choose closest to your users)
5. Click "Create Cluster" (takes 3-5 minutes)

### 1.2 Create Database User
1. Go to **Database Access** in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and generate a secure password
5. **Save the password** - you'll need it later!
6. Set user privileges to "Atlas admin" or "Read and write to any database"
7. Click "Add User"

### 1.3 Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click "Add IP Address"
3. For Vercel deployment, click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note:** For production, consider restricting IPs for better security
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to **Database** in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as the driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password
   - **Important:** If your password contains special characters, URL encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
     - `&` → `%26`
     - `/` → `%2F`
     - `:` → `%3A`
8. Add the database name at the end (before `?`):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/votingSystem?retryWrites=true&w=majority
   ```

**Example:**
```
mongodb+srv://myuser:MyP%40ss%23123@cluster0.abc123.mongodb.net/votingSystem?retryWrites=true&w=majority
```

## Step 2: Prepare Your Code for Deployment

### 2.1 Verify Project Structure
Your project should have this structure:
```
Vote/
├── api/                    # Serverless functions
│   ├── _db.js             # Database connection
│   ├── init.js
│   ├── health.js
│   ├── admins.js
│   ├── voters.js
│   ├── candidates.js
│   ├── vote.js
│   ├── settings.js
│   ├── admin/
│   │   └── login.js
│   └── voter/
│       └── login.js
├── votehub-frontend/       # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── vercel.json             # Vercel configuration
└── package.json
```

### 2.2 Commit to Git (Recommended)
```bash
git init
git add .
git commit -m "Prepare for Vercel deployment"
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Or click "Deploy" and drag your project folder

2. **Configure Project**
   - **Framework Preset:** Other (or leave as auto-detect)
   - **Root Directory:** Leave as `.` (root)
   - **Build Command:** `cd votehub-frontend && npm install && npm run build`
   - **Output Directory:** `votehub-frontend/build`
   - Click "Deploy"

3. **Set Environment Variables**
   - After deployment starts, go to **Settings** → **Environment Variables**
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string | Production, Preview, Development |
   | `MONGODB_DB_NAME` | `votingSystem` (optional) | Production, Preview, Development |
   | `REACT_APP_API_URL` | `/api` | Production, Preview, Development |

**Your MongoDB Connection String Format:**
```
mongodb+srv://<your_db_username>:<db_password>@<your_cluster_address>.mongodb.net/votingSystem?retryWrites=true&w=majority&appName=Voting
```

**Important:** Replace `<db_password>` with your actual database password. URL encode special characters if needed:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `/` → `%2F`
- `:` → `%3A`

**Example with encoded password:**
```
mongodb+srv://<your_db_username>:MyP%40ss%23123@<your_cluster_address>.mongodb.net/votingSystem?retryWrites=true&w=majority&appName=Voting
```

4. **Redeploy**
   - After adding environment variables, go to **Deployments**
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - This ensures environment variables are available

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Set up and deploy? **Yes**
     - Which scope? (Select your account)
     - Link to existing project? **No**
     - Project name? (Press Enter for default)
     - Directory? (Press Enter for current directory)
     - Override settings? **No**

4. **Set Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   # Paste your MongoDB connection string when prompted
   # Select: Production, Preview, Development
   
   vercel env add MONGODB_DB_NAME
   # Enter: votingSystem
   # Select: Production, Preview, Development
   
   vercel env add REACT_APP_API_URL
   # Enter: /api
   # Select: Production, Preview, Development
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 4: Verify Deployment

1. **Check Deployment Status**
   - Go to your Vercel dashboard
   - Check that the deployment completed successfully (green checkmark)

2. **Test the Application**
   - Visit your deployment URL (e.g., `https://your-project.vercel.app`)
   - The app should automatically connect to MongoDB (no setup screen in production)
   - You should see the login screen

3. **Test Login**
   - Default admin credentials:
     - **Email:** `admin@vote.com`
     - **Password:** `admin123`
   - Login and verify the admin dashboard loads

4. **Test API Endpoints**
   - Visit `https://your-project.vercel.app/api/health`
   - Should return: `{"success":true,"message":"Server is running"}`

## Step 5: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, takes a few minutes)

## Troubleshooting

### Issue: "MongoDB URI not configured"
**Solution:** 
- Verify `MONGODB_URI` is set in Vercel environment variables
- Make sure you redeployed after adding environment variables
- Check that the variable is set for the correct environment (Production/Preview)

### Issue: "Authentication failed"
**Solution:**
- Verify your MongoDB username and password are correct
- Check that special characters in password are URL-encoded
- Ensure the database user has proper permissions

### Issue: "IP not whitelisted"
**Solution:**
- Go to MongoDB Atlas → Network Access
- Add `0.0.0.0/0` to allow all IPs (for Vercel)
- Or add Vercel's IP ranges (check Vercel docs for current IPs)

### Issue: "Build failed"
**Solution:**
- Check build logs in Vercel dashboard
- Verify `package.json` files are correct
- Ensure all dependencies are listed
- Check that `vercel.json` is properly configured

### Issue: "API routes return 404"
**Solution:**
- Verify `api/` directory structure is correct
- Check that route files export a default function
- Ensure `vercel.json` rewrites are configured correctly

### Issue: "Frontend can't connect to API"
**Solution:**
- Verify `REACT_APP_API_URL` is set to `/api` in environment variables
- Check browser console for CORS errors
- Ensure API routes have CORS headers set

### Issue: "Database connection timeout"
**Solution:**
- Check MongoDB Atlas cluster is running
- Verify connection string is correct
- Check network access settings in MongoDB Atlas
- Consider upgrading Vercel plan if timeout is too short (free tier: 10s)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/votingSystem?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Database name (optional) | `votingSystem` |
| `REACT_APP_API_URL` | Frontend API URL | `/api` (production) or `http://localhost:5000/api` (local) |

## Local Development

To run locally after deployment:

1. **Backend (for local testing)**
   ```bash
   node server.js
   ```

2. **Frontend**
   ```bash
   cd votehub-frontend
   npm start
   ```

3. **Environment Variables**
   - Create `votehub-frontend/.env.local`:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

## Security Notes

1. **Never commit** `.env` files or MongoDB connection strings to Git
2. **Use environment variables** for all sensitive data
3. **Restrict MongoDB IP access** in production if possible
4. **Use strong passwords** for database users
5. **Enable MongoDB Atlas security features** (encryption at rest, etc.)

## Support

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Project Issues:** Check the main README.md

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with proper permissions
- [ ] Network access configured (0.0.0.0/0 for Vercel)
- [ ] Connection string obtained and URL-encoded
- [ ] Project deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Application redeployed after setting env vars
- [ ] Health check endpoint works (`/api/health`)
- [ ] Login works with default admin credentials
- [ ] Can create voters and candidates
- [ ] Voting functionality works
- [ ] Results display correctly

## Next Steps

1. **Change default admin password** after first login
2. **Create additional admin accounts** as needed
3. **Add voters** through the admin dashboard
4. **Add candidates** for voting
5. **Configure voting settings** (votes per person)
6. **Test the complete voting flow**
7. **Share the application URL** with voters

Congratulations! Your VoteHub application is now deployed and ready to use! 🎉
