#!/bin/bash

# Deploy Profile API Stack for AI Recipe Generator
# This script deploys the profile management Lambda functions and API Gateway endpoints

set -e

# Configuration
STACK_NAME="ai-recipe-profile-api-stack"
TEMPLATE_FILE="cloudformation/profile-api-stack.yaml"
ENVIRONMENT="dev"
REGION="us-east-1"
USER_POOL_ID="us-east-1_N0KMxM07E"
USER_POOL_CLIENT_ID="1ia9lcg1nsld42j3giuvaeeo1b"

echo "========================================="
echo "Profile API Deployment Script"
echo "========================================="
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "========================================="

# Step 1: Build TypeScript code
echo ""
echo "Step 1: Building TypeScript code..."
npm run build

if [ $? -ne 0 ]; then
    echo "Error: TypeScript build failed"
    exit 1
fi

echo "✓ Build successful"

# Step 2: Package Lambda functions
echo ""
echo "Step 2: Packaging Lambda functions..."

# Create deployment package
DEPLOY_PACKAGE="profile-api-deployment.zip"
rm -f $DEPLOY_PACKAGE

# Package the compiled code and dependencies
cd dist
zip -r ../$DEPLOY_PACKAGE . -x "*.test.js" -x "**/__tests__/*"
cd ..

# Add node_modules (only production dependencies)
zip -r $DEPLOY_PACKAGE node_modules -x "node_modules/@types/*" -x "node_modules/typescript/*" -x "node_modules/jest/*" -x "node_modules/@jest/*"

echo "✓ Lambda package created: $DEPLOY_PACKAGE"

# Step 3: Deploy CloudFormation stack
echo ""
echo "Step 3: Deploying CloudFormation stack..."

aws cloudformation deploy \
  --template-file $TEMPLATE_FILE \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    Environment=$ENVIRONMENT \
    UserPoolId=$USER_POOL_ID \
    UserPoolClientId=$USER_POOL_CLIENT_ID \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION

if [ $? -ne 0 ]; then
    echo "Error: CloudFormation deployment failed"
    exit 1
fi

echo "✓ CloudFormation stack deployed"

# Step 4: Update Lambda function code
echo ""
echo "Step 4: Updating Lambda function code..."

# Get function names from CloudFormation outputs
GET_PROFILE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='GetProfileFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

UPDATE_PROFILE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='UpdateProfileFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

CREATE_PROFILE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='CreateProfileFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

# Update each Lambda function
echo "Updating Get Profile function..."
aws lambda update-function-code \
  --function-name $GET_PROFILE_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "Updating Update Profile function..."
aws lambda update-function-code \
  --function-name $UPDATE_PROFILE_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "Updating Create Profile function..."
aws lambda update-function-code \
  --function-name $CREATE_PROFILE_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "✓ Lambda functions updated"

# Step 5: Get API Gateway URL
echo ""
echo "Step 5: Retrieving API Gateway URL..."

API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='ProfileAPIUrl'].OutputValue" \
  --output text)

echo "✓ API Gateway URL: $API_URL"

# Step 6: Display deployment summary
echo ""
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo "Stack Name: $STACK_NAME"
echo "Status: DEPLOYED"
echo "API URL: $API_URL"
echo ""
echo "Available Endpoints:"
echo "  GET    $API_URL/profile"
echo "  PUT    $API_URL/profile"
echo "  POST   $API_URL/profile/onboarding"
echo ""
echo "DynamoDB Table: Users-$ENVIRONMENT"
echo "========================================="
echo ""
echo "✓ Profile API deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the GET /profile endpoint with a valid JWT token"
echo "2. Create a user profile using POST /profile/onboarding"
echo "3. Update the frontend to use the new API URL"
echo ""
