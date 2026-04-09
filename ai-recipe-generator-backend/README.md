# AI Recipe Generator Backend

This directory contains the backend Lambda functions and middleware for the AI Recipe Generator application.

## JWT Token Validation Middleware

The JWT token validation middleware provides secure authentication for Lambda functions using Amazon Cognito JWT tokens.

### Features

- **JWT Token Validation**: Validates JWT tokens against Amazon Cognito user pools
- **Automatic Key Retrieval**: Fetches and caches public keys from Cognito JWKS endpoint
- **Token Expiration Handling**: Checks token expiration and rejects expired tokens
- **Error Handling**: Comprehensive error handling with meaningful error messages
- **Permission-Based Access Control**: Role-based access control for different endpoints
- **Logging and Monitoring**: Structured logging for authentication events
- **TypeScript Support**: Full TypeScript support with proper type definitions

### Quick Start

#### 1. Environment Variables

Set the following environment variables in your Lambda function:

```bash
COGNITO_REGION=us-east-1
USER_POOL_ID=us-east-1_N0KMxM07E
USER_POOL_CLIENT_ID=1ia9lcg1nsld42j3giuvaeeo1b
```

#### 2. Basic Usage

```typescript
import { withAuth, AuthenticatedEvent } from './middleware/auth-middleware';
import { APIGatewayProxyResult, Context } from 'aws-lambda';

async function myHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Access authenticated user via event.user
  const userId = event.user.sub;
  const username = event.user.username;
  const email = event.user.email;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello ${username}!`,
      userId,
      email,
    }),
  };
}

// Export handler with authentication middleware
export const handler = withAuth(myHandler);
```

#### 3. Permission-Based Access Control

```typescript
import { withAuth, withPermission, AuthenticatedEvent } from './middleware/auth-middleware';

async function adminHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  // This handler requires 'admin:all' permission
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Admin access granted' }),
  };
}

