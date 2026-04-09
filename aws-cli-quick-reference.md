# AWS CLI Quick Reference - AI Recipe Generator

## Profile Management

```bash
# Configure new profile
aws configure --profile ai-recipe-generator

# List all profiles
aws configure list-profiles

# Use specific profile
aws sts get-caller-identity --profile ai-recipe-generator

# Set default profile for session
export AWS_PROFILE=ai-recipe-generator
```

## Identity & Access

```bash
# Check current identity
aws sts get-caller-identity

# Verify account (should be 972803002725)
aws sts get-caller-identity --query Account --output text

# List IAM users
aws iam list-users

# Get current user permissions
aws iam list-attached-user-policies --user-name ai-recipe-generator-dev
```

## Amazon Bedrock

```bash
# List all foundation models
aws bedrock list-foundation-models --region us-east-1

# List Claude models specifically
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude`)]'

# Check Claude 3 Sonnet availability
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?modelId==`anthropic.claude-3-sonnet-20240229-v1:0`]'

# Test model invocation (after setup)
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --region us-east-1 \
  response.json
```

## Amazon Cognito

```bash
# List user pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Create user pool
aws cognito-idp create-user-pool \
  --pool-name ai-recipe-generator-users \
  --region us-east-1

# List user pool clients
aws cognito-idp list-user-pool-clients --user-pool-id us-east-1_XXXXXXXXX

# Create user pool client
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-name ai-recipe-generator-client \
  --region us-east-1
```

## DynamoDB

```bash
# List tables
aws dynamodb list-tables --region us-east-1

# Create table
aws dynamodb create-table \
  --table-name RecipeHistory \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=recipeId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=recipeId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Describe table
aws dynamodb describe-table --table-name RecipeHistory --region us-east-1

# Scan table (for testing)
aws dynamodb scan --table-name RecipeHistory --region us-east-1
```

## API Gateway

```bash
# List REST APIs
aws apigateway get-rest-apis --region us-east-1

# Create REST API
aws apigateway create-rest-api \
  --name ai-recipe-generator-api \
  --description "API for AI Recipe Generator" \
  --region us-east-1

# Get API resources
aws apigateway get-resources --rest-api-id YOUR_API_ID --region us-east-1
```

## AWS Lambda

```bash
# List functions
aws lambda list-functions --region us-east-1

# Create function (after preparing deployment package)
aws lambda create-function \
  --function-name generateRecipe \
  --runtime nodejs18.x \
  --role arn:aws:iam::972803002725:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --region us-east-1

# Invoke function
aws lambda invoke \
  --function-name generateRecipe \
  --payload '{"ingredients":["chicken","rice"]}' \
  --region us-east-1 \
  response.json
```

## AWS Amplify

```bash
# List apps
aws amplify list-apps --region us-east-1

# Create app
aws amplify create-app \
  --name ai-recipe-generator \
  --description "AI Recipe Generator Frontend" \
  --region us-east-1

# List branches
aws amplify list-branches --app-id YOUR_APP_ID --region us-east-1
```

## CloudWatch

```bash
# List log groups
aws logs describe-log-groups --region us-east-1

# Get log events
aws logs get-log-events \
  --log-group-name /aws/lambda/generateRecipe \
  --log-stream-name LATEST \
  --region us-east-1

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ai-recipe-generator \
  --dashboard-body file://dashboard.json \
  --region us-east-1
```

## Cost & Billing

```bash
# Get cost and usage (requires Cost Explorer API access)
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# List budgets
aws budgets describe-budgets --account-id 972803002725

# Get free tier usage
aws support describe-cases --language en --include-resolved-cases
```

## Useful Queries & Filters

```bash
# Get only running Lambda functions
aws lambda list-functions --query 'Functions[?State==`Active`].FunctionName' --output table

# Get DynamoDB tables with billing mode
aws dynamodb list-tables --query 'TableNames' --output table

# Get Cognito user pools with creation date
aws cognito-idp list-user-pools --max-results 50 --query 'UserPools[*].{Name:Name,Id:Id,CreationDate:CreationDate}' --output table

# Get API Gateway APIs with their IDs
aws apigateway get-rest-apis --query 'items[*].{Name:name,Id:id,CreatedDate:createdDate}' --output table
```

## Environment Variables

```bash
# Set profile for session
export AWS_PROFILE=ai-recipe-generator

# Set region
export AWS_DEFAULT_REGION=us-east-1

# Set output format
export AWS_DEFAULT_OUTPUT=json

# For CI/CD (use IAM roles instead in production)
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

## Common Troubleshooting

```bash
# Check credentials
aws configure list

# Test basic connectivity
aws sts get-caller-identity

# Check region configuration
aws configure get region

# Verify service availability in region
aws ec2 describe-regions --query 'Regions[?RegionName==`us-east-1`]'

# Check IAM permissions (if access denied)
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::972803002725:user/ai-recipe-generator-dev \
  --action-names bedrock:ListFoundationModels \
  --resource-arns "*"
```

## Free Tier Monitoring Commands

```bash
# Check Lambda invocations this month
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum

# Check DynamoDB consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=RecipeHistory \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Sum
```