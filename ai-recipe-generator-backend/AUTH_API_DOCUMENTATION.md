# Authentication API Documentation

## Overview

The Authentication API provides secure user registration, login, and password management functionality for the AI Recipe Generator application. It integrates with AWS Cognito for user management and JWT token-based authentication.

## Base Configuration

- **Region**: us-east-1
- **User Pool ID**: us-east-1_N0KMxM07E
- **Client ID**: 1ia9lcg1nsld42j3giuvaeeo1b
- **Authentication Flow**: USER_PASSWORD_AUTH, USER_SRP_AUTH, REFRESH_TOKEN_AUTH

## API Endpoints

### 1. User Registration

**Endpoint**: `POST /auth/register`

**Description**: Register a new user account with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "optional-username"
}
```

**Success Response** (201):
```json
{
  "message": "User registered successfully",
  "userId": "uuid-string",
  "username": "user@example.com",
  "email": "user@example.com",
  "confirmationRequired": true,
  "codeDeliveryDetails": {
    "Destination": "u***@example.com",
    "DeliveryMedium": "EMAIL",
    "AttributeName": "email"
  }
}
```

**Error Responses**:
- `400 MISSING_FIELDS`: Email and password are required
- `400 INVALID_EMAIL`: Invalid email format
- `400 INVALID_PASSWORD`: Password doesn't meet requirements
- `409 USER_EXISTS`: User already exists
- `500 REGISTRATION_ERROR`: Internal server error

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### 2. User Login

**Endpoint**: `POST /auth/login`

**Description**: Authenticate user and receive JWT tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200):
```json
{
  "message": "Login successful",
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  },
  "user": {
    "username": "user@example.com"
  }
}
```

**Error Responses**:
- `400 MISSING_FIELDS`: Email and password are required
- `400 INVALID_EMAIL`: Invalid email format
- `400 EMAIL_NOT_CONFIRMED`: User email not confirmed
- `400 PASSWORD_RESET_REQUIRED`: Password reset required
- `401 INVALID_CREDENTIALS`: Invalid email or password
- `429 TOO_MANY_REQUESTS`: Too many login attempts
- `500 LOGIN_ERROR`: Internal server error

### 3. Email Confirmation

**Endpoint**: `POST /auth/confirm-email`

**Description**: Confirm user email with verification code.

**Request Body**:
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456"
}
```

**Success Response** (200):
```json
{
  "message": "Email confirmed successfully",
  "username": "user@example.com"
}
```

**Error Responses**:
- `400 MISSING_FIELDS`: Email and confirmation code are required
- `400 INVALID_EMAIL`: Invalid email format
- `400 INVALID_CODE`: Invalid confirmation code
- `400 EXPIRED_CODE`: Confirmation code has expired
- `400 ALREADY_CONFIRMED`: User is already confirmed
- `404 USER_NOT_FOUND`: User not found
- `500 CONFIRMATION_ERROR`: Internal server error

### 4. Resend Confirmation Code

**Endpoint**: `POST /auth/resend-confirmation`

**Description**: Resend email confirmation code.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "Confirmation code sent successfully",
  "codeDeliveryDetails": {
    "Destination": "u***@example.com",
    "DeliveryMedium": "EMAIL",
    "AttributeName": "email"
  }
}
```

**Error Responses**:
- `400 MISSING_EMAIL`: Email is required
- `400 INVALID_EMAIL`: Invalid email format
- `400 ALREADY_CONFIRMED`: User is already confirmed
- `404 USER_NOT_FOUND`: User not found
- `429 TOO_MANY_REQUESTS`: Too many requests
- `500 RESEND_ERROR`: Internal server error

### 5. Forgot Password

**Endpoint**: `POST /auth/forgot-password`

**Description**: Initiate password reset process.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset code sent successfully",
  "codeDeliveryDetails": {
    "Destination": "u***@example.com",
    "DeliveryMedium": "EMAIL",
    "AttributeName": "email"
  }
}
```

**Error Responses**:
- `400 MISSING_EMAIL`: Email is required
- `400 INVALID_EMAIL`: Invalid email format
- `400 INVALID_PARAMETER`: Invalid email parameter
- `400 RESET_NOT_ALLOWED`: Password reset not allowed for this user
- `429 TOO_MANY_REQUESTS`: Too many requests
- `500 RESET_ERROR`: Internal server error

**Note**: For security, the API returns success even if the user doesn't exist.

### 6. Confirm Password Reset

**Endpoint**: `POST /auth/confirm-forgot-password`

**Description**: Confirm password reset with verification code and new password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response** (200):
```json
{
  "message": "Password reset successfully",
  "username": "user@example.com"
}
```

**Error Responses**:
- `400 MISSING_FIELDS`: Email, confirmation code, and new password are required
- `400 INVALID_EMAIL`: Invalid email format
- `400 INVALID_PASSWORD`: New password doesn't meet requirements
- `400 INVALID_CODE`: Invalid confirmation code
- `400 EXPIRED_CODE`: Confirmation code has expired
- `404 USER_NOT_FOUND`: User not found
- `429 TOO_MANY_ATTEMPTS`: Too many attempts
- `500 CONFIRM_RESET_ERROR`: Internal server error

### 7. Refresh Token

