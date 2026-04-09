# PowerShell script to deploy Amazon Titan model code
# Run this if you have AWS PowerShell tools installed

param(
    [string]$FunctionName = "recipe-generation-dev",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Deploying Amazon Titan Model Code..." -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Check if AWS PowerShell module is available
if (-not (Get-Module -ListAvailable -Name AWS.Tools.Lambda)) {
    Write-Host "❌ AWS PowerShell Tools not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Manual Deployment Required:" -ForegroundColor Yellow
    Write-Host "1. Follow instructions in deploy-titan-manual.md" -ForegroundColor White
    Write-Host "2. Or install AWS Tools: Install-Module AWS.Tools.Lambda" -ForegroundColor White
    Write-Host "3. Then run this script again" -ForegroundColor White
    exit 1
}

# Check AWS credentials
try {
    $identity = Get-STSCallerIdentity -Region $Region
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
    Write-Host "Account: $($identity.Account)" -ForegroundColor White
} catch {
    Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
    Write-Host "Please run: Set-AWSCredential -AccessKey YOUR_KEY -SecretKey YOUR_SECRET" -ForegroundColor Yellow
    exit 1
}

# Build the project
Write-Host "📦 Building TypeScript project..." -ForegroundColor Blue
Set-Location "ai-recipe-generator-backend"

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit 1
}

npm install
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed - dist directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed" -ForegroundColor Green

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue

# Clean up any existing package
if (Test-Path "lambda-deployment.zip") {
    Remove-Item "lambda-deployment.zip"
}

# Create temporary directory
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
Write-Host "Using temporary directory: $tempDir"

# Copy built files
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Install production dependencies
npm ci --production --silent
Copy-Item -Path "node_modules" -Destination $tempDir -Recurse

# Create ZIP file
Compress-Archive -Path "$tempDir\*" -DestinationPath "lambda-deployment.zip"

# Clean up
Remove-Item $tempDir -Recurse -Force
npm install --silent  # Restore dev dependencies

Write-Host "✅ Deployment package created" -ForegroundColor Green

# Update Lambda function code
Write-Host "🔄 Updating Lambda function code..." -ForegroundColor Blue

try {
    $zipBytes = [System.IO.File]::ReadAllBytes("$(Get-Location)\lambda-deployment.zip")
    Update-LMFunctionCode -FunctionName $FunctionName -ZipFile $zipBytes -Region $Region
    Write-Host "✅ Lambda function updated" -ForegroundColor Green
} catch {
    Write-Host "❌ Lambda function update failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Wait for function to be ready
Write-Host "⏳ Waiting for function update to complete..." -ForegroundColor Blue
do {
    Start-Sleep -Seconds 2
    $functionConfig = Get-LMFunction -FunctionName $FunctionName -Region $Region
} while ($functionConfig.Configuration.LastUpdateStatus -eq "InProgress")

Write-Host "✅ Function update completed" -ForegroundColor Green

# Clean up
Remove-Item "lambda-deployment.zip"

# Test the deployment
Write-Host "🧪 Testing the deployment..." -ForegroundColor Blue
Set-Location ".."

if (Test-Path "test-titan-deployment.js") {
    node test-titan-deployment.js
} else {
    Write-Host "⚠️ Test file not found, skipping automated test" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was deployed:" -ForegroundColor Blue
Write-Host "✅ Amazon Titan Text Express model" -ForegroundColor White
Write-Host "✅ Updated request/response format" -ForegroundColor White
Write-Host "✅ Enhanced error handling" -ForegroundColor White
Write-Host "✅ Fallback recipe generation" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test your deployment:" -ForegroundColor Blue
Write-Host "node test-titan-deployment.js" -ForegroundColor White
Write-Host ""
Write-Host "📱 Web Application:" -ForegroundColor Blue
Write-Host "http://ai-recipe-generator-web-app-914877613.s3-website-us-east-1.amazonaws.com" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Expected Result: No more 'use case details' errors!" -ForegroundColor Green