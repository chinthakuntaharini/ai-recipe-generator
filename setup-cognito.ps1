# PowerShell script to set up Amazon Cognito User Pool for AI Recipe Generator
# This script automates the creation of user pool, client, and basic configuration

param(
    [string]$Profile = "ai-recipe-generator-dev",
    [string]$Region = "us-east-1",
    [string]$UserPoolName = "ai-recipe-generator-users",
    [string]$ClientName = "ai-recipe-generator-web-client"
)

Write-Host "🔐 Setting up Amazon Cognito for AI Recipe Generator" -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Function to handle AWS CLI errors
function Invoke-AWSCommand {
    param([string]$Command, [string]$Description)
    
    Write-Host "Executing: $Description..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
            return $result
        } else {
            Write-Host "❌ $Description failed" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Error in $Description`: $_" -ForegroundColor Red
        return $null
    }
}

# Step 1: Create User Pool
Write-Host "Step 1: Creating Cognito User Pool" -ForegroundColor Cyan

$userPoolCommand = @"
aws cognito-idp create-user-pool \
  --pool-name "$UserPoolName" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --verification-message-template '{
    "DefaultEmailOption": "CONFIRM_WITH_CODE",
    "DefaultEmailSubject": "AI Recipe Generator - Verify your email",
    "DefaultEmailMessage": "Welcome to AI Recipe Generator! Your verification code is {####}. Please enter this code to complete your registration."
  }' \
  --admin-create-user-config '{
    "AllowAdminCreateUserOnly": false,
    "InviteMessageTemplate": {
      "EmailSubject": "Welcome to AI Recipe Generator",
      "EmailMessage": "Welcome! Your temporary password is {####}"
    }
  }' \
  --user-pool-tags '{
    "Project": "AI-Recipe-Generator",
    "Environment": "Development",
    "CreatedBy": "PowerShell-Script"
  }' \
  --region $Region \
  --profile $Profile \
  --output json
"@

$userPoolResult = Invoke-AWSCommand -Command $userPoolCommand -Description "Create User Pool"

if ($userPoolResult) {
    $userPool = $userPoolResult | ConvertFrom-Json
    $userPoolId = $userPool.UserPool.Id
    Write-Host "User Pool ID: $userPoolId" -ForegroundColor Green
} else {
    Write-Host "Failed to create user pool. Exiting." -ForegroundColor Red
    exit 1
}

# Step 2: Create User Pool Client
Write-Host ""
Write-Host "Step 2: Creating User Pool Client" -ForegroundColor Cyan

$clientCommand = @"
aws cognito-idp create-user-pool-client \
  --user-pool-id "$userPoolId" \
  --client-name "$ClientName" \
  --generate-secret false \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH \
  --supported-identity-providers COGNITO \
  --read-attributes email \
  --write-attributes email \
  --token-validity-units '{
    "AccessToken": "hours",
    "IdToken": "hours", 
    "RefreshToken": "days"
  }' \
  --access-token-validity 1 \
  --id-token-validity 1 \
  --refresh-token-validity 30 \
  --prevent-user-existence-errors ENABLED \
  --region $Region \
  --profile $Profile \
  --output json
"@

$clientResult = Invoke-AWSCommand -Command $clientCommand -Description "Create User Pool Client"

if ($clientResult) {
    $client = $clientResult | ConvertFrom-Json
    $clientId = $client.UserPoolClient.ClientId
    Write-Host "Client ID: $clientId" -ForegroundColor Green
} else {
    Write-Host "Failed to create user pool client. Exiting." -ForegroundColor Red
    exit 1
}

# Step 3: Create User Pool Domain (Optional)
Write-Host ""
Write-Host "Step 3: Creating User Pool Domain" -ForegroundColor Cyan

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$domainPrefix = "ai-recipe-generator-$timestamp"

$domainCommand = @"
aws cognito-idp create-user-pool-domain \
  --domain "$domainPrefix" \
  --user-pool-id "$userPoolId" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$domainResult = Invoke-AWSCommand -Command $domainCommand -Description "Create User Pool Domain"

if ($domainResult) {
    Write-Host "Domain: https://$domainPrefix.auth.$Region.amazoncognito.com" -ForegroundColor Green
} else {
    Write-Host "⚠️  Domain creation failed (optional step)" -ForegroundColor Yellow
}

# Step 4: Create Test User
Write-Host ""
Write-Host "Step 4: Creating Test User" -ForegroundColor Cyan

$testEmail = "test@example.com"
$tempPassword = "TempPass123!"
$finalPassword = "TestPass123!"

# Create test user
$createUserCommand = @"
aws cognito-idp admin-create-user \
  --user-pool-id "$userPoolId" \
  --username "$testEmail" \
  --user-attributes Name=email,Value=$testEmail \
  --temporary-password "$tempPassword" \
  --message-action SUPPRESS \
  --region $Region \
  --profile $Profile
"@

$createUserResult = Invoke-AWSCommand -Command $createUserCommand -Description "Create Test User"

if ($createUserResult) {
    # Set permanent password
    $setPasswordCommand = @"
aws cognito-idp admin-set-user-password \
  --user-pool-id "$userPoolId" \
  --username "$testEmail" \
  --password "$finalPassword" \
  --permanent \
  --region $Region \
  --profile $Profile
"@
    
    $setPasswordResult = Invoke-AWSCommand -Command $setPasswordCommand -Description "Set Permanent Password"
    
    if ($setPasswordResult) {
        Write-Host "Test user created successfully:" -ForegroundColor Green
        Write-Host "  Email: $testEmail" -ForegroundColor White
        Write-Host "  Password: $finalPassword" -ForegroundColor White
    }
}

# Step 5: Test Configuration
Write-Host ""
Write-Host "Step 5: Testing Configuration" -ForegroundColor Cyan

# Test user pool description
$describeCommand = @"
aws cognito-idp describe-user-pool \
  --user-pool-id "$userPoolId" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$describeResult = Invoke-AWSCommand -Command $describeCommand -Description "Describe User Pool"

if ($describeResult) {
    $poolInfo = $describeResult | ConvertFrom-Json
    Write-Host "✅ User Pool Status: $($poolInfo.UserPool.Status)" -ForegroundColor Green
}

# Test client description
$describeClientCommand = @"
aws cognito-idp describe-user-pool-client \
  --user-pool-id "$userPoolId" \
  --client-id "$clientId" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$describeClientResult = Invoke-AWSCommand -Command $describeClientCommand -Description "Describe User Pool Client"

if ($describeClientResult) {
    Write-Host "✅ User Pool Client configured successfully" -ForegroundColor Green
}

# Step 6: Generate Configuration Files
Write-Host ""
Write-Host "Step 6: Generating Configuration Files" -ForegroundColor Cyan

# Create environment configuration
$envConfig = @"
# AWS Cognito Configuration for AI Recipe Generator
# Add these to your .env.local file

NEXT_PUBLIC_AWS_REGION=$Region
NEXT_PUBLIC_USER_POOL_ID=$userPoolId
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$clientId
NEXT_PUBLIC_USER_POOL_DOMAIN=https://$domainPrefix.auth.$Region.amazoncognito.com

# For backend/Lambda functions
AWS_REGION=$Region
USER_POOL_ID=$userPoolId
USER_POOL_CLIENT_ID=$clientId
"@

$envConfig | Out-File -FilePath "cognito-config.env" -Encoding UTF8
Write-Host "✅ Environment configuration saved to: cognito-config.env" -ForegroundColor Green

# Create AWS Amplify configuration
$amplifyConfig = @"
// AWS Amplify Configuration for AI Recipe Generator
// Import this in your Next.js app

import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: '$Region',
    userPoolId: '$userPoolId',
    userPoolWebClientId: '$clientId',
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH',
    oauth: {
      domain: '$domainPrefix.auth.$Region.amazoncognito.com',
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'http://localhost:3000/',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'code'
    }
  }
};

Amplify.configure(awsConfig);
export default awsConfig;
"@

$amplifyConfig | Out-File -FilePath "aws-config.js" -Encoding UTF8
Write-Host "✅ Amplify configuration saved to: aws-config.js" -ForegroundColor Green

# Create Lambda authorizer template
$authorizerTemplate = @"
// Lambda Authorizer for API Gateway
// Validates Cognito JWT tokens

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://cognito-idp.$Region.amazonaws.com/$userPoolId/.well-known/jwks.json'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

exports.handler = async (event) => {
  const token = event.authorizationToken.replace('Bearer ', '');
  
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: '$clientId',
        issuer: 'https://cognito-idp.$Region.amazonaws.com/$userPoolId',
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    
    return generatePolicy('user', 'Allow', event.methodArn, {
      userId: decoded.sub,
      email: decoded.email
    });
  } catch (error) {
    console.error('Token validation failed:', error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

function generatePolicy(principalId, effect, resource, context = {}) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    },
    context
  };
}
"@

$authorizerTemplate | Out-File -FilePath "cognito-authorizer.js" -Encoding UTF8
Write-Host "✅ Lambda authorizer template saved to: cognito-authorizer.js" -ForegroundColor Green

# Create test script
$testScript = @"
# Test Cognito Configuration
# Run these commands to verify your setup

# 1. List user pools
aws cognito-idp list-user-pools --max-results 10 --region $Region --profile $Profile

# 2. Describe your user pool
aws cognito-idp describe-user-pool --user-pool-id "$userPoolId" --region $Region --profile $Profile

# 3. List users in pool
aws cognito-idp list-users --user-pool-id "$userPoolId" --region $Region --profile $Profile

# 4. Test user authentication (requires additional setup)
# Use the test credentials:
# Email: $testEmail
# Password: $finalPassword

# 5. Get JWT token (use in your frontend application)
# This requires implementing the authentication flow in your app
"@

$testScript | Out-File -FilePath "test-cognito.sh" -Encoding UTF8
Write-Host "✅ Test script saved to: test-cognito.sh" -ForegroundColor Green

# Step 7: Summary and Next Steps
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "User Pool ID: $userPoolId" -ForegroundColor White
Write-Host "Client ID: $clientId" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Domain: https://$domainPrefix.auth.$Region.amazoncognito.com" -ForegroundColor White
Write-Host ""
Write-Host "👤 Test User Credentials:" -ForegroundColor Cyan
Write-Host "Email: $testEmail" -ForegroundColor White
Write-Host "Password: $finalPassword" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files Created:" -ForegroundColor Cyan
Write-Host "• cognito-config.env - Environment variables" -ForegroundColor White
Write-Host "• aws-config.js - Amplify configuration" -ForegroundColor White
Write-Host "• cognito-authorizer.js - Lambda authorizer template" -ForegroundColor White
Write-Host "• test-cognito.sh - Test commands" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy environment variables to your .env.local file" -ForegroundColor White
Write-Host "2. Import aws-config.js in your Next.js application" -ForegroundColor White
Write-Host "3. Implement authentication components using AWS Amplify" -ForegroundColor White
Write-Host "4. Create Lambda authorizer function for API Gateway" -ForegroundColor White
Write-Host "5. Test user registration and login flows" -ForegroundColor White
Write-Host "6. Proceed to task 1.2.3: Create DynamoDB table" -ForegroundColor White
Write-Host ""
Write-Host "💡 Important Notes:" -ForegroundColor Yellow
Write-Host "• Keep your User Pool ID and Client ID secure" -ForegroundColor White
Write-Host "• Test user is for development only - remove in production" -ForegroundColor White
Write-Host "• Configure CORS in API Gateway for frontend integration" -ForegroundColor White
Write-Host "• Monitor usage to stay within Cognito free tier (50K MAU)" -ForegroundColor White

Write-Host ""
Write-Host "✅ Amazon Cognito setup completed successfully!" -ForegroundColor Green