#!/bin/bash

# Deploy Recipe History API Stack for AI Recipe Generator
# This script deploys the recipe history Lambda functions and API Gateway endpoints

set -e

# Configuration
STACK_NAME="ai-recipe-history-api-stack"
TEMPLATE_FILE="cloudformation/recipe-history-api-stack.yaml"
ENVIRONMENT="dev"
REGION="us-east-1"
USER_POOL_ID="us-east-1_N0KMxM07E"
USER_POOL_CLIENT_ID="1ia9lcg1nsld42j3giuvaeeo1b"

echo "========================================="
echo "Recipe History API Deployment Script"
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
DEPLOY_PACKAGE="recipe-history-api-deployment.zip"
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
GET_RECIPES_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='GetRecipesFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

GET_RECIPE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='GetRecipeFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

TOGGLE_FAVORITE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='ToggleFavoriteFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

DELETE_RECIPE_FUNCTION=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='DeleteRecipeFunctionArn'].OutputValue" \
  --output text | awk -F: '{print $NF}')

# Update each Lambda function
echo "Updating Get Recipes function..."
aws lambda update-function-code \
  --function-name $GET_RECIPES_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "Updating Get Recipe function..."
aws lambda update-function-code \
  --function-name $GET_RECIPE_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "Updating Toggle Favorite function..."
aws lambda update-function-code \
  --function-name $TOGGLE_FAVORITE_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "Updating Delete Recipe function..."
aws lambda update-function-code \
  --function-name $DELETE_RECIPE_FUNCTION \
  --zip-file fileb://$DEPLOY_PACKAGE \
  --region $REGION > /dev/null

echo "✓ Lambda functions updated"

# Step 5: Get API Gateway URL
echo ""
echo "Step 5: Retrieving API Gateway URL..."

API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='RecipeHistoryAPIUrl'].OutputValue" \
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
echo "  GET    $API_URL/recipes"
echo "  GET    $API_URL/recipes/{recipeId}"
echo "  PUT    $API_URL/recipes/{recipeId}/favorite"
echo "  DELETE $API_URL/recipes/{recipeId}"
echo ""
echo "Query Parameters for GET /recipes:"
echo "  - cuisine: Filter by cuisine type"
echo "  - mealType: Filter by meal type"
echo ""
echo "DynamoDB Table: RecipeHistory-$ENVIRONMENT"
echo "========================================="
echo ""
echo "✓ Recipe History API deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the GET /recipes endpoint with a valid JWT token"
echo "2. Verify filtering works with cuisine and mealType parameters"
echo "3. Test favorite toggle and delete operations"
echo "4. Update the frontend to use the new API URL"
echo ""
