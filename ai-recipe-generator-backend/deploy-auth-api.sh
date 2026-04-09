#!/bin/bash

# Deploy Authentication API for AI Recipe Generator
# This script builds the TypeScript code and deploys the authentication endpoints

set -e  # Exit on any error

# Configuration
STACK_NAME="ai-recipe-auth-api"
ENVIRONMENT="dev"
REGION="us-east-1"
USER_POOL_ID="us-east-1_N0KMxM07E"
USER_POOL_CLIENT_ID="1ia9lcg1nsld42j3giuvaeeo1b"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Authentication API Deployment${NC}"
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured or no valid credentials${NC}"
    echo "Please run 'aws configure' first"
    exit 1
fi

# Get current account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: $ACCOUNT_ID${NC}"

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔨 Building TypeScript code...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
cd dist

# Create a temporary directory for the deployment package
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy built files
cp -r . "$TEMP_DIR/"

# Copy node_modules (only production dependencies)
cd ..
npm ci --production --silent
cp -r node_modules "$TEMP_DIR/"

# Create ZIP file
cd "$TEMP_DIR"
zip -r auth-api-deployment.zip . > /dev/null

# Move ZIP back to project directory
mv auth-api-deployment.zip "$OLDPWD/"
cd "$OLDPWD"

# Clean up
rm -rf "$TEMP_DIR"
npm install  # Reinstall dev dependencies

echo -e "${GREEN}✅ Deployment package created: auth-api-deployment.zip${NC}"

# Deploy CloudFormation stack
echo -e "${BLUE}☁️  Deploying CloudFormation stack...${NC}"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo -e "${YELLOW}📝 Stack exists, updating...${NC}"
    OPERATION="update-stack"
else
    echo -e "${YELLOW}🆕 Stack doesn't exist, creating...${NC}"
    OPERATION="create-stack"
fi

# Deploy the stack
aws cloudformation $OPERATION \
    --stack-name "$STACK_NAME" \
    --template-body file://cloudformation/auth-api-stack.yaml \
    --parameters \
        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        ParameterKey=UserPoolId,ParameterValue="$USER_POOL_ID" \
        ParameterKey=UserPoolClientId,ParameterValue="$USER_POOL_CLIENT_ID" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --tags \
        Key=Environment,Value="$ENVIRONMENT" \
        Key=Service,Value="ai-recipe-generator" \
        Key=Component,Value="auth-api"

echo -e "${YELLOW}⏳ Waiting for stack deployment to complete...${NC}"

# Wait for stack operation to complete
aws cloudformation wait stack-${OPERATION%-stack}-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"
else
    echo -e "${RED}❌ CloudFormation stack deployment failed${NC}"
    exit 1
fi

# Get stack outputs
echo -e "${BLUE}📋 Getting stack outputs...${NC}"
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs')

# Extract function ARNs and API URL
API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AuthAPIUrl") | .OutputValue')
REGISTER_FUNCTION_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="RegisterFunctionArn") | .OutputValue')
LOGIN_FUNCTION_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="LoginFunctionArn") | .OutputValue')

echo -e "${GREEN}✅ Stack Outputs:${NC}"
echo "API URL: $API_URL"
echo "Register Function ARN: $REGISTER_FUNCTION_ARN"
echo ""

# Update Lambda function code
echo -e "${BLUE}🔄 Updating Lambda function code...${NC}"

# List of functions to update
FUNCTIONS=(
    "RegisterFunction:registerHandler"
    "LoginFunction:loginHandler"
    "ConfirmEmailFunction:confirmEmailHandler"
    "ResendConfirmationFunction:resendConfirmationHandler"
    "ForgotPasswordFunction:forgotPasswordHandler"
    "ConfirmForgotPasswordFunction:confirmForgotPasswordHandler"
    "RefreshTokenFunction:refreshTokenHandler"
)

for FUNC_INFO in "${FUNCTIONS[@]}"; do
    IFS=':' read -r FUNC_LOGICAL_ID HANDLER <<< "$FUNC_INFO"
    
    # Get the actual function name from CloudFormation
    FUNC_NAME=$(aws cloudformation describe-stack-resource \
        --stack-name "$STACK_NAME" \
        --logical-resource-id "$FUNC_LOGICAL_ID" \
        --region "$REGION" \
        --query 'StackResourceDetail.PhysicalResourceId' \
        --output text)
    
    echo -e "${YELLOW}📤 Updating $FUNC_NAME...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$FUNC_NAME" \
        --zip-file fileb://auth-api-deployment.zip \
        --region "$REGION" > /dev/null
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name "$FUNC_NAME" \
        --handler "handlers/auth-handler.$HANDLER" \
        --region "$REGION" > /dev/null
    
    echo -e "${GREEN}✅ Updated $FUNC_NAME${NC}"
done

# Clean up deployment package
rm -f auth-api-deployment.zip

echo -e "${GREEN}🎉 Authentication API deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 API Endpoints:${NC}"
echo "POST $API_URL/auth/register"
echo "POST $API_URL/auth/login"
echo "POST $API_URL/auth/confirm-email"
echo "POST $API_URL/auth/resend-confirmation"
echo "POST $API_URL/auth/forgot-password"
echo "POST $API_URL/auth/confirm-forgot-password"
echo "POST $API_URL/auth/refresh-token"
echo ""
echo -e "${BLUE}🧪 Test the API:${NC}"
echo "curl -X POST $API_URL/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"TestPass123!\"}'"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Test the authentication endpoints"
echo "2. Update frontend configuration with the new API URL"
echo "3. Run integration tests"
echo "4. Monitor CloudWatch logs for any issues"