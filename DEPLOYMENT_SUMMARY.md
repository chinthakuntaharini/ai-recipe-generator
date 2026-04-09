# AWS Deployment Summary

## Current Deployment Status

### ✅ Deployed Services

1. **Authentication API**
   - Stack: `ai-recipe-auth-api`
   - Endpoint: `https://nuz5dbksz2.execute-api.us-east-1.amazonaws.com/dev`
   - Functions: Register, Login, Confirm Email, Resend Confirmation
   - Status: **ACTIVE**

2. **Recipe Generation API**
   - Stack: `ai-recipe-generation-api`
   - Endpoint: `https://f3ohu70iha.execute-api.us-east-1.amazonaws.com/dev`
   - Function: Recipe generation with Amazon Bedrock
   - Status: **ACTIVE**

3. **Amazon Cognito**
   - User Pool ID: `us-east-1_N0KMxM07E`
   - Client ID: `1ia9lcg1nsld42j3giuvaeeo1b`
   - Status: **CONFIGURED**

### ❌ Not Yet Deployed

1. **Profile Management API**
   - CloudFormation template: `ai-recipe-generator-backend/cloudformation/profile-api-stack.yaml`
   - Status: **READY TO DEPLOY**

2. **Recipe History API**
   - CloudFormation template: `ai-recipe-generator-backend/cloudformation/recipe-history-api-stack.yaml`
   - Status: **READY TO DEPLOY**

3. **DynamoDB Tables**
   - Users Table
   - RecipeHistory Table
   - Status: **NEEDS CREATION**

4. **Frontend Application**
   - Location: `recipe-app-v2/`
   - Target: AWS Amplify
   - Status: **READY TO DEPLOY** (see deployment guide below)

## Frontend Deployment Instructions

### Quick Start

Your frontend is ready to deploy to AWS Amplify. Follow these steps:

1. **Commit your code** (if not already done):
   ```bash
   cd recipe-app-v2
   git add .
   git commit -m "Prepare for Amplify deployment"
   git push origin main
   ```

2. **Deploy via AWS Console**:
   - Open: https://console.aws.amazon.com/amplify/home?region=us-east-1
   - Click "New app" > "Host web app"
   - Connect your GitHub repository: `https://github.com/chinthakuntaharini/ai-recipe-generator.git`
   - Select branch: `main`
   - Set app root directory: `recipe-app-v2`
   - Add environment variables (see below)
   - Click "Save and deploy"

3. **Environment Variables to Add**:
   ```
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_N0KMxM07E
   NEXT_PUBLIC_COGNITO_CLIENT_ID=1ia9lcg1nsld42j3giuvaeeo1b
   NEXT_PUBLIC_AUTH_API_URL=https://nuz5dbksz2.execute-api.us-east-1.amazonaws.com/dev
   NEXT_PUBLIC_RECIPE_API_URL=https://f3ohu70iha.execute-api.us-east-1.amazonaws.com/dev
   NEXT_PUBLIC_API_GENERATE_ENDPOINT=/generate-recipe
   NEXT_PUBLIC_API_REGISTER_ENDPOINT=/register
   NEXT_PUBLIC_API_LOGIN_ENDPOINT=/login
   NEXT_PUBLIC_API_CONFIRM_EMAIL_ENDPOINT=/confirm-email
   ```

### Detailed Instructions

See: **FRONTEND_DEPLOYMENT_GUIDE.md** for complete step-by-step instructions.

## What Works Right Now

With the currently deployed services, you can:

✅ User registration
✅ User login
✅ Email confirmation
✅ Recipe generation with AI (using Amazon Bedrock)
✅ JWT authentication

## What's Missing

To complete the full application, you still need to deploy:

❌ Profile management (view/edit user preferences)
❌ Recipe history (save/view/favorite recipes)
❌ DynamoDB tables for data persistence
❌ Frontend hosting on AWS Amplify

## Next Steps

### Priority 1: Deploy Frontend
Follow the **FRONTEND_DEPLOYMENT_GUIDE.md** to get your frontend live.

### Priority 2: Deploy Missing Backend Services

Deploy Profile API:
```bash
cd ai-recipe-generator-backend
./deploy-profile-api.sh
```

Deploy Recipe History API:
```bash
cd ai-recipe-generator-backend
./deploy-recipe-history-api.sh
```

### Priority 3: Create DynamoDB Tables

The tables will be created automatically when you deploy the Profile and Recipe History APIs using the CloudFormation templates.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Amplify (Frontend)                   │
│                  [React/Next.js Application]                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├─────────────────────────────────────┐
                         │                                     │
                         ▼                                     ▼
              ┌──────────────────┐                 ┌──────────────────┐
              │  Auth API        │                 │  Recipe API      │
              │  (Deployed ✅)   │                 │  (Deployed ✅)   │
              └────────┬─────────┘                 └────────┬─────────┘
                       │                                     │
                       ▼                                     ▼
              ┌──────────────────┐                 ┌──────────────────┐
              │  Cognito         │                 │  Bedrock         │
              │  (Active ✅)     │                 │  (Active ✅)     │
              └──────────────────┘                 └──────────────────┘

              ┌──────────────────┐                 ┌──────────────────┐
              │  Profile API     │                 │  History API     │
              │  (Not deployed ❌)│                 │  (Not deployed ❌)│
              └────────┬─────────┘                 └────────┬─────────┘
                       │                                     │
                       └──────────────┬──────────────────────┘
                                      ▼
                            ┌──────────────────┐
                            │  DynamoDB        │
                            │  (Not created ❌)│
                            └──────────────────┘
```

## Cost Estimate

### Current Monthly Cost (Deployed Services)
- API Gateway: ~$0-3 (within free tier for low traffic)
- Lambda: ~$0-2 (within free tier)
- Cognito: $0 (within free tier for <50k users)
- Bedrock: Pay-per-use (~$0.003 per 1k input tokens, ~$0.015 per 1k output tokens)

**Estimated Current Cost**: $0-10/month for low traffic

### After Full Deployment
- Add Amplify: $0-5/month (within free tier for low traffic)
- Add DynamoDB: $0-2/month (within free tier)

**Estimated Total Cost**: $0-20/month for low traffic

## Support & Documentation

- **Frontend Deployment**: See `FRONTEND_DEPLOYMENT_GUIDE.md`
- **Backend Deployment**: See `ai-recipe-generator-backend/DEPLOYMENT.md`
- **Amplify Setup**: See `recipe-app-v2/AMPLIFY_DEPLOYMENT_STEPS.md`
- **AWS Console**: https://console.aws.amazon.com/

## Troubleshooting

### IAM Permissions Issue
If you encounter "AccessDeniedException" errors:
- Use AWS Console instead of CLI
- Or request Amplify permissions for your IAM user

### Build Failures
- Check that app root directory is set to `recipe-app-v2`
- Verify all environment variables are configured
- Check build logs in Amplify Console

### API Connection Issues
- Verify API Gateway URLs are correct
- Check CORS configuration on backend APIs
- Ensure APIs are deployed and accessible

---

**Status**: Ready for frontend deployment
**Last Updated**: 2026-04-09
**Git Repository**: https://github.com/chinthakuntaharini/ai-recipe-generator.git
