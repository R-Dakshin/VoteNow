# Quick Vercel Deployment Guide

## Prerequisites Checklist

- [ ] MongoDB Atlas account (free tier)
- [ ] Vercel account (free tier)
- [ ] Git repository (GitHub/GitLab/Bitbucket) - **Recommended**

## Step 1: MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free account
   - Create a free M0 cluster (takes 3-5 minutes)

2. **Configure Database Access**
   - Go to **Database Access** → **Add New Database User**
   - Create username and password
   - **Save the password!** You'll need it for the connection string
   - Set privileges to "Atlas admin"

3. **Configure Network Access**
   - Go to **Network Access** → **Add IP Address**
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

4. **Get Connection String**
   - Go to **Database** → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your actual credentials
   - **Important:** URL encode special characters in password:
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
   - Add database name before `?`: `...mongodb.net/votingSystem?retryWrites...`

   **Your MongoDB Connection String Format:**
   ```
   mongodb+srv://rdakshin7_db_user:<db_password>@voting.inpdqma.mongodb.net/votingSystem?retryWrites=true&w=majority&appName=Voting
   ```
   
   **Important:** Replace `<db_password>` with your actual database password. If your password contains special characters, URL encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`
   - `&` → `%26`
   - `/` → `%2F`
   - `:` → `%3A`
   
   **Example with encoded password:**
   ```
   mongodb+srv://rdakshin7_db_user:MyP%40ss%23123@voting.inpdqma.mongodb.net/votingSystem?retryWrites=true&w=majority&appName=Voting
   ```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Ready for Vercel deployment"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import Project to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Vercel will auto-detect settings

3. **Configure Environment Variables**
   - In the deployment page, go to **Settings** → **Environment Variables**
   - Add these variables:
   
   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `MONGODB_URI` | Your MongoDB connection string | Production, Preview, Development |
   | `MONGODB_DB_NAME` | `votingSystem` | Production, Preview, Development |
   | `REACT_APP_API_URL` | `/api` | Production, Preview, Development |

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

### Option B: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow prompts (press Enter for defaults)
   - This creates a preview deployment

4. **Set Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   # Paste your MongoDB connection string
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

## Step 3: Verify Deployment

1. **Check Health Endpoint**
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"success":true,"message":"Server is running"}`

2. **Test Login**
   - Visit your deployment URL
   - Default admin credentials:
     - Email: `admin@vote.com`
     - Password: `admin123`

3. **Test Features**
   - Login as admin
   - Create voters
   - Create candidates
   - Test voting flow

## Important Notes

✅ **DO:**
- Use environment variables for MongoDB URI
- URL encode special characters in MongoDB password
- Redeploy after adding environment variables
- Test the `/api/health` endpoint first

❌ **DON'T:**
- Commit `.env` files to Git
- Hardcode MongoDB connection strings
- Share your MongoDB credentials publicly

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify `vercel.json` configuration
- Check build logs in Vercel dashboard

### API Returns 404
- Verify `api/` folder structure is correct
- Check that API files export default async function
- Ensure `vercel.json` rewrites are configured

### Database Connection Fails
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas Network Access (should allow 0.0.0.0/0)
- Ensure password is URL-encoded
- Verify database user has correct permissions

### Frontend Can't Connect to API
- Verify `REACT_APP_API_URL` is set to `/api`
- Check browser console for errors
- Ensure API routes handle CORS correctly

## Next Steps

After successful deployment:
1. Change default admin password
2. Create additional admin accounts
3. Add voters and candidates
4. Configure voting settings
5. Share the application URL

## Support

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Check `DEPLOYMENT.md` for detailed information

🎉 **Your VoteHub application is now live on Vercel!**
