# IAM User Setup Guide for AI Recipe Generator Development

## Overview
This guide provides step-by-step instructions for creating an IAM user with programmatic access specifically for developing the AI Recipe Generator project. The user will have the minimum required permissions following the principle of least privilege while enabling all necessary AWS services.

## Prerequisites
- AWS Account ID: 972803002725 (Vedanth Raj)
- AWS CLI configured with administrative access
- Access to AWS Management Console

## Step 1: Create IAM User

### Using AWS Management Console:

1. **Navigate to IAM Service**
   - Log into AWS Management Console
   - Go to Services → Security, Identity, & Compliance → IAM

2. **Create New User**
   - Click "Users" in the left navigation
   - Click "Create user" button
   - Enter username: `ai-recipe-generator-dev`
   - Select "Programmatic access" (Access key - Programmatic access)
   - Click "Next: Permissions"

### Using AWS CLI:
```bash
aws iam create-user --user-name ai-recipe-generator-dev --path /developers/
```

## Step 2: Create Custom IAM Policy

Create a custom policy that provides the minimum required permissions for all AWS services needed by the AI Recipe Generator.

### Policy Document (ai-recipe-generator-dev-policy.json):

```json
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
                "arn:aws:bedrock:*:972803002725:foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
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
                "arn:aws:dynamodb:*:972803002725:table/ai-recipe-generator-*",
                "arn:aws:dynamodb:*:972803002725:table/ai-recipe-generator-*/index/*"
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
                "arn:aws:lambda:*:972803002725:function:ai-recipe-generator-*"
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
                "arn:aws:cloudformation:*:972803002725:stack/ai-recipe-generator-*/*"
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
                "arn:aws:iam::972803002725:role/ai-recipe-generator-*",
                "arn:aws:iam::972803002725:policy/ai-recipe-generator-*"
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
```

### Create the Policy:

#### Using AWS CLI:
```bash
# Save the policy document to a file
cat > ai-recipe-generator-dev-policy.json << 'EOF'
[Policy JSON content from above]
EOF

# Create the policy
aws iam create-policy \
    --policy-name ai-recipe-generator-dev-policy \
    --policy-document file://ai-recipe-generator-dev-policy.json \
    --description "Development policy for AI Recipe Generator project"
```

#### Using AWS Management Console:
1. Go to IAM → Policies
2. Click "Create policy"
3. Click "JSON" tab
4. Paste the policy document above
5. Click "Next: Tags" (optional)
6. Click "Next: Review"
7. Name: `ai-recipe-generator-dev-policy`
8. Description: `Development policy for AI Recipe Generator project`
9. Click "Create policy"

## Step 3: Attach Policy to User

### Using AWS CLI:
```bash
aws iam attach-user-policy \
    --user-name ai-recipe-generator-dev \
    --policy-arn arn:aws:iam::972803002725:policy/ai-recipe-generator-dev-policy
```

### Using AWS Management Console:
1. Go to IAM → Users
2. Click on `ai-recipe-generator-dev`
3. Click "Permissions" tab
4. Click "Add permissions"
5. Select "Attach existing policies directly"
6. Search for `ai-recipe-generator-dev-policy`
7. Check the policy and click "Next: Review"
8. Click "Add permissions"

## Step 4: Create Access Keys

### Using AWS CLI:
```bash
aws iam create-access-key --user-name ai-recipe-generator-dev
```

### Using AWS Management Console:
1. Go to IAM → Users → ai-recipe-generator-dev
2. Click "Security credentials" tab
3. Click "Create access key"
4. Select "Command Line Interface (CLI)"
5. Check the confirmation box
6. Click "Next"
7. Add description: "AI Recipe Generator Development Access"
8. Click "Create access key"
9. **IMPORTANT**: Download the CSV file or copy the Access Key ID and Secret Access Key immediately

## Step 5: Configure Development Environment

### Set Environment Variables:
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-1"  # or your preferred region
export AWS_ACCOUNT_ID="972803002725"
```

### Configure AWS CLI Profile:
```bash
aws configure --profile ai-recipe-generator-dev
# Enter the access key ID and secret access key when prompted
# Set default region (e.g., us-east-1)
# Set default output format (json recommended)
```

### Test Configuration:
```bash
# Test basic access
aws sts get-caller-identity --profile ai-recipe-generator-dev

# Test Bedrock access
aws bedrock list-foundation-models --profile ai-recipe-generator-dev

# Test DynamoDB access
aws dynamodb list-tables --profile ai-recipe-generator-dev
```

## Step 6: Security Best Practices

### 1. Access Key Rotation
- Set up a reminder to rotate access keys every 90 days
- Create new keys before deleting old ones to avoid service interruption

### 2. Environment-Specific Keys
- Use different IAM users for different environments (dev, staging, prod)
- Never use production keys in development

### 3. Secure Storage
- Never commit access keys to version control
- Use environment variables or AWS credentials file
- Consider using AWS Secrets Manager for production

### 4. Monitoring
- Enable CloudTrail to monitor API usage
- Set up CloudWatch alarms for unusual activity
- Review IAM access regularly

## Step 7: Verification Checklist

- [ ] IAM user `ai-recipe-generator-dev` created successfully
- [ ] Custom policy `ai-recipe-generator-dev-policy` created and attached
- [ ] Access keys generated and securely stored
- [ ] AWS CLI configured with new credentials
- [ ] Basic AWS service access tested
- [ ] Environment variables set up
- [ ] Security best practices implemented

## Troubleshooting

### Common Issues:

1. **Access Denied Errors**
   - Verify policy is correctly attached to user
   - Check resource ARNs match your account ID
   - Ensure region-specific resources are accessible

2. **Bedrock Access Issues**
   - Verify Claude 3 Sonnet model access has been requested
   - Check if Bedrock is available in your region
   - Ensure model ARN is correct

3. **CLI Configuration Issues**
   - Verify access keys are correctly entered
   - Check AWS region configuration
   - Test with `aws sts get-caller-identity`

### Support Resources:
- AWS IAM Documentation: https://docs.aws.amazon.com/iam/
- AWS CLI Configuration: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
- AWS Free Tier Monitoring: https://aws.amazon.com/free/

## Next Steps

After completing this setup:
1. Proceed to task 1.2.1: Enable Amazon Bedrock service
2. Set up development environment for the AI Recipe Generator
3. Begin implementing the authentication service (Phase 2.1)

## Cost Monitoring

Remember to monitor your AWS usage to stay within free tier limits:
- Set up billing alerts (already completed in task 1.1.2)
- Regularly check AWS Cost Explorer
- Monitor service usage in CloudWatch

---

**Security Note**: Keep your access keys secure and never share them. If compromised, immediately rotate the keys through the AWS console.