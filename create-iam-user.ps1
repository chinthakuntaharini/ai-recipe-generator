# PowerShell script to create IAM user for AI Recipe Generator development
# Run this script with appropriate AWS credentials configured

param(
    [string]$UserName = "ai-recipe-generator-dev",
    [string]$PolicyName = "ai-recipe-generator-dev-policy",
    [string]$AccountId = "972803002725"
)

Write-Host "Creating IAM user and policy for AI Recipe Generator development..." -ForegroundColor Green

# Check if AWS CLI is installed and configured
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "Current AWS Identity: $($identity.Arn)" -ForegroundColor Yellow
} catch {
    Write-Error "AWS CLI not configured or not installed. Please configure AWS CLI first."
    exit 1
}

# Create the policy document
$policyDocument = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "BedrockAccess",
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:ListFoundationModels",
                "bedrock:GetFoundationModel"
            ],
            "Resource": [
                "arn:aws:bedrock:*:$AccountId:foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
            ]
        },
        {
            "Sid": "CognitoAccess",
            "Effect": "Allow",
            "Action": [
                "cognito-idp:CreateUserPool",
                "cognito-idp:CreateUserPoolClient",
                "cognito-idp:UpdateUserPool",
                "cognito-idp:UpdateUserPoolClient",
                "cognito-idp:DescribeUserPool",
                "cognito-idp:DescribeUserPoolClient",
                "cognito-idp:ListUserPools",
                "cognito-idp:ListUserPoolClients",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminSetUserPassword",
                "cognito-idp:AdminConfirmSignUp",
                "cognito-idp:AdminInitiateAuth",
                "cognito-idp:AdminRespondToAuthChallenge",
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminDeleteUser",
                "cognito-identity:CreateIdentityPool",
                "cognito-identity:UpdateIdentityPool",
                "cognito-identity:DescribeIdentityPool",
                "cognito-identity:ListIdentityPools",
                "cognito-identity:SetIdentityPoolRoles"
            ],
            "Resource": "*"
        },
        {
            "Sid": "DynamoDBAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:UpdateTable",
                "dynamodb:DescribeTable",
                "dynamodb:ListTables",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:CreateGlobalSecondaryIndex",
                "dynamodb:UpdateGlobalSecondaryIndex",
                "dynamodb:DescribeGlobalSecondaryIndex"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:$AccountId:table/ai-recipe-generator-*",
                "arn:aws:dynamodb:*:$AccountId:table/ai-recipe-generator-*/index/*"
            ]
        },
        {
            "Sid": "APIGatewayAccess",
            "Effect": "Allow",
            "Action": [
                "apigateway:GET",
                "apigateway:POST",
                "apigateway:PUT",
                "apigateway:DELETE",
                "apigateway:PATCH"
            ],
            "Resource": [
                "arn:aws:apigateway:*::/restapis",
                "arn:aws:apigateway:*::/restapis/*"
            ]
        },
        {
            "Sid": "LambdaAccess",
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:GetFunction",
                "lambda:ListFunctions",
                "lambda:DeleteFunction",
                "lambda:InvokeFunction",
                "lambda:CreateEventSourceMapping",
                "lambda:UpdateEventSourceMapping",
                "lambda:DeleteEventSourceMapping",
                "lambda:ListEventSourceMappings",
                "lambda:AddPermission",
                "lambda:RemovePermission",
                "lambda:GetPolicy",
                "lambda:TagResource",
                "lambda:UntagResource"
            ],
            "Resource": [
                "arn:aws:lambda:*:$AccountId:function:ai-recipe-generator-*"
            ]
        },
        {
            "Sid": "AmplifyAccess",
            "Effect": "Allow",
            "Action": [
                "amplify:CreateApp",
                "amplify:UpdateApp",
                "amplify:GetApp",
                "amplify:ListApps",
                "amplify:DeleteApp",
                "amplify:CreateBranch",
                "amplify:UpdateBranch",
                "amplify:GetBranch",
                "amplify:ListBranches",
                "amplify:DeleteBranch",
                "amplify:StartJob",
                "amplify:StopJob",
                "amplify:GetJob",
                "amplify:ListJobs",
                "amplify:CreateDeployment",
                "amplify:GetDomainAssociation",
                "amplify:CreateDomainAssociation",
                "amplify:UpdateDomainAssociation"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudWatchAccess",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:GetLogEvents",
                "logs:FilterLogEvents",
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics",
                "cloudwatch:PutDashboard",
                "cloudwatch:GetDashboard",
                "cloudwatch:ListDashboards",
                "cloudwatch:DeleteDashboard",
                "cloudwatch:PutMetricAlarm",
                "cloudwatch:DescribeAlarms",
                "cloudwatch:DeleteAlarms"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudFormationAccess",
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack",
                "cloudformation:DeleteStack",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DescribeStackResources",
                "cloudformation:ListStacks",
                "cloudformation:GetTemplate",
                "cloudformation:ValidateTemplate",
                "cloudformation:CreateChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:DescribeChangeSet",
                "cloudformation:DeleteChangeSet"
            ],
            "Resource": [
                "arn:aws:cloudformation:*:$AccountId:stack/ai-recipe-generator-*/*"
            ]
        },
        {
            "Sid": "IAMRoleAccess",
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:UpdateRole",
                "iam:GetRole",
                "iam:ListRoles",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:GetRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:ListRolePolicies",
                "iam:ListAttachedRolePolicies",
                "iam:PassRole",
                "iam:CreatePolicy",
                "iam:GetPolicy",
                "iam:ListPolicies",
                "iam:CreatePolicyVersion",
                "iam:GetPolicyVersion",
                "iam:ListPolicyVersions"
            ],
            "Resource": [
                "arn:aws:iam::$AccountId:role/ai-recipe-generator-*",
                "arn:aws:iam::$AccountId:policy/ai-recipe-generator-*"
            ]
        },
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutBucketPolicy",
                "s3:GetBucketPolicy",
                "s3:PutBucketVersioning",
                "s3:GetBucketVersioning",
                "s3:PutBucketCORS",
                "s3:GetBucketCORS"
            ],
            "Resource": [
                "arn:aws:s3:::ai-recipe-generator-*",
                "arn:aws:s3:::ai-recipe-generator-*/*"
            ]
        }
    ]
}
"@

