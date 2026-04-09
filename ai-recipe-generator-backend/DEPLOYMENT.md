# Deployment Guide: JWT Authentication Middleware

This guide explains how to deploy and use the JWT authentication middleware in AWS Lambda functions.

## Prerequisites

1. **AWS Account Setup**: Ensure you have AWS CLI configured
2. **Cognito Configuration**: User pool and client must be configured (already done)
3. **Node.js Environment**: Node.js 18.x or later

## Environment Variables

Set these environment variables in your Lambda function:

```bash
COGNITO_REGION=us-east-1
USER_POOL_ID=us-east-1_N0KMxM07E
USER_POOL_CLIENT_ID=1ia9lcg1nsld42j3giuvaeeo1b
```

## Deployment Steps

### 1. Build the Project

```bash
cd ai-recipe-generator-backend
npm install
npm run build
```

### 2. Package for Lambda

Create a deployment package:

```bash
# Create deployment directory
mkdir lambda-deployment
cp -r dist/* lambda-deployment/
cp -r node_modules lambda-deployment/
cd lambda-deployment
zip -r ../jwt-middleware-lambda.zip .
```

### 3. Create Lambda Function

Using AWS CLI:

```bash
aws lambda create-function \
  --function-name jwt-auth-middleware-example \
  --runtime nodejs18.x \
  --role arn:aws:iam::127393435518:role/lambda-execution-role \
  --handler handlers/example-protected-handler.handler \
  --zip-file fileb://jwt-middleware-lambda.zip \
  --environment Variables='{
    "COGNITO_REGION":"us-east-1",
    "USER_POOL_ID":"us-east-1_N0KMxM07E",
    "USER_POOL_CLIENT_ID":"1ia9lcg1nsld42j3giuvaeeo1b"
  }' \
  --timeout 30 \
  --memory-size 256
```

### 4. Update Function Code

To update an existing function:

```bash
aws lambda update-function-code \
  --function-name jwt-auth-middleware-example \
  --zip-file fileb://jwt-middleware-lambda.zip
```

## API Gateway Integration

### 1. Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
  --name ai-recipe-generator-api \
  --description "AI Recipe Generator API with JWT Authentication"

# Note the API ID from the response
export API_ID=your-api-id
```

### 2. Create Resources and Methods

```bash
# Get root resource ID
aws apigateway get-resources --rest-api-id $API_ID

# Create /protected resource
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part protected

# Create GET method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE
```

### 3. Configure Lambda Integration

```bash
# Set up Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:127393435518:function:jwt-auth-middleware-example/invocations
```

### 4. Deploy API

```bash
# Create deployment
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

## Usage Examples

### 1. Basic Protected Handler

```typescript
import { withAuth, AuthenticatedEvent } from './middleware/auth-middleware';
import { APIGatewayProxyResult, Context } from 'aws-lambda';

async function myProtectedHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const { user } = event;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: `Hello ${user.username}!`,
      userId: user.sub,
      email: user.email,
    }),
  };
}

export const handler = withAuth(myProtectedHandler);
```

### 2. Permission-Based Handler

```typescript
import { withAuth, withPermission, AuthenticatedEvent } from './middleware/auth-middleware';

async function adminHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Only users with 'admin:all' permission can access this
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Admin access granted' }),
  };
}

export const handler = withAuth(withPermission('admin:all')(adminHandler));
```

### 3. Recipe Generation Handler (Example)

```typescript
import { withAuth, AuthenticatedEvent } from './middleware/auth-middleware';
import { getUserId, createAuditLog } from './utils/auth-utils';

async function generateRecipeHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event.user);
    const requestBody = JSON.parse(event.body || '{}');
    
    // Validate request
    if (!requestBody.ingredients || !Array.isArray(requestBody.ingredients)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid ingredients provided' }),
      };
    }
    
    // Create audit log
    const auditLog = createAuditLog(
      event.user,
      'GENERATE_RECIPE',
      'recipe',
      { ingredients: requestBody.ingredients }
    );
    console.log('Recipe generation request:', auditLog);
    
    // TODO: Implement recipe generation logic with Bedrock
    const recipe = {
      id: `recipe-${Date.now()}`,
      title: 'Generated Recipe',
      ingredients: requestBody.ingredients,
      instructions: ['Step 1: Prepare ingredients', 'Step 2: Cook'],
      userId,
      createdAt: new Date().toISOString(),
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(recipe),
    };
  } catch (error) {
    console.error('Recipe generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = withAuth(generateRecipeHandler);
```

