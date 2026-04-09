#!/bin/bash

# Deploy Amazon Titan Model Code
# This script automates the deployment of the updated Bedrock service

set -e

echo "🚀 Deploying Amazon Titan Model Code..."
echo "========================================"

# Configuration
FUNCTION_NAME="recipe-generation-dev"
STACK_NAME="recipe-generation-stack-dev"
REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    echo "Please install AWS CLI or follow manual deployment steps below"
    echo ""
    echo "📋 Manual Deployment Steps:"
    echo "1. Go to AWS Lambda Console"
    echo "2. Find function: recipe-generation-dev"
    echo "3. Replace bedrock-service.js with content from bedrock-service-titan.js"
    echo "4. Click Deploy"
    echo "5. Test with: node test-titan-deployment.js"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run 'aws configure' first or follow manual steps"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Step 1: Build the project
echo -e "${BLUE}📦 Building TypeScript project...${NC}"
cd ai-recipe-generator-backend

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

npm install
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"

# Step 2: Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"

# Clean up any existing package
rm -f lambda-deployment.zip

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy built files
cp -r dist/* "$TEMP_DIR/"

# Install production dependencies
npm ci --production --silent
cp -r node_modules "$TEMP_DIR/"

# Create ZIP file
cd "$TEMP_DIR"
zip -r lambda-deployment.zip . > /dev/null

# Move ZIP back to project directory
mv lambda-deployment.zip "$OLDPWD/"
cd "$OLDPWD"

# Clean up
rm -rf "$TEMP_DIR"
npm install --silent  # Restore dev dependencies

echo -e "${GREEN}✅ Deployment package created${NC}"

# Step 3: Update CloudFormation stack (IAM permissions)
echo -e "${BLUE}☁️ Updating CloudFormation stack for Titan permissions...${NC}"

aws cloudformation deploy \
    --template-file cloudformation/recipe-generation-stack.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack updated${NC}"
else
    echo -e "${YELLOW}⚠️ CloudFormation update failed or no changes needed${NC}"
fi

# Step 4: Update Lambda function code
echo -e "${BLUE}🔄 Updating Lambda function code...${NC}"

aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://lambda-deployment.zip \
    --region "$REGION" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lambda function updated${NC}"
else
    echo -e "${RED}❌ Lambda function update failed${NC}"
    exit 1
fi

# Step 5: Wait for function to be ready
echo -e "${BLUE}⏳ Waiting for function update to complete...${NC}"
aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

echo -e "${GREEN}✅ Function update completed${NC}"

# Clean up
rm -f lambda-deployment.zip

# Step 6: Test the deployment
echo -e "${BLUE}🧪 Testing the deployment...${NC}"
cd ..

if [ -f "test-titan-deployment.js" ]; then
    node test-titan-deployment.js
else
    echo -e "${YELLOW}⚠️ Test file not found, skipping automated test${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 What was deployed:${NC}"
echo "✅ Amazon Titan Text Express model"
echo "✅ Updated request/response format"
echo "✅ Enhanced error handling"
echo "✅ Fallback recipe generation"
echo "✅ Updated IAM permissions"
echo ""
echo -e "${BLUE}🧪 Test your deployment:${NC}"
echo "node test-titan-deployment.js"
echo ""
echo -e "${BLUE}📱 Web Application:${NC}"
echo "http://ai-recipe-generator-web-app-914877613.s3-website-us-east-1.amazonaws.com"
echo ""
echo -e "${GREEN}🎯 Expected Result: No more 'use case details' errors!${NC}"