# Quick Deployment Guide - Run on Your PC

This guide will help you deploy the backend APIs and run the frontend locally.

## Prerequisites

Make sure you have:
- ✅ AWS CLI configured (`aws configure`)
- ✅ Node.js 18+ installed
- ✅ Your AWS credentials set up

## Step 1: Deploy Backend APIs (5-10 minutes)

Open your terminal and run these commands:

```bash
# Navigate to backend directory
cd ai-recipe-generator-backend

# Install dependencies (if not already done)
npm install

# Build the TypeScript code
npm run build

# Deploy Profile API (handles user profiles)
bash deploy-profile-api.sh

# Deploy Recipe History API (handles saved recipes)
bash deploy-recipe-history-api.sh
```

**What this does:**
- Creates DynamoDB tables (Users and RecipeHistory)
- Deploys Lambda functions for profile and recipe management
- Creates API Gateway endpoints
- Outputs the API URLs you'll need

## Step 2: Get Your API URLs

After deployment completes, you'll see output like:

```
API URL: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

**Copy these URLs** - you'll need them for the frontend!

## Step 3: Update Frontend Configuration

```bash
# Navigate to frontend directory
cd ../recipe-app-v2

# Edit .env.local file
# Update this line with your actual API Gateway URL:
NEXT_PUBLIC_API_GATEWAY_URL=https://your-actual-api-id.execute-api.us-east-1.amazonaws.com/prod
```

The file already has your Cognito credentials:
- User Pool ID: `us-east-1_N0KMxM07E`
- Client ID: `1ia9lcg1nsld42j3giuvaeeo1b`

## Step 4: Run Frontend Locally

```bash
# Still in recipe-app-v2 directory

# Install dependencies (takes 2-5 minutes)
npm install

# Start development server (takes 10-30 seconds)
npm run dev
```

## Step 5: Open in Browser

Open your browser to: **http://localhost:3000**

You should see the AI Recipe Generator with:
- ✨ Floating food animations
- 🖱️ Custom frying pan cursor
- 📝 Sign up / Login page

## Testing the App

1. **Sign Up**: Create a new account
2. **Onboarding**: Complete the 7-step setup wizard
3. **Generate Recipe**: Enter ingredients and customize options
4. **View Profile**: Check your profile page
5. **Recipe History**: View saved recipes

## Troubleshooting

### If deployment fails:

**Check AWS credentials:**
```bash
aws sts get-caller-identity
```

**Check AWS region:**
```bash
aws configure get region
# Should output: us-east-1
```

### If frontend won't start:

**Clear node_modules and reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Check Node version:**
```bash
node --version
# Should be 18.x or higher
```

### If API calls fail:

1. Check `.env.local` has correct API Gateway URL
2. Restart dev server after changing `.env.local`
3. Check browser console for errors
4. Verify you're logged in with valid JWT token

## What's Deployed

### Backend (AWS):
- **Profile API**: 3 Lambda functions
  - GET /profile
  - PUT /profile
  - POST /profile/onboarding
  
- **Recipe History API**: 4 Lambda functions
  - GET /recipes
  - GET /recipes/:id
  - PUT /recipes/:id/favorite
  - DELETE /recipes/:id

- **DynamoDB Tables**:
  - Users-dev
  - RecipeHistory-dev

### Frontend (Local):
- Next.js app running on http://localhost:3000
- React components with animations
- AWS Cognito authentication
- API client for backend calls

## Cost Estimate

Running this locally with AWS backend:
- **DynamoDB**: ~$0.25/month (on-demand pricing)
- **Lambda**: Free tier covers ~1M requests/month
- **API Gateway**: Free tier covers ~1M requests/month
- **Cognito**: Free tier covers 50,000 MAUs

**Total: ~$0-5/month** for development/testing

## Next Steps

Once everything works locally:
1. Deploy frontend to Vercel/AWS Amplify (see recipe-app-v2/DEPLOYMENT.md)
2. Set up custom domain
3. Configure production environment variables
4. Enable CloudWatch monitoring

## Need Help?

Check these files for more details:
- `ai-recipe-generator-backend/DEPLOYMENT.md` - Backend deployment details
- `recipe-app-v2/README.md` - Frontend setup and features
- `recipe-app-v2/INTEGRATION_TESTING.md` - Testing guide
