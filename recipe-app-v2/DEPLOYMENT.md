# Deployment Guide

This guide covers deploying the AI Recipe Generator frontend to AWS Amplify or other hosting platforms.

## Prerequisites

Before deploying, ensure you have:
- [ ] AWS account with appropriate permissions
- [ ] Backend services deployed (Lambda, API Gateway, DynamoDB, Cognito)
- [ ] Domain name (optional, but recommended)
- [ ] SSL certificate (handled automatically by Amplify)

## Environment Configuration

### Required Environment Variables

The following environment variables must be configured in your deployment environment:

```env
# AWS Region
NEXT_PUBLIC_AWS_REGION=us-east-1

# Amazon Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# API Gateway Configuration
NEXT_PUBLIC_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### Getting Your AWS Resource IDs

#### Cognito User Pool ID and Client ID
1. Open AWS Console
2. Navigate to Amazon Cognito
3. Click on your User Pool
4. Copy the "Pool Id" (format: `us-east-1_XXXXXXXXX`)
5. Click "App clients" in the left sidebar
6. Copy the "App client id"

#### API Gateway URL
1. Open AWS Console
2. Navigate to API Gateway
3. Click on your API
4. Click "Stages" in the left sidebar
5. Click on your stage (e.g., "prod")
6. Copy the "Invoke URL" at the top

## Deployment Options

### Option 1: AWS Amplify (Recommended)

AWS Amplify provides automatic builds, deployments, and hosting with CDN.

#### Step 1: Push Code to Git Repository

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (GitHub, GitLab, or Bitbucket)
git remote add origin https://github.com/your-username/recipe-app-v2.git

# Push to remote
git push -u origin main
```

#### Step 2: Connect to AWS Amplify

1. Open AWS Console
2. Navigate to AWS Amplify
3. Click "New app" > "Host web app"
4. Select your Git provider (GitHub, GitLab, Bitbucket)
5. Authorize AWS Amplify to access your repository
6. Select your repository and branch
7. Click "Next"

#### Step 3: Configure Build Settings

Amplify should auto-detect Next.js. Verify the build settings:

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

#### Step 4: Add Environment Variables

1. In Amplify Console, click "Environment variables"
2. Add each environment variable:
   - `NEXT_PUBLIC_AWS_REGION`
   - `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
   - `NEXT_PUBLIC_COGNITO_CLIENT_ID`
   - `NEXT_PUBLIC_API_GATEWAY_URL`
3. Click "Save"

#### Step 5: Deploy

1. Click "Save and deploy"
2. Wait for build to complete (5-10 minutes)
3. Click on the generated URL to view your app

#### Step 6: Configure Custom Domain (Optional)

1. In Amplify Console, click "Domain management"
2. Click "Add domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (up to 24 hours)

### Option 2: Vercel

Vercel is optimized for Next.js applications.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
# Navigate to project directory
cd recipe-app-v2

# Deploy
vercel

# Follow prompts to:
# - Link to existing project or create new
# - Set project name
# - Configure settings
```

#### Step 3: Add Environment Variables

```bash
# Add environment variables
vercel env add NEXT_PUBLIC_AWS_REGION
vercel env add NEXT_PUBLIC_COGNITO_USER_POOL_ID
vercel env add NEXT_PUBLIC_COGNITO_CLIENT_ID
vercel env add NEXT_PUBLIC_API_GATEWAY_URL

# Redeploy with environment variables
vercel --prod
```

### Option 3: Self-Hosted (Docker)

For self-hosted deployments using Docker.

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_COGNITO_USER_POOL_ID
ARG NEXT_PUBLIC_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_API_GATEWAY_URL

ENV NEXT_PUBLIC_AWS_REGION=$NEXT_PUBLIC_AWS_REGION
ENV NEXT_PUBLIC_COGNITO_USER_POOL_ID=$NEXT_PUBLIC_COGNITO_USER_POOL_ID
ENV NEXT_PUBLIC_COGNITO_CLIENT_ID=$NEXT_PUBLIC_COGNITO_CLIENT_ID
ENV NEXT_PUBLIC_API_GATEWAY_URL=$NEXT_PUBLIC_API_GATEWAY_URL

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Step 2: Build and Run

