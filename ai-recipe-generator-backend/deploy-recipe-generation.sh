#!/bin/bash

# Deploy Recipe Generation Lambda Function and API Gateway
# Usage: ./deploy-recipe-generation.sh [environment] [cognito-user-pool-id] [cognito-client-id]

set -e

# Configuration
ENVIRONMENT=${1:-dev}
COGNITO_USER_POOL_ID=${2:-us-east-1_N0KMxM07E}
COGNITO_CLIENT_ID=${3:-4aqhvhqhvhqhvhqhvhqhvhqhvh}
STACK_NAME="recipe-generation-stack-${ENVIRONMENT}"
REGION="us-east-1"

echo "🚀 Deploying Recipe Generation Service..."
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${REGION}"
echo "Stack Name: ${STACK_NAME}"
echo "Cognito User Pool ID: ${COGNITO_USER_POOL_ID}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
rm -f recipe-generation-function.zip
cd dist
zip -r ../recipe-generation-function.zip . -x "**/__tests__/**" "**/*.test.js" "**/*.test.js.map"
cd ..

# Add node_modules to the package (only production dependencies)
echo "📦 Adding production dependencies..."
npm ci --production --silent
zip -r recipe-generation-function.zip node_modules -x "node_modules/**/__tests__/**" "node_modules/**/test/**"

# Restore all dependencies
npm install --silent

# Deploy CloudFormation stack
echo "☁️ Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation/recipe-generation-stack.yaml \
    --stack-name "${STACK_NAME}" \
    --parameter-overrides \
        Environment="${ENVIRONMENT}" \
        CognitoUserPoolId="${COGNITO_USER_POOL_ID}" \
        CognitoUserPoolClientId="${COGNITO_CLIENT_ID}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${REGION}" \
    --no-fail-on-empty-changeset

# Get the function name from CloudFormation
FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='RecipeGenerationFunctionArn'].OutputValue" \
    --output text | cut -d':' -f7)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Could not retrieve function name from CloudFormation stack"
    exit 1
fi

# Update Lambda function code
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name "${FUNCTION_NAME}" \
    --zip-file fileb://recipe-generation-function.zip \
    --region "${REGION}"

# Wait for function to be updated
echo "⏳ Waiting for function update to complete..."
aws lambda wait function-updated \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}"

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='GenerateRecipeEndpoint'].OutputValue" \
    --output text)

# Clean up
rm -f recipe-generation-function.zip

echo "✅ Recipe Generation Service deployed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Function Name: ${FUNCTION_NAME}"
echo "  API Endpoint: ${API_URL}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Region: ${REGION}"
echo ""
echo "🧪 Test the endpoint:"
echo "curl -X POST ${API_URL} \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '{\"ingredients\": [\"chicken\", \"rice\", \"vegetables\"], \"servings\": 4}'"
echo ""
echo "📊 Monitor logs:"
echo "aws logs tail /aws/lambda/${FUNCTION_NAME} --follow --region ${REGION}"