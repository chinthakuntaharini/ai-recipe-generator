# Amazon Bedrock Setup Guide for AI Recipe Generator

## Task 1.2.1: Enable Amazon Bedrock Service and Request Claude 3 Sonnet Model Access

### Overview
Amazon Bedrock is a fully managed service that offers foundation models from leading AI companies through an API. For the AI Recipe Generator project, we need access to Claude 3 Sonnet model for intelligent recipe generation.

**Target Account:** 972803002725 (Vedanth Raj)
**Required Model:** Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)

## Step 1: Enable Amazon Bedrock Service

### Prerequisites
- AWS account with appropriate permissions
- IAM user with Bedrock permissions (completed in task 1.1.4)
- AWS CLI configured

### Service Availability
Amazon Bedrock is available in the following regions:
- **us-east-1** (N. Virginia) - ✅ Recommended
- **us-west-2** (Oregon)
- **eu-west-1** (Ireland)
- **ap-southeast-1** (Singapore)
- **ap-northeast-1** (Tokyo)

**Note:** For this project, use **us-east-1** for optimal performance and feature availability.

### Enable Bedrock Service

#### Method 1: AWS Management Console
1. **Log into AWS Console** for account 972803002725
2. **Navigate to Amazon Bedrock**
   - Go to Services → Machine Learning → Amazon Bedrock
   - Or search for "Bedrock" in the services search
3. **Accept Service Terms**
   - If prompted, review and accept the Amazon Bedrock service terms
   - This is a one-time setup per account

#### Method 2: AWS CLI Verification
```bash
# Test if Bedrock is accessible
aws bedrock list-foundation-models --region us-east-1 --profile ai-recipe-generator-dev

# If successful, you'll see a list of available models
```

## Step 2: Request Claude 3 Sonnet Model Access

### Important Notes
- **Model access is NOT automatic** - you must request access
- **Approval process** can take 1-24 hours
- **Business justification** may be required
- **Some models require additional verification**

### Request Model Access via Console

1. **Navigate to Model Access**
   - In Amazon Bedrock console, click "Model access" in left navigation
   - Or go directly to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess

2. **Review Available Models**
   - Look for "Anthropic" section
   - Find "Claude 3 Sonnet" model
   - Model ID: `anthropic.claude-3-sonnet-20240229-v1:0`

3. **Request Access**
   - Click "Request model access" or "Manage model access"
   - Select "Claude 3 Sonnet" checkbox
   - Click "Next"

4. **Provide Use Case Information**
   - **Use case**: AI Recipe Generation Application
   - **Description**: 
     ```
     Developing an AI-powered recipe generator that creates personalized recipes 
     based on user-provided ingredients. The application will use Claude 3 Sonnet 
     to generate coherent, practical recipes with proper ingredient utilization 
     and step-by-step instructions. This is for a personal development project 
     within AWS free tier limits.
     ```
   - **Industry**: Food & Beverage / Technology
   - **Intended use**: Recipe content generation for web application

5. **Submit Request**
   - Review the information
   - Click "Submit"
   - You'll receive a confirmation email

### Request Status Tracking

Check request status:
1. Go to Bedrock → Model access
2. View the status column for Claude 3 Sonnet
3. Status options:
   - **Pending**: Request submitted, awaiting approval
   - **Granted**: Access approved, model available
   - **Denied**: Request denied (rare for legitimate use cases)

## Step 3: Verify Model Access

### Using AWS CLI
```bash
# List all available foundation models
aws bedrock list-foundation-models --region us-east-1 --profile ai-recipe-generator-dev

# Filter for Claude models specifically
aws bedrock list-foundation-models \
  --region us-east-1 \
  --profile ai-recipe-generator-dev \
  --query 'modelSummaries[?contains(modelId, `claude`)]'

# Check specifically for Claude 3 Sonnet
aws bedrock list-foundation-models \
  --region us-east-1 \
  --profile ai-recipe-generator-dev \
  --query 'modelSummaries[?modelId==`anthropic.claude-3-sonnet-20240229-v1:0`]'
```

Expected output for Claude 3 Sonnet:
```json
[
    {
        "modelArn": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
        "modelName": "Claude 3 Sonnet",
        "providerName": "Anthropic",
        "inputModalities": ["TEXT"],
        "outputModalities": ["TEXT"],
        "responseStreamingSupported": true,
        "customizationsSupported": [],
        "inferenceTypesSupported": ["ON_DEMAND"]
    }
]
```

### Using AWS Management Console
1. Go to Bedrock → Foundation models
2. Look for "Claude 3 Sonnet" in the list
3. Status should show "Available" or "Accessible"

## Step 4: Test Model Invocation

