# AWS CLI Configuration Guide for AI Recipe Generator

## Overview

This guide provides step-by-step instructions for configuring AWS CLI with appropriate credentials for the AI Recipe Generator project. The system requires access to multiple AWS services including Amazon Bedrock, Cognito, DynamoDB, API Gateway, Lambda, Amplify, and CloudWatch.

**Target AWS Account:**
- Account ID: 972803002725
- Account Name: Vedanth Raj

## Current Status

✅ AWS CLI is installed (version 2.33.5)
⚠️ Currently configured for different account (127393435518)
🎯 Need to configure for target account (972803002725)

## Configuration Methods

### Method 1: AWS Access Keys (Recommended for Development)

#### Step 1: Create IAM User with Programmatic Access

1. **Log into AWS Console** for account 972803002725
2. **Navigate to IAM** → Users → Create User
3. **User Details:**
   - Username: `ai-recipe-generator-dev`
   - Access type: ✅ Programmatic access
4. **Attach Policies** (choose appropriate level):
   - For development: `PowerUserAccess` (recommended)
   - For production: Create custom policy with minimal required permissions

#### Step 2: Required IAM Permissions

Create a custom policy with these minimum permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:*",
                "cognito-idp:*",
                "dynamodb:*",
                "apigateway:*",
                "lambda:*",
                "amplify:*",
                "logs:*",
                "cloudwatch:*",
                "iam:PassRole",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:GetRole",
                "cloudformation:*",
                "s3:*"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Step 3: Configure AWS CLI

**Option A: Using AWS Configure Command**
```bash
aws configure --profile ai-recipe-generator
```

When prompted, enter:
- AWS Access Key ID: [Your access key from Step 1]
- AWS Secret Access Key: [Your secret key from Step 1]
- Default region name: `us-east-1` (recommended for Bedrock availability)
- Default output format: `json`

**Option B: Manual Configuration**

Create/edit `~/.aws/credentials`:
```ini
[ai-recipe-generator]
aws_access_key_id = YOUR_ACCESS_KEY_HERE
aws_secret_access_key = YOUR_SECRET_KEY_HERE
```

Create/edit `~/.aws/config`:
```ini
[profile ai-recipe-generator]
region = us-east-1
output = json
```

#### Step 4: Set Default Profile

**Option A: Environment Variable (Temporary)**
```bash
export AWS_PROFILE=ai-recipe-generator
```

**Option B: Set as Default Profile**
```bash
aws configure set default.profile ai-recipe-generator
```

### Method 2: AWS SSO (Recommended for Team/Production)

#### Step 1: Set up AWS SSO
```bash
aws configure sso
```

Follow prompts:
- SSO start URL: [Your organization's SSO URL]
- SSO region: `us-east-1`
- Account ID: `972803002725`
- Role name: [Select appropriate role]
- Profile name: `ai-recipe-generator-sso`

#### Step 2: Login to SSO
```bash
aws sso login --profile ai-recipe-generator-sso
```

### Method 3: IAM Roles (For EC2/Lambda)

For applications running on AWS infrastructure:

```bash
# No configuration needed - uses instance/execution role
# Ensure EC2 instance or Lambda has appropriate IAM role attached
```

## Verification Steps

### 1. Verify Account Access
```bash
aws sts get-caller-identity --profile ai-recipe-generator
```

Expected output:
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "972803002725",
    "Arn": "arn:aws:iam::972803002725:user/ai-recipe-generator-dev"
}
```

### 2. Test Service Access

**Test Bedrock Access:**
```bash
aws bedrock list-foundation-models --region us-east-1 --profile ai-recipe-generator
```

**Test Cognito Access:**
```bash
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 --profile ai-recipe-generator
```

**Test DynamoDB Access:**
```bash
aws dynamodb list-tables --region us-east-1 --profile ai-recipe-generator
```

### 3. Verify Region Configuration
```bash
aws configure get region --profile ai-recipe-generator
```

Should return: `us-east-1`

## Security Best Practices

### 1. Credential Security
- ✅ Never commit AWS credentials to version control
- ✅ Use environment variables for CI/CD pipelines
- ✅ Rotate access keys regularly (every 90 days)
- ✅ Use least privilege principle for IAM policies
- ✅ Enable MFA for AWS Console access

### 2. Environment-Specific Configurations

**Development Environment:**
```bash
# Use named profile
export AWS_PROFILE=ai-recipe-generator-dev
```

**Production Environment:**
```bash
# Use IAM roles or SSO
# Never use long-term access keys in production
```

### 3. Credential Storage Locations

**Windows:**
- Credentials: `%USERPROFILE%\.aws\credentials`
- Config: `%USERPROFILE%\.aws\config`

**macOS/Linux:**
- Credentials: `~/.aws/credentials`
- Config: `~/.aws/config`

## Environment Variables Alternative

For CI/CD or containerized environments:

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
export AWS_DEFAULT_OUTPUT=json
```

## Troubleshooting

### Common Issues

**1. "Unable to locate credentials"**
```bash
# Check configuration
aws configure list --profile ai-recipe-generator

# Verify credentials file
cat ~/.aws/credentials
```

**2. "Access Denied" errors**
```bash
# Check current identity
aws sts get-caller-identity --profile ai-recipe-generator

# Verify IAM permissions in AWS Console
```

**3. "Region not supported" for Bedrock**
```bash
# Ensure using supported region
aws configure set region us-east-1 --profile ai-recipe-generator
```

### Service-Specific Requirements

**Amazon Bedrock:**
- Must request model access in AWS Console
- Currently available in: us-east-1, us-west-2, eu-west-1
- Claude 3 Sonnet model ID: `anthropic.claude-3-sonnet-20240229-v1:0`

**Amazon Cognito:**
- Available in all standard regions
- User pools and identity pools have separate configurations

**DynamoDB:**
- Global service with regional endpoints
- Consider using DynamoDB Global Tables for multi-region

## Next Steps

After configuring AWS CLI:

1. ✅ **Verify account access** with `aws sts get-caller-identity`
2. ⏭️ **Request Bedrock model access** (Task 1.2.1)
3. ⏭️ **Set up Cognito user pool** (Task 1.2.2)
4. ⏭️ **Create DynamoDB table** (Task 1.2.3)
5. ⏭️ **Configure API Gateway** (Task 1.2.4)

## Free Tier Monitoring

Monitor usage to stay within AWS Free Tier limits:

```bash
# Check current month's usage
aws ce get-dimension-values --dimension SERVICE --time-period Start=2024-01-01,End=2024-01-31 --profile ai-recipe-generator
```

Set up billing alerts (already completed in task 1.1.2) to monitor:
- Lambda invocations (1M free per month)
- DynamoDB read/write units (25 each free per month)
- API Gateway calls (1M free per month)
- Cognito MAU (50,000 free per month)

---

**Configuration Complete!** 🎉

Your AWS CLI is now configured for the AI Recipe Generator project with appropriate security practices and service access.