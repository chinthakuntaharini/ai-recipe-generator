# AWS Amplify Deployment Steps

## Quick Deployment Guide

### Prerequisites
- ✅ AWS account with Amplify access
- ✅ Git repository (already initialized)
- ✅ Backend APIs deployed (Auth & Recipe Generation)

### Option 1: Automated Deployment (Recommended)

Run the PowerShell deployment script:

```powershell
cd recipe-app-v2
.\deploy-to-amplify.ps1
```

This script will:
1. Create an Amplify app
2. Configure environment variables
3. Provide instructions for connecting your Git repository

### Option 2: Manual Deployment via AWS Console

#### Step 1: Commit and Push Code

```bash
# Add all files
git add .

# Commit changes
git commit -m "Prepare frontend for Amplify deployment"

# Push to remote (if you have a remote configured)
git push origin main
```

#### Step 2: Create Amplify App

1. Open AWS Console: https://console.aws.amazon.com/amplify/
2. Click "New app" > "Host web app"
3. Choose deployment method:
   - **With Git**: Connect GitHub/GitLab/Bitbucket
   - **Without Git**: Manual deployment (see Option 3 below)

#### Step 3: Connect Repository (If using Git)

1. Select your Git provider
2. Authorize AWS Amplify
3. Select repository: `your-repo-name`
4. Select branch: `main`
5. Click "Next"

#### Step 4: Configure Build Settings

Amplify should auto-detect Next.js. Verify the build configuration:

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

Click "Next"

#### Step 5: Add Environment Variables

Add these environment variables in the Amplify Console:

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

#### Step 6: Deploy

1. Click "Save and deploy"
2. Wait for build to complete (5-10 minutes)
3. Access your app at the Amplify-provided URL

### Option 3: Manual Deployment without Git

If you don't have a Git remote configured:

#### Step 1: Build Locally

```bash
cd recipe-app-v2
npm install
npm run build
```

#### Step 2: Create Amplify App via CLI

```bash
aws amplify create-app \
  --name ai-recipe-generator-frontend \
  --region us-east-1 \
  --platform WEB
```

Note the `appId` from the response.

#### Step 3: Set Environment Variables

```bash
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --region us-east-1 \
  --environment-variables '{
    "NEXT_PUBLIC_AWS_REGION":"us-east-1",
    "NEXT_PUBLIC_COGNITO_USER_POOL_ID":"us-east-1_N0KMxM07E",
    "NEXT_PUBLIC_COGNITO_CLIENT_ID":"1ia9lcg1nsld42j3giuvaeeo1b",
    "NEXT_PUBLIC_AUTH_API_URL":"https://nuz5dbksz2.execute-api.us-east-1.amazonaws.com/dev",
    "NEXT_PUBLIC_RECIPE_API_URL":"https://f3ohu70iha.execute-api.us-east-1.amazonaws.com/dev",
    "NEXT_PUBLIC_API_GENERATE_ENDPOINT":"/generate-recipe",
    "NEXT_PUBLIC_API_REGISTER_ENDPOINT":"/register",
    "NEXT_PUBLIC_API_LOGIN_ENDPOINT":"/login",
    "NEXT_PUBLIC_API_CONFIRM_EMAIL_ENDPOINT":"/confirm-email"
  }'
```

#### Step 4: Create Manual Deployment

```bash
# Create deployment
aws amplify create-deployment \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --region us-east-1
```

Note the `uploadUrl` and `zipUploadUrl` from the response.

#### Step 5: Package and Upload

```bash
# Create deployment package
zip -r deployment.zip .next public package.json next.config.js node_modules

# Upload to S3 (use the uploadUrl from previous step)
curl -X PUT -T deployment.zip "UPLOAD_URL_FROM_PREVIOUS_STEP"
```

#### Step 6: Start Deployment

```bash
aws amplify start-deployment \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id JOB_ID_FROM_CREATE_DEPLOYMENT \
  --region us-east-1
```

## Post-Deployment Verification

After deployment completes:

1. ✅ Navigate to the Amplify URL
2. ✅ Test user registration
3. ✅ Test user login
4. ✅ Test recipe generation
5. ✅ Check browser console for errors

## Troubleshooting

### Build Fails

**Error**: "Module not found"
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: "Environment variable not found"
- Verify all environment variables are set in Amplify Console
- Check variable names match exactly (case-sensitive)

### Runtime Errors

**Error**: "Failed to fetch"
- Verify API Gateway URLs are correct
- Check CORS configuration on backend APIs
- Verify APIs are deployed and accessible

**Error**: "Authentication failed"
- Verify Cognito User Pool ID and Client ID
- Check Cognito app client settings
- Verify redirect URLs in Cognito

## Monitoring

### View Logs

1. Open Amplify Console
2. Click on your app
3. Click "Monitoring" tab
4. View build logs and runtime logs

### CloudWatch Logs

Access detailed logs in CloudWatch:
```bash
aws logs tail /aws/amplify/YOUR_APP_ID --follow
```

## Updating the Deployment

After making changes:

```bash
# Commit changes
git add .
git commit -m "Update frontend"

# Push to trigger automatic deployment
git push origin main
```

Amplify will automatically rebuild and redeploy.

## Cost Estimate

AWS Amplify Free Tier:
- 1,000 build minutes/month
- 15 GB served/month
- 5 GB storage

After free tier:
- $0.01 per build minute
- $0.15 per GB served

Estimated monthly cost: $0-5 for low traffic

## Support

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js on Amplify](https://docs.amplify.aws/guides/hosting/nextjs/q/platform/js/)
- [Amplify Console](https://console.aws.amazon.com/amplify/)

---

**Ready to deploy!** Choose your preferred option above and follow the steps.