# Save policy document to temporary file
$policyFile = "temp-policy.json"
$policyDocument | Out-File -FilePath $policyFile -Encoding UTF8

try {
    # Step 1: Create IAM user
    Write-Host "Creating IAM user: $UserName" -ForegroundColor Cyan
    $userResult = aws iam create-user --user-name $UserName --path "/developers/" --output json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ IAM user created successfully" -ForegroundColor Green
    } elseif ($userResult -like "*EntityAlreadyExists*") {
        Write-Host "⚠ IAM user already exists, continuing..." -ForegroundColor Yellow
    } else {
        throw "Failed to create IAM user: $userResult"
    }

    # Step 2: Create IAM policy
    Write-Host "Creating IAM policy: $PolicyName" -ForegroundColor Cyan
    $policyResult = aws iam create-policy --policy-name $PolicyName --policy-document file://$policyFile --description "Development policy for AI Recipe Generator project" --output json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ IAM policy created successfully" -ForegroundColor Green
        $policyArn = ($policyResult | ConvertFrom-Json).Policy.Arn
    } elseif ($policyResult -like "*EntityAlreadyExists*") {
        Write-Host "⚠ IAM policy already exists, getting ARN..." -ForegroundColor Yellow
        $policyArn = "arn:aws:iam::$AccountId:policy/$PolicyName"
    } else {
        throw "Failed to create IAM policy: $policyResult"
    }

    # Step 3: Attach policy to user
    Write-Host "Attaching policy to user..." -ForegroundColor Cyan
    $attachResult = aws iam attach-user-policy --user-name $UserName --policy-arn $policyArn 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Policy attached successfully" -ForegroundColor Green
    } else {
        throw "Failed to attach policy: $attachResult"
    }

    # Step 4: Create access keys
    Write-Host "Creating access keys..." -ForegroundColor Cyan
    $accessKeyResult = aws iam create-access-key --user-name $UserName --output json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $accessKey = $accessKeyResult | ConvertFrom-Json
        Write-Host "✓ Access keys created successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: Save these credentials securely!" -ForegroundColor Red -BackgroundColor Yellow
        Write-Host "Access Key ID: $($accessKey.AccessKey.AccessKeyId)" -ForegroundColor White -BackgroundColor Black
        Write-Host "Secret Access Key: $($accessKey.AccessKey.SecretAccessKey)" -ForegroundColor White -BackgroundColor Black
        Write-Host ""
        
        # Save credentials to file
        $credentialsFile = "ai-recipe-generator-credentials.txt"
        @"
AI Recipe Generator Development Credentials
==========================================
Created: $(Get-Date)
User Name: $UserName
Access Key ID: $($accessKey.AccessKey.AccessKeyId)
Secret Access Key: $($accessKey.AccessKey.SecretAccessKey)
Policy ARN: $policyArn

Environment Variables:
export AWS_ACCESS_KEY_ID="$($accessKey.AccessKey.AccessKeyId)"
export AWS_SECRET_ACCESS_KEY="$($accessKey.AccessKey.SecretAccessKey)"
export AWS_DEFAULT_REGION="us-east-1"
export AWS_ACCOUNT_ID="$AccountId"

AWS CLI Profile Configuration:
aws configure --profile ai-recipe-generator-dev
# Enter the access key ID and secret access key when prompted

SECURITY WARNING: Keep these credentials secure and never commit to version control!
"@ | Out-File -FilePath $credentialsFile -Encoding UTF8
        
        Write-Host "Credentials saved to: $credentialsFile" -ForegroundColor Green
        Write-Host "Please store these credentials securely and delete the file after use." -ForegroundColor Yellow
    } else {
        throw "Failed to create access keys: $accessKeyResult"
    }

    # Step 5: Test configuration
    Write-Host "Testing IAM user configuration..." -ForegroundColor Cyan
    
    # Set temporary environment variables for testing
    $env:AWS_ACCESS_KEY_ID = $accessKey.AccessKey.AccessKeyId
    $env:AWS_SECRET_ACCESS_KEY = $accessKey.AccessKey.SecretAccessKey
    
    $testResult = aws sts get-caller-identity --output json 2>&1
    if ($LASTEXITCODE -eq 0) {
        $identity = $testResult | ConvertFrom-Json
        Write-Host "✓ Configuration test successful" -ForegroundColor Green
        Write-Host "User ARN: $($identity.Arn)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠ Configuration test failed: $testResult" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "IAM user setup completed successfully!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Configure your development environment with the provided credentials" -ForegroundColor White
    Write-Host "2. Test access to required AWS services" -ForegroundColor White
    Write-Host "3. Proceed to task 1.2.1: Enable Amazon Bedrock service" -ForegroundColor White

} catch {
    Write-Error "Error during IAM user setup: $_"
    exit 1
} finally {
    # Clean up temporary files
    if (Test-Path $policyFile) {
        Remove-Item $policyFile -Force
    }
    
    # Clear temporary environment variables
    Remove-Item Env:AWS_ACCESS_KEY_ID -ErrorAction SilentlyContinue
    Remove-Item Env:AWS_SECRET_ACCESS_KEY -ErrorAction SilentlyContinue
}