# Deploy Profile API Stack for AI Recipe Generator
# PowerShell version for Windows

$ErrorActionPreference = "Stop"

# Configuration
$STACK_NAME = "ai-recipe-profile-api-stack"
$TEMPLATE_FILE = "cloudformation/profile-api-stack.yaml"
$ENVIRONMENT = "dev"
$REGION = "us-east-1"
$USER_POOL_ID = "us-east-1_N0KMxM07E"
$USER_POOL_CLIENT_ID = "1ia9lcg1nsld42j3giuvaeeo1b"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Profile API Deployment Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Stack Name: $STACK_NAME"
Write-Host "Environment: $ENVIRONMENT"
Write-Host "Region: $REGION"
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Build TypeScript code
Write-Host ""
Write-Host "Step 1: Building TypeScript code..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: TypeScript build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Step 2: Package Lambda functions
Write-Host ""
Write-Host "Step 2: Packaging Lambda functions..." -ForegroundColor Yellow

$DEPLOY_PACKAGE = "profile-api-deployment.zip"
if (Test-Path $DEPLOY_PACKAGE) {
    Remove-Item $DEPLOY_PACKAGE -Force
}

# Create temporary directory for packaging
$tempDir = "temp-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy dist files
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Copy node_modules (excluding dev dependencies)
$excludeDirs = @("@types", "typescript", "jest", "@jest", "@testing-library")
Get-ChildItem "node_modules" | Where-Object {
    $dir = $_
    -not ($excludeDirs | Where-Object { $dir.Name -like "*$_*" })
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$tempDir\node_modules\$($_.Name)" -Recurse -Force
}

# Create zip file
Compress-Archive -Path "$tempDir\*" -DestinationPath $DEPLOY_PACKAGE -Force

# Cleanup temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host "✓ Lambda package created: $DEPLOY_PACKAGE" -ForegroundColor Green

# Step 3: Deploy CloudFormation stack
Write-Host ""
Write-Host "Step 3: Deploying CloudFormation stack..." -ForegroundColor Yellow

aws cloudformation deploy `
  --template-file $TEMPLATE_FILE `
  --stack-name $STACK_NAME `
  --parameter-overrides `
    Environment=$ENVIRONMENT `
    UserPoolId=$USER_POOL_ID `
    UserPoolClientId=$USER_POOL_CLIENT_ID `
  --capabilities CAPABILITY_NAMED_IAM `
  --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: CloudFormation deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ CloudFormation stack deployed" -ForegroundColor Green

# Step 4: Update Lambda function code
Write-Host ""
Write-Host "Step 4: Updating Lambda function code..." -ForegroundColor Yellow

# Get function names from CloudFormation outputs
$stackInfo = aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION | ConvertFrom-Json
$outputs = $stackInfo.Stacks[0].Outputs

$GET_PROFILE_FUNCTION = ($outputs | Where-Object { $_.OutputKey -eq "GetProfileFunctionArn" }).OutputValue.Split(":")[-1]
$UPDATE_PROFILE_FUNCTION = ($outputs | Where-Object { $_.OutputKey -eq "UpdateProfileFunctionArn" }).OutputValue.Split(":")[-1]
$CREATE_PROFILE_FUNCTION = ($outputs | Where-Object { $_.OutputKey -eq "CreateProfileFunctionArn" }).OutputValue.Split(":")[-1]

# Update each Lambda function
Write-Host "Updating Get Profile function..."
aws lambda update-function-code `
  --function-name $GET_PROFILE_FUNCTION `
  --zip-file fileb://$DEPLOY_PACKAGE `
  --region $REGION | Out-Null

Write-Host "Updating Update Profile function..."
aws lambda update-function-code `
  --function-name $UPDATE_PROFILE_FUNCTION `
  --zip-file fileb://$DEPLOY_PACKAGE `
  --region $REGION | Out-Null

Write-Host "Updating Create Profile function..."
aws lambda update-function-code `
  --function-name $CREATE_PROFILE_FUNCTION `
  --zip-file fileb://$DEPLOY_PACKAGE `
  --region $REGION | Out-Null

Write-Host "✓ Lambda functions updated" -ForegroundColor Green

# Step 5: Get API Gateway URL
Write-Host ""
Write-Host "Step 5: Retrieving API Gateway URL..." -ForegroundColor Yellow

$API_URL = ($outputs | Where-Object { $_.OutputKey -eq "ProfileAPIUrl" }).OutputValue

Write-Host "✓ API Gateway URL: $API_URL" -ForegroundColor Green

# Step 6: Display deployment summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Stack Name: $STACK_NAME"
Write-Host "Status: DEPLOYED" -ForegroundColor Green
Write-Host "API URL: $API_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Available Endpoints:"
Write-Host "  GET    $API_URL/profile"
Write-Host "  PUT    $API_URL/profile"
Write-Host "  POST   $API_URL/profile/onboarding"
Write-Host ""
Write-Host "DynamoDB Table: Users-$ENVIRONMENT"
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Profile API deployment complete!" -ForegroundColor Green
Write-Host ""