```bash
# Build Docker image
docker build \
  --build-arg NEXT_PUBLIC_AWS_REGION=us-east-1 \
  --build-arg NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id \
  --build-arg NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id \
  --build-arg NEXT_PUBLIC_API_GATEWAY_URL=your-api-url \
  -t recipe-app-v2 .

# Run container
docker run -p 3000:3000 recipe-app-v2
```

## Post-Deployment Verification

After deployment, verify the following:

### 1. Application Loads
- [ ] Navigate to deployment URL
- [ ] Verify page loads without errors
- [ ] Check browser console for errors

### 2. Environment Variables
- [ ] Open browser DevTools > Network
- [ ] Verify API calls use correct endpoint
- [ ] Verify no environment variable errors in console

### 3. Authentication
- [ ] Test sign-up flow
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Verify tokens are stored correctly

### 4. Core Functionality
- [ ] Test recipe generation
- [ ] Test profile management
- [ ] Test recipe history
- [ ] Test voice input (if supported)

### 5. Performance
- [ ] Run Lighthouse audit
- [ ] Verify performance score >90
- [ ] Check loading times
- [ ] Verify CDN is serving assets

### 6. Security
- [ ] Verify HTTPS is enforced
- [ ] Check security headers
- [ ] Verify CORS configuration
- [ ] Test authentication flows

## Monitoring and Logging

### AWS Amplify Monitoring

1. Navigate to Amplify Console
2. Click on your app
3. Click "Monitoring" tab
4. View:
   - Request count
   - Error rate
   - Latency
   - Data transfer

### CloudWatch Logs

1. Navigate to CloudWatch
2. Click "Log groups"
3. Find your Amplify app logs
4. Monitor for errors and warnings

### Custom Monitoring

Consider adding:
- Google Analytics
- Sentry for error tracking
- LogRocket for session replay
- New Relic for APM

## Rollback Procedure

If deployment fails or introduces bugs:

### AWS Amplify Rollback

1. Navigate to Amplify Console
2. Click on your app
3. Click "Deployments" tab
4. Find previous successful deployment
5. Click "Redeploy this version"

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## Continuous Deployment

### Automatic Deployments

AWS Amplify and Vercel automatically deploy when you push to your Git repository:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Deployment triggers automatically
```

### Branch Deployments

Create preview deployments for feature branches:

1. Push feature branch to Git
2. Amplify/Vercel creates preview URL
3. Test changes on preview URL
4. Merge to main when ready

## Troubleshooting

### Build Failures

**Issue**: Build fails with "Module not found"
**Solution**: 
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Build fails with "Out of memory"
**Solution**: Increase Node.js memory limit
```bash
# In package.json
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

### Runtime Errors

**Issue**: "Failed to fetch" errors
**Solution**: 
- Verify API Gateway URL is correct
- Check CORS configuration on backend
- Verify API Gateway is deployed

**Issue**: Authentication errors
**Solution**:
- Verify Cognito User Pool ID and Client ID
- Check Cognito app client settings
- Verify redirect URLs are configured

### Performance Issues

**Issue**: Slow page loads
**Solution**:
- Enable CDN caching
- Optimize images
- Enable compression
- Use code splitting

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** on all deployments
4. **Configure CSP headers** to prevent XSS
5. **Implement rate limiting** on API endpoints
6. **Regular security audits** using npm audit
7. **Keep dependencies updated** to patch vulnerabilities

## Cost Optimization

### AWS Amplify Pricing

- Free tier: 1000 build minutes/month, 15 GB served/month
- After free tier: $0.01 per build minute, $0.15 per GB served

### Tips to Reduce Costs

1. **Optimize images** to reduce bandwidth
2. **Enable caching** to reduce API calls
3. **Use CDN** to reduce origin requests
4. **Implement lazy loading** for images and components
5. **Monitor usage** regularly

## Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Review error logs weekly
- [ ] Monitor performance metrics
- [ ] Backup database regularly
- [ ] Review security advisories
- [ ] Test disaster recovery procedures

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run tests
npm test

# Build locally to verify
npm run build

# Push to trigger deployment
git push origin main
```

## Support and Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Support](https://aws.amazon.com/support/)

---

**Last Updated**: 2024-01-20
**Deployment Status**: Ready for Production
**Estimated Deployment Time**: 15-30 minutes