### Basic Test via CLI
```bash
# Create a test request
cat > test-request.json << 'EOF'
{
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 200,
    "messages": [
        {
            "role": "user",
            "content": "Generate a simple recipe using chicken and rice."
        }
    ]
}
EOF

# Invoke the model
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body file://test-request.json \
  --region us-east-1 \
  --profile ai-recipe-generator-dev \
  test-response.json

# View the response
cat test-response.json
```

### Test with PowerShell Script
```powershell
# Create test script
$testRequest = @{
    anthropic_version = "bedrock-2023-05-31"
    max_tokens = 200
    messages = @(
        @{
            role = "user"
            content = "Generate a simple recipe using chicken and rice."
        }
    )
} | ConvertTo-Json -Depth 3

$testRequest | Out-File -FilePath "test-request.json" -Encoding UTF8

# Invoke model
aws bedrock-runtime invoke-model `
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 `
  --body file://test-request.json `
  --region us-east-1 `
  --profile ai-recipe-generator-dev `
  test-response.json

# Display response
Get-Content test-response.json | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

## Step 5: Understanding Pricing and Usage

### Claude 3 Sonnet Pricing (as of 2024)
- **Input tokens**: ~$3.00 per 1M tokens
- **Output tokens**: ~$15.00 per 1M tokens
- **No free tier** - pay per use

### Token Estimation
- **Average recipe request**: ~200-500 input tokens
- **Average recipe response**: ~800-1500 output tokens
- **Cost per recipe**: ~$0.01-0.03

### Usage Monitoring Setup

#### CloudWatch Metrics
```bash
# Create CloudWatch alarm for Bedrock usage
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-Bedrock-Usage" \
  --alarm-description "Monitor Bedrock token usage" \
  --metric-name "InputTokenCount" \
  --namespace "AWS/Bedrock" \
  --statistic Sum \
  --period 3600 \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

#### Cost Tracking
- Monitor usage in AWS Cost Explorer
- Set up budget alerts (already configured in task 1.1.2)
- Track daily/weekly usage patterns

## Step 6: Integration Preparation

### Model Configuration for Recipe Generation
```json
{
    "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
    "region": "us-east-1",
    "maxTokens": 2000,
    "temperature": 0.7,
    "anthropicVersion": "bedrock-2023-05-31"
}
```

### Prompt Engineering Guidelines
- **Be specific** about recipe requirements
- **Request structured output** (JSON format)
- **Include ingredient constraints** (use 80% of provided ingredients)
- **Specify serving size** and dietary restrictions
- **Request nutritional information** when needed

### Error Handling Considerations
- **Rate limiting**: Bedrock has request rate limits
- **Token limits**: Maximum tokens per request
- **Model availability**: Handle temporary unavailability
- **Cost controls**: Implement usage limits

## Troubleshooting

### Common Issues

#### 1. "Access Denied" Error
```
An error occurred (AccessDeniedException) when calling the InvokeModel operation
```
**Solutions:**
- Verify model access has been granted in console
- Check IAM permissions for Bedrock
- Ensure using correct model ID

#### 2. "Model Not Found" Error
```
An error occurred (ResourceNotFoundException) when calling the InvokeModel operation
```
**Solutions:**
- Verify model ID spelling: `anthropic.claude-3-sonnet-20240229-v1:0`
- Check if model is available in your region
- Confirm model access request was approved

#### 3. "Throttling" Error
```
An error occurred (ThrottlingException) when calling the InvokeModel operation
```
**Solutions:**
- Implement exponential backoff
- Reduce request frequency
- Consider request batching

#### 4. Model Access Request Denied
**Possible reasons:**
- Insufficient business justification
- Account limitations
- Regional restrictions

**Solutions:**
- Resubmit with detailed use case
- Contact AWS support
- Try different model variants

### Support Resources
- **AWS Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/
- **Anthropic Claude Documentation**: https://docs.anthropic.com/
- **AWS Support**: Available through AWS Console

## Next Steps

After completing Bedrock setup:

1. ✅ **Verify model access granted**
2. ✅ **Test basic model invocation**
3. ⏭️ **Proceed to task 1.2.2**: Set up Amazon Cognito user pool
4. ⏭️ **Develop prompt engineering** for recipe generation
5. ⏭️ **Implement Lambda function** with Bedrock integration

## Security Best Practices

1. **API Key Management**
   - Use IAM roles instead of access keys in production
   - Rotate credentials regularly
   - Monitor API usage

2. **Cost Controls**
   - Set up billing alerts
   - Implement usage quotas
   - Monitor token consumption

3. **Content Filtering**
   - Validate input prompts
   - Filter inappropriate content
   - Implement rate limiting

---

**Important Reminders:**
- Model access approval can take up to 24 hours
- Bedrock has no free tier - monitor usage carefully
- Test thoroughly before production deployment
- Keep track of token usage for cost optimization