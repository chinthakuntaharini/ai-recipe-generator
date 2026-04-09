#!/bin/bash

# Deployment script for JWT Authentication Middleware
# Usage: ./deploy.sh [stack-name] [s3-bucket]

set -e

# Configuration
STACK_NAME=${1:-"ai-recipe-jwt-middleware"}
S3_BUCKET=${2:-"ai-recipe-generator-deployments"}
REGION="us-east-1"
COGNITO_USER_POOL_ID="us-east-1_N0KMxM07E"
COGNITO_CLIENT_ID="1ia9lcg1nsld42j3giuvaeeo1b"

echo "🚀 Deploying JWT Authentication Middleware"
echo "=========================================="
echo "Stack Name: $STACK_NAME"
echo "S3 Bucket: $S3_BUCKET"
echo "Region: $REGION"
echo ""

# Step 1: Build the project
echo "📦 Building TypeScript project..."
npm install
npm run build
npm test

# Step 2: Create deployment package
echo "📦 Creating deployment package..."
rm -rf lambda-deployment
mkdir lambda-deployment

# Copy built files
cp -r dist/* lambda-deployment/

# Copy node_modules (production only)
cp -r node_modules lambda-deployment/

# Create zip file
cd lambda-deployment
zip -r ../jwt-middleware-lambda.zip . -q
cd ..

echo "✅ Deployment package created: jwt-middleware-lambda.zip"

# Step 3: Upload to S3
echo "☁️  Uploading to S3..."
aws s3 cp jwt-middleware-lambda.zip s3://$S3_BUCKET/jwt-middleware-lambda.zip

echo "✅ Uploaded to s3://$S3_BUCKET/jwt-middleware-lambda.zip"

# Step 4: Deploy CloudFormation stack
echo "🏗️  Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation/jwt-middleware-stack.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    CognitoRegion=$REGION \
    UserPoolId=$COGNITO_USER_POOL_ID \
    UserPoolClientId=$COGNITO_CLIENT_ID \
    LambdaCodeBucket=$S3_BUCKET \
    LambdaCodeKey=jwt-middleware-lambda.zip \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION

# Step 5: Get outputs
echo "📋 Getting stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)

PROTECTED_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ProtectedEndpoint`].OutputValue' \
  --output text)

echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo "API Endpoint: $API_ENDPOINT"
echo "Protected Endpoint: $PROTECTED_ENDPOINT"
echo ""
echo "🧪 Test the deployment:"
echo "1. Get a JWT token from the frontend authentication"
echo "2. Test the protected endpoint:"
echo "   curl -X GET \\"
echo "     $PROTECTED_ENDPOINT \\"
echo "     -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\""
echo ""
echo "📚 Documentation:"
echo "- README.md: Overview and usage"
echo "- DEPLOYMENT.md: Detailed deployment guide"
echo "- cloudformation/: Infrastructure as code"

# Cleanup
rm -rf lambda-deployment
rm jwt-middleware-lambda.zip

echo ""
echo "✨ Deployment script completed!"