// Combine authentication and permission middleware
export const handler = withAuth(withPermission('admin:all')(adminHandler));
```

### API Reference

#### `withAuth(handler)`

Wraps a Lambda handler with JWT authentication middleware.

**Parameters:**
- `handler`: `AuthenticatedHandler` - The Lambda handler function to protect

**Returns:**
- `(event, context) => Promise<APIGatewayProxyResult>` - Protected Lambda handler

**Example:**
```typescript
export const handler = withAuth(async (event: AuthenticatedEvent, context: Context) => {
  // Your authenticated handler logic
});
```

#### `validateJwtToken(token)`

Validates a JWT token against the Cognito user pool.

**Parameters:**
- `token`: `string` - The JWT token to validate

**Returns:**
- `Promise<CognitoUser>` - The decoded and validated user information

**Throws:**
- `AuthenticationError` - If token is invalid, expired, or malformed

#### `withPermission(permission)`

Creates a permission-based access control middleware.

**Parameters:**
- `permission`: `string` - The required permission (e.g., 'read:recipes', 'write:recipes')

**Returns:**
- `(handler) => AuthenticatedHandler` - Middleware function

**Example:**
```typescript
const protectedHandler = withAuth(withPermission('read:recipes')(myHandler));
```

#### `hasPermission(user, permission)`

Checks if a user has a specific permission.

**Parameters:**
- `user`: `CognitoUser` - The authenticated user
- `permission`: `string` - The permission to check

**Returns:**
- `boolean` - True if user has the permission

### Types

#### `CognitoUser`

```typescript
interface CognitoUser {
  sub: string;                    // User ID
  username: string;               // Username
  email: string;                  // Email address
  email_verified: boolean;        // Email verification status
  aud: string;                    // Audience (client ID)
  iss: string;                    // Issuer (Cognito URL)
  token_use: 'access' | 'id';     // Token type
  exp: number;                    // Expiration timestamp
  iat: number;                    // Issued at timestamp
  auth_time: number;              // Authentication timestamp
}
```

#### `AuthenticatedEvent`

```typescript
interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: CognitoUser;              // Authenticated user information
}
```

#### `AuthenticationError`

```typescript
class AuthenticationError extends Error {
  statusCode: number;             // HTTP status code (401, 403, 500)
}
```

### Error Handling

The middleware handles various error scenarios:

#### Authentication Errors (401)
- Missing Authorization header
- Invalid Authorization header format
- Invalid JWT token
- Expired JWT token
- Token signature verification failure

#### Permission Errors (403)
- Insufficient permissions for the requested resource

#### Server Errors (500)
- JWKS key retrieval failure
- Unexpected validation errors

### Example Error Response

```json
{
  "error": "Token has expired",
  "type": "AuthenticationError",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Utility Functions

The `auth-utils.ts` file provides helpful utility functions:

```typescript
import { getUserId, getUserEmail, sanitizeUserForResponse } from './utils/auth-utils';

// Extract user information
const userId = getUserId(event.user);
const email = getUserEmail(event.user);

// Create safe user object for API responses
const safeUser = sanitizeUserForResponse(event.user);

// Check resource ownership
const isOwner = validateResourceOwnership(event.user, resourceUserId);

// Create audit log
const auditLog = createAuditLog(event.user, 'CREATE', 'recipe', { recipeId: 'recipe-123' });
```

### Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The test suite includes:
- JWT token validation tests
- Authentication middleware tests
- Permission-based access control tests
- Utility function tests
- Error handling tests

### Security Considerations

1. **Token Validation**: All tokens are validated against Cognito's public keys
2. **Key Caching**: JWKS keys are cached for performance but refreshed regularly
3. **Error Logging**: Authentication failures are logged for monitoring
4. **CORS Headers**: Proper CORS headers are included in error responses
5. **No Token Storage**: Tokens are not stored or logged for security

### Performance Optimization

1. **Key Caching**: JWKS keys are cached for 10 minutes to reduce API calls
2. **Efficient Validation**: JWT validation is optimized for Lambda cold starts
3. **Minimal Dependencies**: Uses lightweight JWT libraries
4. **Error Short-Circuiting**: Fast failure for invalid tokens

### Monitoring and Logging

The middleware provides structured logging for:
- Successful authentications
- Authentication failures
- Permission denials
- Token expiration warnings

Example log entry:
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

### Integration with API Gateway

The middleware is designed to work seamlessly with API Gateway:

1. **Authorization Header**: Expects `Authorization: Bearer <token>` header
2. **CORS Support**: Includes proper CORS headers in responses
3. **Error Responses**: Returns standard HTTP status codes
4. **Request Context**: Preserves API Gateway request context

### Deployment

1. **Build the TypeScript code**:
   ```bash
   npm run build
   ```

2. **Package for Lambda**:
   ```bash
   zip -r function.zip dist/ node_modules/
   ```

3. **Deploy to AWS Lambda**:
   ```bash
   aws lambda update-function-code --function-name my-function --zip-file fileb://function.zip
   ```

### Environment Configuration

For different environments, update the environment variables:

**Development:**
```bash
COGNITO_REGION=us-east-1
USER_POOL_ID=us-east-1_N0KMxM07E
USER_POOL_CLIENT_ID=1ia9lcg1nsld42j3giuvaeeo1b
```

**Production:**
```bash
COGNITO_REGION=us-east-1
USER_POOL_ID=us-east-1_PROD123
USER_POOL_CLIENT_ID=prod-client-id
```

### Troubleshooting

#### Common Issues

1. **"Missing Authorization header"**
   - Ensure the client sends `Authorization: Bearer <token>` header

2. **"Invalid token format"**
   - Check that the token is a valid JWT format
   - Verify the token is not corrupted during transmission

3. **"Token has expired"**
   - Implement token refresh logic in the client
   - Check Cognito token validity settings

4. **"Unable to retrieve signing key"**
   - Verify Cognito user pool ID and region
   - Check network connectivity to Cognito JWKS endpoint

5. **"Invalid token: Invalid signature"**
   - Ensure the token was issued by the correct Cognito user pool
   - Verify the client ID matches the token audience

### Contributing

1. Follow TypeScript best practices
2. Add tests for new functionality
3. Update documentation for API changes
4. Use structured logging for debugging
5. Handle errors gracefully with meaningful messages