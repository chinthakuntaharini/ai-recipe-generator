# AWS CLI Configuration Script for AI Recipe Generator
# This script helps configure AWS CLI for the AI Recipe Generator project

param(
    [Parameter(Mandatory=$false)]
    [string]$AccessKey,
    
    [Parameter(Mandatory=$false)]
    [string]$SecretKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ProfileName = "ai-recipe-generator",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🚀 AWS CLI Configuration for AI Recipe Generator" -ForegroundColor Cyan
Write-Host "Target Account: 972803002725 (Vedanth Raj)" -ForegroundColor Yellow
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>$null
    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check current configuration
Write-Host "📋 Current AWS Configuration:" -ForegroundColor Cyan
aws configure list

$currentAccount = ""
try {
    $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    $currentAccount = $identity.Account
    Write-Host "Current Account: $currentAccount" -ForegroundColor Yellow
} catch {
    Write-Host "No valid AWS credentials configured" -ForegroundColor Yellow
}

Write-Host ""

# Check if we need to configure for the target account
if ($currentAccount -eq "972803002725") {
    Write-Host "✅ Already configured for target account (972803002725)" -ForegroundColor Green
    
    # Verify service access
    Write-Host "🔍 Verifying service access..." -ForegroundColor Cyan
    
    # Test Bedrock
    try {
        aws bedrock list-foundation-models --region $Region --output table --query 'modelSummaries[?contains(modelId, `claude`)].{ModelId:modelId,ModelName:modelName}' 2>$null
        Write-Host "✅ Bedrock access verified" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Bedrock access needs verification" -ForegroundColor Yellow
    }
    
    # Test DynamoDB
    try {
        aws dynamodb list-tables --region $Region --output json 2>$null | Out-Null
        Write-Host "✅ DynamoDB access verified" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  DynamoDB access needs verification" -ForegroundColor Yellow
    }
    
    exit 0
}

Write-Host "⚙️  Configuration needed for target account (972803002725)" -ForegroundColor Yellow
Write-Host ""

# Configuration options
Write-Host "Choose configuration method:" -ForegroundColor Cyan
Write-Host "1. Interactive configuration (recommended for first-time setup)"
Write-Host "2. Use provided access keys"
Write-Host "3. AWS SSO configuration"
Write-Host "4. Show manual configuration instructions"

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "🔧 Starting interactive AWS CLI configuration..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "You'll need:" -ForegroundColor Yellow
        Write-Host "- AWS Access Key ID"
        Write-Host "- AWS Secret Access Key"
        Write-Host "- Default region (us-east-1 recommended for Bedrock)"
        Write-Host ""
        
        aws configure --profile $ProfileName
        
        # Set the profile as default
        $setDefault = Read-Host "Set this profile as default? (y/n)"
        if ($setDefault -eq "y" -or $setDefault -eq "Y") {
            $env:AWS_PROFILE = $ProfileName
            Write-Host "✅ Profile set as default for this session" -ForegroundColor Green
            Write-Host "To make permanent, add 'export AWS_PROFILE=$ProfileName' to your shell profile" -ForegroundColor Yellow
        }
    }
    
    "2" {
        if (-not $AccessKey -or -not $SecretKey) {
            $AccessKey = Read-Host "Enter AWS Access Key ID"
            $SecretKey = Read-Host "Enter AWS Secret Access Key" -AsSecureString
            $SecretKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretKey))
        }
        
        Write-Host "🔧 Configuring AWS CLI with provided credentials..." -ForegroundColor Cyan
        
        aws configure set aws_access_key_id $AccessKey --profile $ProfileName
        aws configure set aws_secret_access_key $SecretKey --profile $ProfileName
        aws configure set region $Region --profile $ProfileName
        aws configure set output json --profile $ProfileName
        
        Write-Host "✅ Configuration completed" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "🔧 Starting AWS SSO configuration..." -ForegroundColor Cyan
        Write-Host "You'll need your organization's SSO start URL" -ForegroundColor Yellow
        
        aws configure sso --profile "$ProfileName-sso"
        
        Write-Host "To login: aws sso login --profile $ProfileName-sso" -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host "📖 Manual Configuration Instructions:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Create IAM user in AWS Console (Account: 972803002725)" -ForegroundColor Yellow
        Write-Host "   - Username: ai-recipe-generator-dev"
        Write-Host "   - Access type: Programmatic access"
        Write-Host "   - Attach policy: PowerUserAccess (or custom policy)"
        Write-Host ""
        Write-Host "2. Configure credentials file (~/.aws/credentials):" -ForegroundColor Yellow
        Write-Host "   [$ProfileName]"
        Write-Host "   aws_access_key_id = YOUR_ACCESS_KEY"
        Write-Host "   aws_secret_access_key = YOUR_SECRET_KEY"
        Write-Host ""
        Write-Host "3. Configure config file (~/.aws/config):" -ForegroundColor Yellow
        Write-Host "   [profile $ProfileName]"
        Write-Host "   region = $Region"
        Write-Host "   output = json"
        Write-Host ""
        Write-Host "4. Set profile: export AWS_PROFILE=$ProfileName" -ForegroundColor Yellow
        
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Verify configuration
Write-Host ""
Write-Host "🔍 Verifying configuration..." -ForegroundColor Cyan

try {
    $identity = aws sts get-caller-identity --profile $ProfileName --output json | ConvertFrom-Json
    
    if ($identity.Account -eq "972803002725") {
        Write-Host "✅ Successfully configured for target account!" -ForegroundColor Green
        Write-Host "Account: $($identity.Account)" -ForegroundColor Green
        Write-Host "User ARN: $($identity.Arn)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Configured for different account ($($identity.Account))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Configuration verification failed" -ForegroundColor Red
    Write-Host "Please check your credentials and try again" -ForegroundColor Yellow
}

# Test required services
Write-Host ""
Write-Host "🧪 Testing service access..." -ForegroundColor Cyan

$services = @(
    @{Name="Bedrock"; Command="aws bedrock list-foundation-models --region $Region --profile $ProfileName --output json"},
    @{Name="DynamoDB"; Command="aws dynamodb list-tables --region $Region --profile $ProfileName --output json"},
    @{Name="Cognito"; Command="aws cognito-idp list-user-pools --max-results 1 --region $Region --profile $ProfileName --output json"},
    @{Name="API Gateway"; Command="aws apigateway get-rest-apis --region $Region --profile $ProfileName --output json"},
    @{Name="Lambda"; Command="aws lambda list-functions --region $Region --profile $ProfileName --output json"}
)

foreach ($service in $services) {
    try {
        Invoke-Expression $service.Command | Out-Null
        Write-Host "✅ $($service.Name) access verified" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($service.Name) access needs verification (may need permissions)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 AWS CLI configuration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Request Bedrock model access in AWS Console"
Write-Host "2. Set up Cognito user pool (Task 1.2.2)"
Write-Host "3. Create DynamoDB table (Task 1.2.3)"
Write-Host ""
Write-Host "To use this profile:" -ForegroundColor Yellow
Write-Host "  export AWS_PROFILE=$ProfileName"
Write-Host "  # or use --profile $ProfileName with AWS CLI commands"