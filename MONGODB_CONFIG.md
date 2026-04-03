# MongoDB Connection Configuration

## Your MongoDB Atlas Connection String

**Base Connection String:**
```
mongodb+srv://<your_db_username>:<db_password>@<your_cluster_address>.mongodb.net/?appName=Voting
```

## Complete Connection String for Vercel

To use this connection string in Vercel, you need to:

1. **Replace `<db_password>`** with your actual MongoDB database password
2. **Add the database name** (`votingSystem`) before the `?`
3. **Add recommended connection parameters**

**Final Format for Vercel Environment Variable:**

```
mongodb+srv://<your_db_username>:YOUR_PASSWORD@<your_cluster_address>.mongodb.net/votingSystem?retryWrites=true&w=majority&appName=Voting
```

## Password URL Encoding

If your password contains special characters, you MUST URL encode them:

| Character | URL Encoded |
|-----------|-------------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `/` | `%2F` |
| `:` | `%3A` |
| `?` | `%3F` |
| `=` | `%3D` |
| `+` | `%2B` |
| ` ` (space) | `%20` |

### Example:
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`
- Connection String: 
  ```
  mongodb+srv://<your_db_username>:MyP%40ss%23123@<your_cluster_address>.mongodb.net/votingSystem?retryWrites=true&w=majority&appName=Voting
  ```

## Setting in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `MONGODB_URI`
   - **Value:** Your complete connection string (with password replaced and URL encoded if needed)
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**
5. **IMPORTANT:** Redeploy your application after adding the environment variable

## Verification

To test your connection string, you can use the `/api/health` endpoint after deployment:
```
https://your-project.vercel.app/api/health
```

If the connection is successful, the `/api/init` endpoint should return:
```json
{
  "success": true,
  "message": "Connected to MongoDB successfully"
}
```

## Quick Reference

- **Username:** `<your_db_username>`
- **Cluster:** `<your_cluster_address>.mongodb.net`
- **App Name:** `Voting`
- **Database Name:** `votingSystem` (will be created automatically if it doesn't exist)

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your actual password or connection string to Git
- Always use environment variables in Vercel
- Keep your MongoDB password secure
- Make sure `.env` files are in `.gitignore`

## Troubleshooting

### Connection Fails
1. Verify your password is correct
2. Check if password needs URL encoding
3. Ensure Network Access allows `0.0.0.0/0` in MongoDB Atlas
4. Verify database user has proper permissions

### Authentication Error
- Double-check username: `<your_db_username>`
- Verify password is correct (try resetting in MongoDB Atlas if needed)
- Ensure password is URL encoded if it contains special characters

### Database Not Found
- The database `votingSystem` will be created automatically when the app connects
- You can also manually create it in MongoDB Atlas if needed
