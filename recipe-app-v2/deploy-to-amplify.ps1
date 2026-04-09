# Deploy Frontend to AWS Amplify
# This script creates an Amplify app and deploys the frontend

param(
    [string]$AppName = "ai-recipe-generator-frontend",
    [string]$Region = "us-east-1",
    [string]$Branch = "main"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS Amplify Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "Checking AWS CLI..." -ForegroundColor Yellow
$awsVersion = aws --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ AWS CLI found: $awsVersion" -ForegroundColor Green
Write-Host ""

# Check if Git repository exists
Write-Host "Checking Git repository..." -ForegroundColor Yellow
$gitStatus = git status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not a Git repository" -ForegroundColor Red
    Write-Host "Please initialize Git first: git init" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Git repository found" -ForegroundColor Green
Write-Host ""

# Check if remote repository is configured
Write-Host "Checking Git remote..." -ForegroundColor Yellow
$gitRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: No Git remote configured" -ForegroundColor Yellow
    Write-Host "You'll need to configure a Git remote (GitHub, GitLab, or Bitbucket) for Amplify deployment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To add a remote:" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/your-username/your-repo.git" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
} else {
    Write-Host "✓ Git remote found: $gitRemote" -ForegroundColor Green
}
Write-Host ""

# Get environment variables
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cognitoUserPoolId = "us-east-1_N0KMxM07E"
$cognitoClientId = "1ia9lcg1nsld42j3giuvaeeo1b"
$authApiUrl = "https://nuz5dbksz2.execute-api.us-east-1.amazonaws.com/dev"
$recipeApiUrl = "https://f3ohu70iha.execute-api.us-east-1.amazonaws.com/dev"

Write-Host "AWS Region: $Region" -ForegroundColor Cyan
Write-Host "Cognito User Pool ID: $cognitoUserPoolId" -ForegroundColor Cyan
Write-Host "Cognito Client ID: $cognitoClientId" -ForegroundColor Cyan
Write-Host "Auth API URL: $authApiUrl" -ForegroundColor Cyan
Write-Host "Recipe API URL: $recipeApiUrl" -ForegroundColor Cyan
Write-Host ""

# Create Amplify app
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Amplify App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking if Amplify app already exists..." -ForegroundColor Yellow
$existingApp = aws amplify list-apps --region $Region --query "apps[?name=='$AppName'].appId" --output text 2>&1

if ($existingApp -and $existingApp -ne "") {
    Write-Host "✓ Amplify app already exists: $existingApp" -ForegroundColor Green
    $appId = $existingApp
} else {
    Write-Host "Creating new Amplify app..." -ForegroundColor Yellow
    
    $createAppResult = aws amplify create-app `
        --name $AppName `
        --region $Region `
        --platform WEB `
        --query 'app.appId' `
        --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create Amplify app" -ForegroundColor Red
        Write-Host $createAppResult -ForegroundColor Red
        exit 1
    }
    
    $appId = $createAppResult
    Write-Host "✓ Amplify app created: $appId" -ForegroundColor Green
}
Write-Host ""

# Set environment variables
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuring Environment Variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Setting environment variables..." -ForegroundColor Yellow

$envVars = @{
    "NEXT_PUBLIC_AWS_REGION" = $Region
    "NEXT_PUBLIC_COGNITO_USER_POOL_ID" = $cognitoUserPoolId
    "NEXT_PUBLIC_COGNITO_CLIENT_ID" = $cognitoClientId
    "NEXT_PUBLIC_AUTH_API_URL" = $authApiUrl
    "NEXT_PUBLIC_RECIPE_API_URL" = $recipeApiUrl
    "NEXT_PUBLIC_API_GENERATE_ENDPOINT" = "/generate-recipe"
    "NEXT_PUBLIC_API_REGISTER_ENDPOINT" = "/register"
    "NEXT_PUBLIC_API_LOGIN_ENDPOINT" = "/login"
    "NEXT_PUBLIC_API_CONFIRM_EMAIL_ENDPOINT" = "/confirm-email"
}

$envVarsJson = $envVars | ConvertTo-Json -Compress

$updateEnvResult = aws amplify update-app `
    --app-id $appId `
    --region $Region `
    --environment-variables $envVarsJson 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to set environment variables" -ForegroundColor Yellow
    Write-Host $updateEnvResult -ForegroundColor Yellow
    Write-Host "You will need to set them manually in the Amplify Console" -ForegroundColor Yellow
} else {
    Write-Host "✓ Environment variables configured" -ForegroundColor Green
}
Write-Host ""

# Display next steps
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your Amplify app has been created!" -ForegroundColor Green
Write-Host ""
Write-Host "App ID: $appId" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

Write-Host "To complete the deployment:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open AWS Amplify Console:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/amplify/home?region=$Region#/$appId" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Connect your Git repository:" -ForegroundColor White
Write-Host "   - Click Connect branch" -ForegroundColor Cyan
Write-Host "   - Select your Git provider (GitHub, GitLab, or Bitbucket)" -ForegroundColor Cyan
Write-Host "   - Authorize AWS Amplify to access your repository" -ForegroundColor Cyan
Write-Host "   - Select your repository and branch ($Branch)" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Configure build settings:" -ForegroundColor White
Write-Host "   - Amplify should auto-detect Next.js" -ForegroundColor Cyan
Write-Host "   - Verify the amplify.yml file is detected" -ForegroundColor Cyan
Write-Host "   - Click Save and deploy" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Wait for deployment to complete (5-10 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "5. Access your deployed app at the Amplify-provided URL" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Deployment Alternative" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If you prefer manual deployment without Git:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Build the app locally:" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Create a deployment package:" -ForegroundColor White
Write-Host "   Compress-Archive -Path .next,public,package.json,next.config.js -DestinationPath deployment.zip" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Deploy using AWS CLI:" -ForegroundColor White
Write-Host "   aws amplify create-deployment --app-id $appId --branch-name $Branch" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deployment script completed!" -ForegroundColor Green
