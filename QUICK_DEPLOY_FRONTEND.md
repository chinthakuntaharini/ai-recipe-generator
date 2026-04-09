# Quick Deploy: Frontend to AWS Amplify

## 🚀 5-Minute Deployment

### Step 1: Open AWS Amplify Console
👉 https://console.aws.amazon.com/amplify/home?region=us-east-1

### Step 2: Create New App
1. Click **"New app"** → **"Host web app"**
2. Select **GitHub**
3. Authorize AWS Amplify

### Step 3: Connect Repository
1. Repository: **ai-recipe-generator**
2. Branch: **main**
3. App root directory: **recipe-app-v2**
4. Click **Next**

### Step 4: Add Environment Variables
Click **"Advanced settings"** → **"Add environment variable"**

Copy-paste these (9 variables):

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

### Step 5: Deploy
1. Click **"Save and deploy"**
2. Wait 5-10 minutes
3. Access your app at the Amplify URL

## ✅ Verification Checklist

After deployment:
- [ ] App loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can generate recipe

## 📋 Files Created for You

- ✅ `recipe-app-v2/amplify.yml` - Build configuration
- ✅ `recipe-app-v2/.env.local` - Environment variables (updated)
- ✅ `FRONTEND_DEPLOYMENT_GUIDE.md` - Detailed instructions
- ✅ `DEPLOYMENT_SUMMARY.md` - Complete deployment status

## 🆘 Troubleshooting

**Build fails?**
→ Set app root directory to `recipe-app-v2`

**API calls fail?**
→ Check environment variables are set correctly

**Need help?**
→ See `FRONTEND_DEPLOYMENT_GUIDE.md` for detailed troubleshooting

---

**Your Git Repo**: https://github.com/chinthakuntaharini/ai-recipe-generator.git
**AWS Region**: us-east-1
**Estimated Time**: 5-10 minutes
