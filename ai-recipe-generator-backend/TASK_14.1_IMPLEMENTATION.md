# Task 14.1 Implementation: GET /profile Lambda Function

## Overview

This document describes the implementation of Task 14.1: Create GET /profile Lambda function for the AI Recipe Generator application.

## Requirements

**Task 14.1**: Create GET /profile Lambda function
- Validate JWT token from Authorization header
- Extract userId from token
- Query DynamoDB_Users_Table by userId
- Return user profile data
- Requirements: 10.1, 10.4, 10.7

## Implementation Details

### 1. Lambda Function Implementation

**File**: `src/handlers/profile-handler.ts`

The GET /profile Lambda function is implemented as `getProfileHandler` and exported as `getProfile` with authentication middleware:

```typescript
async function getProfileHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;

  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Profile not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to retrieve profile' }),
    };
  }
}

export const getProfile = withAuth(getProfileHandler);
```

### 2. Authentication Middleware

**File**: `src/middleware/auth-middleware.ts`

The `withAuth` middleware handles JWT token validation:
- Extracts JWT token from Authorization header
- Validates token against Cognito JWKS
- Verifies token signature, expiration, and issuer
- Extracts userId (sub) from token
- Adds authenticated user to event context

### 3. CloudFormation Infrastructure

**File**: `cloudformation/profile-api-stack.yaml`

The CloudFormation stack creates:

#### DynamoDB Users Table
- Table Name: `Users-{Environment}`
- Primary Key: `userId` (String)
- Billing Mode: PAY_PER_REQUEST
- Attributes stored:
  - userId (String)
  - displayName (String)
  - email (String)
  - dietPreference (String)
  - spiceLevel (String)
  - cookingGoal (String)
  - favoriteCuisines (String Array)
  - availableAppliances (String Array)
  - dietaryRestrictions (String Array)
  - usualCookingTime (String)
  - hasCompletedOnboarding (Boolean)
  - createdAt (Timestamp)
  - updatedAt (Timestamp)

#### Lambda Function
- Function Name: `ai-recipe-get-profile-{Environment}`
- Runtime: Node.js 18.x
- Handler: `handlers/profile-handler.getProfile`
- Environment Variables:
  - COGNITO_REGION
  - USER_POOL_ID
  - USER_POOL_CLIENT_ID
  - USERS_TABLE
  - ENVIRONMENT
- IAM Permissions:
  - DynamoDB GetItem on Users table
  - CloudWatch Logs write access

#### API Gateway
- REST API: `ai-recipe-profile-api-{Environment}`
- Endpoint: `GET /profile`
- Authorization: JWT token validation via Lambda middleware
- CORS enabled with OPTIONS method
- Integration: AWS_PROXY with Lambda function

### 4. Deployment Script

**File**: `deploy-profile-api.sh`

The deployment script:
1. Builds TypeScript code
2. Packages Lambda functions with dependencies
3. Deploys CloudFormation stack
4. Updates Lambda function code
5. Displays API Gateway URL and endpoints

### 5. Test Script

**File**: `test-profile-api.js`

The test script validates:
- GET /profile returns 200 with profile data (if exists)
- GET /profile returns 404 if profile not found
- GET /profile returns 401 if JWT token is invalid
- POST /profile/onboarding creates new profile
- PUT /profile updates existing profile

## API Specification

### GET /profile

**Request**:
```http
GET /profile HTTP/1.1
Host: {api-gateway-url}
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Response (200 OK)**:
```json
{
  "userId": "abc123-def456-ghi789",
  "displayName": "John Doe",
  "email": "john@example.com",
  "dietPreference": "Vegetarian",
  "spiceLevel": "Medium",
  "cookingGoal": "Balanced",
  "favoriteCuisines": ["Italian", "Indian", "Thai"],
  "availableAppliances": ["Stove", "Oven", "Microwave"],
  "dietaryRestrictions": ["Gluten-free"],
  "usualCookingTime": "30-60min",
  "hasCompletedOnboarding": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:45:00Z"
}
```

**Response (404 Not Found)**:
```json
{
  "error": "Profile not found"
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Missing Authorization header",
  "type": "AuthenticationError",
  "timestamp": "2024-01-20T14:45:00Z"
}
```

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to retrieve profile"
}
```

## Security Considerations

1. **JWT Token Validation**: All requests must include a valid JWT token from Cognito
2. **User Isolation**: Users can only access their own profile data (userId extracted from token)
3. **CORS**: Configured to allow cross-origin requests from frontend
4. **IAM Permissions**: Lambda function has minimal permissions (only GetItem on Users table)
5. **Logging**: All authentication failures are logged to CloudWatch

## Testing

### Manual Testing

1. Deploy the stack:
```bash
cd ai-recipe-generator-backend
./deploy-profile-api.sh
```

2. Get a valid JWT token (login via auth API)

3. Test the endpoint:
```bash
node test-profile-api.js https://{api-id}.execute-api.us-east-1.amazonaws.com/dev {jwt-token}
```

### Expected Results

- **New User**: GET /profile returns 404 (profile not found)
- **After Onboarding**: GET /profile returns 200 with profile data
- **Invalid Token**: GET /profile returns 401 (authentication failed)
- **Missing Token**: GET /profile returns 401 (missing authorization header)

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18.x installed
- TypeScript compiled (`npm run build`)

### Steps

1. Navigate to backend directory:
```bash
cd ai-recipe-generator-backend
```

2. Build TypeScript code:
```bash
npm run build
```

3. Deploy the stack:
```bash
./deploy-profile-api.sh
```

4. Note the API Gateway URL from the output

5. Update frontend environment variables with the new API URL

### Verification

1. Check CloudFormation stack status:
```bash
aws cloudformation describe-stacks --stack-name ai-recipe-profile-api-stack
```

2. Check DynamoDB table:
```bash
aws dynamodb describe-table --table-name Users-dev
```

3. Check Lambda function:
```bash
aws lambda get-function --function-name ai-recipe-get-profile-dev
```

4. Test the endpoint:
```bash
node test-profile-api.js {api-url} {jwt-token}
```

## Requirements Validation

### Requirement 10.1
✓ **Backend SHALL provide a Lambda function to retrieve user profile from DynamoDB_Users_Table**
- Lambda function `getProfile` implemented
- Queries DynamoDB Users table by userId

### Requirement 10.4
✓ **Lambda function SHALL validate the JWT token from Cognito**
- `withAuth` middleware validates JWT token
- Extracts userId from token
- Verifies token signature and expiration

### Requirement 10.7
✓ **Backend SHALL ensure users can only access their own profile data**
- userId extracted from JWT token (not from request body)
- DynamoDB query uses userId from authenticated token
- No way for users to access other users' profiles

## Files Created/Modified

### Created
- `cloudformation/profile-api-stack.yaml` - CloudFormation template for profile API
- `deploy-profile-api.sh` - Deployment script
- `test-profile-api.js` - Test script for profile endpoints
- `TASK_14.1_IMPLEMENTATION.md` - This documentation

### Modified
- None (profile-handler.ts already existed)

## Next Steps

1. Deploy the stack to AWS
2. Test the GET /profile endpoint with a valid JWT token
3. Integrate with frontend application
4. Implement PUT /profile (Task 14.2)
5. Implement POST /profile/onboarding (Task 14.3)

## Notes

- The Lambda function uses the existing `withAuth` middleware for JWT validation
- The DynamoDB table uses PAY_PER_REQUEST billing mode for cost optimization
- CORS is enabled for all endpoints to support frontend integration
- CloudWatch logging is enabled for debugging and monitoring
- The implementation follows the design document specifications exactly