## Testing the Deployment

### 1. Get Authentication Token

Use the frontend authentication or test with Cognito directly:

```javascript
// From frontend (ai-recipe-generator-frontend/examples/auth-integration-example.js)
import AuthHelper from '../lib/auth-helper';

const result = await AuthHelper.signIn('test@example.com', 'TestPass123!');
const token = result.session.getAccessToken().getJwtToken();
console.log('Access Token:', token);
```

### 2. Test API Endpoint

```bash
# Test with curl
curl -X GET \
  https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. Expected Responses

**Success (200):**
```json
{
  "message": "Hello testuser!",
  "userId": "user-123",
  "email": "test@example.com"
}
```

**Missing Token (401):**
```json
{
  "error": "Missing Authorization header",
  "type": "AuthenticationError",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Invalid Token (401):**
```json
{
  "error": "Invalid token format",
  "type": "AuthenticationError",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Insufficient Permissions (403):**
```json
{
  "error": "Insufficient permissions",
  "type": "AuthenticationError",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Monitoring and Logging

### CloudWatch Logs

The middleware automatically logs:
- Successful authentications
- Authentication failures
- Permission denials
- Token expiration warnings

### Example Log Entries

```json
{
  "level": "info",
  "message": "Authentication successful",
  "userId": "user-123",
  "username": "testuser",
  "tokenUse": "access",
  "requestId": "abc-123-def"
}
```

```json
{
  "level": "error",
  "message": "Authentication failed",
  "error": "Token has expired",
  "requestId": "abc-123-def",
  "userAgent": "Mozilla/5.0...",
  "sourceIp": "192.168.1.1"
}
```

### CloudWatch Metrics

Set up custom metrics for:
- Authentication success rate
- Token expiration events
- Permission denial events
- API response times

## Security Best Practices

1. **Environment Variables**: Store sensitive configuration in Lambda environment variables
2. **IAM Roles**: Use least-privilege IAM roles for Lambda execution
3. **VPC Configuration**: Consider VPC deployment for additional security
4. **Logging**: Monitor authentication events and failures
5. **Token Validation**: Always validate tokens server-side
6. **CORS Configuration**: Configure CORS appropriately for your frontend domain

## Troubleshooting

### Common Issues

1. **"Unable to retrieve signing key"**
   - Check internet connectivity from Lambda
   - Verify Cognito user pool ID and region
   - Check IAM permissions for Lambda

2. **"Invalid token: Invalid audience"**
   - Verify USER_POOL_CLIENT_ID matches the token's audience
   - Check that the token was issued for the correct client

3. **"Token has expired"**
   - Implement token refresh logic in frontend
   - Check Cognito token validity settings

4. **Cold Start Performance**
   - Consider provisioned concurrency for high-traffic endpoints
   - Optimize dependencies and bundle size

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will provide more detailed error messages and stack traces.

## Cost Optimization

1. **Lambda Configuration**:
   - Memory: 256MB (sufficient for JWT validation)
   - Timeout: 30 seconds (JWT validation is fast)
   - Architecture: arm64 (cost-effective)

2. **API Gateway**:
   - Use caching for JWKS keys (already implemented)
   - Consider API Gateway caching for static responses

3. **Monitoring**:
   - Set up billing alerts
   - Monitor Lambda invocation counts
   - Track API Gateway request counts

## Next Steps

1. **Implement Recipe Generation**: Add Bedrock integration for AI recipe generation
2. **Database Integration**: Add DynamoDB for recipe storage
3. **Advanced Permissions**: Implement role-based access control with Cognito groups
4. **Rate Limiting**: Add API throttling and rate limiting
5. **Caching**: Implement response caching for better performance