**Endpoint**: `POST /auth/refresh-token`

**Description**: Refresh access and ID tokens using refresh token.

**Request Body**:
```json
{
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

**Success Response** (200):
```json
{
  "message": "Tokens refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Error Responses**:
- `400 MISSING_REFRESH_TOKEN`: Refresh token is required
- `401 INVALID_REFRESH_TOKEN`: Invalid or expired refresh token
- `404 USER_NOT_FOUND`: User not found
- `500 REFRESH_ERROR`: Internal server error

## CORS Configuration

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`

## Authentication Flow

### Registration Flow
1. User submits registration form
2. API validates input and creates user in Cognito
3. Cognito sends confirmation email
4. User clicks confirmation link or enters code
5. User account is activated

### Login Flow
1. User submits login credentials
2. API authenticates with Cognito
3. Cognito returns JWT tokens
4. Frontend stores tokens for API calls
5. Access token used for protected endpoints

### Token Management
- **Access Token**: Valid for 60 minutes, used for API authentication
- **ID Token**: Valid for 60 minutes, contains user information
- **Refresh Token**: Valid for 30 days, used to refresh access/ID tokens

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2023-01-01T12:00:00.000Z"
}
```

Common error codes:
- `MISSING_BODY`: Request body is required
- `MISSING_FIELDS`: Required fields are missing
- `INVALID_EMAIL`: Email format is invalid
- `INVALID_PASSWORD`: Password doesn't meet requirements
- `USER_EXISTS`: User already exists
- `USER_NOT_FOUND`: User not found
- `INVALID_CREDENTIALS`: Invalid login credentials
- `EMAIL_NOT_CONFIRMED`: User email not confirmed
- `INVALID_CODE`: Invalid verification code
- `EXPIRED_CODE`: Verification code expired
- `TOO_MANY_REQUESTS`: Rate limit exceeded

## Security Features

### Input Validation
- Email format validation
- Password strength requirements
- Request body sanitization
- Parameter type checking

### Rate Limiting
- Login attempt throttling
- Confirmation code request limits
- Password reset request limits

### Security Headers
- CORS configuration
- Content-Type validation
- Request size limits

### AWS Cognito Security
- Secure password hashing
- JWT token signing
- Account lockout policies
- Email verification

## Testing

### Unit Tests
Run unit tests with mocked AWS services:
```bash
npm test
```

### Integration Tests
Test with real AWS Cognito (requires AWS credentials):
```bash
node test-auth-endpoints.js
```

### Manual Testing
Use curl or Postman to test endpoints:

```bash
# Register user
curl -X POST https://api.example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Login user
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

## Deployment

### Prerequisites
- AWS CLI configured
- Node.js 18.x
- TypeScript compiler
- Valid AWS credentials

### Build and Deploy
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy CloudFormation stack and Lambda functions
./deploy-auth-api.sh
```

### Environment Variables
Set the following environment variables in Lambda functions:
- `COGNITO_REGION`: AWS region (us-east-1)
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `ENVIRONMENT`: Environment name (dev/staging/prod)

## Monitoring and Logging

### CloudWatch Logs
All Lambda functions log to CloudWatch with structured logging:
- Request/response details
- Error information
- Performance metrics
- Security events

### Metrics
Monitor the following metrics:
- Request count per endpoint
- Error rates by error type
- Response times
- Authentication success/failure rates

### Alerts
Set up CloudWatch alarms for:
- High error rates (>5%)
- Slow response times (>5 seconds)
- Failed authentication attempts
- Rate limit violations

## Troubleshooting

### Common Issues

**User Registration Fails**
- Check email format validation
- Verify password meets requirements
- Ensure Cognito user pool is configured
- Check IAM permissions for Lambda

**Login Returns 400 EMAIL_NOT_CONFIRMED**
- User must confirm email first
- Check confirmation code delivery
- Verify email settings in Cognito

**Token Refresh Fails**
- Check refresh token validity (30 days)
- Verify token hasn't been revoked
- Ensure user account is still active

**CORS Errors**
- Verify API Gateway CORS configuration
- Check frontend origin settings
- Ensure preflight OPTIONS requests work

### Debug Steps
1. Check CloudWatch logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with known good credentials
4. Check AWS service status
5. Validate request format and headers

## API Client Examples

### JavaScript/TypeScript
```typescript
class AuthClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async register(email: string, password: string, username?: string) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    return response.json();
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async confirmEmail(email: string, confirmationCode: string) {
    const response = await fetch(`${this.baseUrl}/auth/confirm-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmationCode }),
    });
    return response.json();
  }
}
```

### Python
```python
import requests
import json

class AuthClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def register(self, email, password, username=None):
        data = {"email": email, "password": password}
        if username:
            data["username"] = username
        
        response = requests.post(
            f"{self.base_url}/auth/register",
            headers={"Content-Type": "application/json"},
            data=json.dumps(data)
        )
        return response.json()

    def login(self, email, password):
        response = requests.post(
            f"{self.base_url}/auth/login",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"email": email, "password": password})
        )
        return response.json()
```

## Support

For issues or questions:
1. Check CloudWatch logs for error details
2. Review this documentation
3. Test with the provided test scripts
4. Verify AWS service configuration
5. Check IAM permissions and policies