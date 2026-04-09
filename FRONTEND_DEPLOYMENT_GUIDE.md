# Frontend Deployment to AWS Amplify - Manual Guide

## Current Status
- ✅ Backend APIs deployed (Auth & Recipe Generation)
- ✅ Frontend code ready in `recipe-app-v2/`
- ✅ Git repository configured
- ❌ IAM user lacks Amplify permissions (needs manual console deployment)

## Deployment Steps

### Step 1: Commit Your Code

First, commit all the changes to Git:

```bash
cd recipe-app-v2

# Add all files
git add .

# Commit
git commit -m "Prepare frontend for AWS Amplify deployment"

# Push to remote
git push origin main
```

### Step 2: Open AWS Amplify Console

1. Open your web browser
2. Navigate to: https://console.aws.amazon.com/amplify/home?region=us-east-1
3. Sign in with your AWS account (use the root account or an IAM user with Amplify permissions)

### Step 3: Create New Amplify App

1. Click the orange "New app" button
2. Select "Host web app"
3. Choose your Git provider:
   - **GitHub** (recommended if your code is on GitHub)
   - GitLab
   - Bitbucket
   - AWS CodeCommit

### Step 4: Authorize and Connect Repository

1. Click "Authorize" to allow AWS Amplify to access your Git account
2. Select your repository: `ai-recipe-generator` (or whatever your repo is named)
3. Select branch: `main`
4. Click "Next"

### Step 5: Configure Build Settings

Amplify should auto-detect Next.js. Verify the configuration shows:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Important**: Set the app root directory to `recipe-app-v2` since your frontend is in a subdirectory.

Click "Next"

### Step 6: Add Environment Variables

Before clicking "Save and deploy", add these environment variables:

Click "Advanced settings" > "Environment variables" > "Add environment variable"

Add each of these:

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_AWS_REGION` | `us-east-1` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `us-east-1_N0KMxM07E` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `1ia9lcg1nsld42j3giuvaeeo1b` |
| `NEXT_PUBLIC_AUTH_API_URL` | `https://nuz5dbksz2.execute-api.us-east-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_RECIPE_API_URL` | `https://f3ohu70iha.execute-api.us-east-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_API_GENERATE_ENDPOINT` | `/generate-recipe` |
| `NEXT_PUBLIC_API_REGISTER_ENDPOINT` | `/register` |
| `NEXT_PUBLIC_API_LOGIN_ENDPOINT` | `/login` |
| `NEXT_PUBLIC_API_CONFIRM_EMAIL_ENDPOINT` | `/confirm-email` |

### Step 7: Deploy

1. Click "Save and deploy"
2. Wait for the build to complete (typically 5-10 minutes)
3. Watch the build logs for any errors

### Step 8: Access Your Deployed App

Once deployment completes:

1. You'll see a URL like: `https://main.d1234abcd.amplifyapp.com`
2. Click on the URL to open your deployed application
3. Test the following:
   - ✅ Page loads without errors
   - ✅ User registration works
   - ✅ User login works
   - ✅ Recipe generation works

## Troubleshooting

### Build Fails with "Module not found"

**Solution**: The build might be looking in the wrong directory.

1. Go to Amplify Console > App settings > Build settings
2. Set "App root directory" to `recipe-app-v2`
3. Save and redeploy

### Build Fails with "Environment variable not found"

**Solution**: Environment variables weren't set correctly.

1. Go to Amplify Console > App settings > Environment variables
2. Verify all variables are present and values are correct
3. Redeploy the app

### App Loads but API Calls Fail

**Solution**: CORS or API endpoint issues.

1. Check browser console for specific errors
2. Verify API Gateway URLs are correct
3. Check that CORS is enabled on your API Gateway endpoints

### Authentication Doesn't Work

**Solution**: Cognito configuration issue.

1. Verify Cognito User Pool ID and Client ID are correct
2. Check Cognito app client settings:
   - Go to Cognito Console
   - Select your user pool
   - Go to "App clients"
   - Verify the client ID matches
   - Check "Hosted UI" settings if using

## Post-Deployment Configuration

### Enable Custom Domain (Optional)

1. Go to Amplify Console > Domain management
2. Click "Add domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

### Enable Branch Deployments

Amplify automatically creates preview deployments for feature branches:

1. Create a new branch: `git checkout -b feature/new-feature`
2. Push to remote: `git push origin feature/new-feature`
3. Amplify creates a preview URL automatically
4. Test on preview URL before merging to main

### Monitor Your App

1. Go to Amplify Console > Monitoring
2. View metrics:
   - Request count
   - Error rate
   - Latency
   - Data transfer

## Continuous Deployment

Once set up, Amplify automatically deploys when you push to your repository:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Amplify automatically builds and deploys
```

## Cost Estimate

**AWS Amplify Free Tier:**
- 1,000 build minutes/month
- 15 GB served/month
- 5 GB storage

**After Free Tier:**
- $0.01 per build minute
- $0.15 per GB served

**Estimated Monthly Cost**: $0-5 for low traffic applications

## Alternative: Deploy Without Git

If you don't want to use Git integration:

### Option A: Use Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
cd recipe-app-v2
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Option B: Use AWS S3 + CloudFront

If Amplify doesn't work, you can deploy to S3:

```bash
# Build the app
cd recipe-app-v2
npm run build
npm run export  # If using static export

# Upload to S3
aws s3 sync out/ s3://your-bucket-name --delete

# Configure CloudFront for distribution
```

## Support Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js on Amplify Guide](https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/)
- [Amplify Console](https://console.aws.amazon.com/amplify/)
- [AWS Support](https://aws.amazon.com/support/)

## Next Steps After Deployment

Once your frontend is deployed:

1. ✅ Test all features thoroughly
2. ✅ Deploy missing backend services (Profile API, Recipe History API)
3. ✅ Create DynamoDB tables (Users, RecipeHistory)
4. ✅ Integrate profile management features
5. ✅ Integrate recipe history features
6. ✅ Set up monitoring and alerts
7. ✅ Configure custom domain (optional)

---

**Ready to deploy!** Follow the steps above to get your frontend live on AWS Amplify.

**Your Git Repository**: https://github.com/chinthakuntaharini/ai-recipe-generator.git
