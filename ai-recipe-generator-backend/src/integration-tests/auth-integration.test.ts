import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  registerHandler,
  loginHandler,
  confirmEmailHandler,
  resendConfirmationHandler,
  forgotPasswordHandler,
  confirmForgotPasswordHandler,
  refreshTokenHandler,
} from '../handlers/auth-handler';

// Mock environment variables for integration tests
process.env.COGNITO_REGION = 'us-east-1';
process.env.USER_POOL_ID = 'us-east-1_N0KMxM07E';
process.env.USER_POOL_CLIENT_ID = '1ia9lcg1nsld42j3giuvaeeo1b';

/**
 * Integration tests for authentication handlers
 * These tests use real AWS Cognito services
 * 
 * Note: These tests require valid AWS credentials and will make real API calls
 * Run with: npm run test:integration
 */
describe('Authentication Integration Tests', () => {
  let mockContext: Context;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  let confirmationCode: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(() => {
    // Mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:127393435518:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2023/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  /**
   * Helper function to create API Gateway event
   */
  function createEvent(body: any): APIGatewayProxyEvent {
    return {
      body: JSON.stringify(body),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/auth/test',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '127393435518',
        apiId: 'test-api',
        authorizer: {},
        httpMethod: 'POST',
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: '127.0.0.1',
          user: null,
          userAgent: 'test-agent',
          userArn: null,
        },
        path: '/auth/test',
        protocol: 'HTTP/1.1',
        requestId: 'test-request-id',
        requestTime: '09/Apr/2015:12:34:56 +0000',
        requestTimeEpoch: 1428582896000,
        resourceId: 'test-resource',
        resourcePath: '/auth/test',
        stage: 'test',
      },
      resource: '/auth/test',
    };
  }

  describe('User Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const event = createEvent({
        email: testEmail,
        password: testPassword,
      });

      const result = await registerHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(201);
      expect(response.message).toBe('User registered successfully');
      expect(response.email).toBe(testEmail);
      expect(response.confirmationRequired).toBe(true);
      expect(response.codeDeliveryDetails).toBeDefined();

      console.log('Registration successful:', response);
    }, 30000);

    it('should fail to register user with same email', async () => {
      const event = createEvent({
        email: testEmail,
        password: testPassword,
      });

      const result = await registerHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(409);
      expect(response.code).toBe('USER_EXISTS');
    }, 30000);

    it('should validate email format', async () => {
      const event = createEvent({
        email: 'invalid-email',
        password: testPassword,
      });

      const result = await registerHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('INVALID_EMAIL');
    });

    it('should validate password strength', async () => {
      const event = createEvent({
        email: 'test2@example.com',
        password: 'weak',
      });

      const result = await registerHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('INVALID_PASSWORD');
    });
  });

  describe('Email Confirmation Flow', () => {
    it('should resend confirmation code', async () => {
      const event = createEvent({
        email: testEmail,
      });

      const result = await resendConfirmationHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.message).toBe('Confirmation code sent successfully');
      expect(response.codeDeliveryDetails).toBeDefined();

      console.log('Confirmation code resent:', response);
    }, 30000);

    // Note: This test requires manual intervention to get the confirmation code
    // In a real scenario, you would need to check your email or use a test email service
    it.skip('should confirm email with valid code', async () => {
      // This test is skipped because it requires a real confirmation code
      // To run this test, replace 'REPLACE_WITH_ACTUAL_CODE' with the code from email
      confirmationCode = 'REPLACE_WITH_ACTUAL_CODE';

      const event = createEvent({
        email: testEmail,
        confirmationCode: confirmationCode,
      });

      const result = await confirmEmailHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.message).toBe('Email confirmed successfully');
    }, 30000);

    it('should fail with invalid confirmation code', async () => {
      const event = createEvent({
        email: testEmail,
        confirmationCode: 'invalid-code',
      });

      const result = await confirmEmailHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('INVALID_CODE');
    }, 30000);
  });

  describe('User Login Flow', () => {
    // Note: This test requires the user to be confirmed first
    it.skip('should login with valid credentials', async () => {
      const event = createEvent({
        email: testEmail,
        password: testPassword,
      });

      const result = await loginHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.message).toBe('Login successful');
      expect(response.tokens).toBeDefined();
      expect(response.tokens.accessToken).toBeDefined();
      expect(response.tokens.refreshToken).toBeDefined();

      // Store tokens for refresh test
      accessToken = response.tokens.accessToken;
      refreshToken = response.tokens.refreshToken;

      console.log('Login successful:', {
        tokenType: response.tokens.tokenType,
        expiresIn: response.tokens.expiresIn,
      });
    }, 30000);

    it('should fail login with unconfirmed user', async () => {
      const event = createEvent({
        email: testEmail,
        password: testPassword,
      });

      const result = await loginHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('EMAIL_NOT_CONFIRMED');
    }, 30000);

    it('should fail login with invalid credentials', async () => {
      const event = createEvent({
        email: testEmail,
        password: 'wrongpassword',
      });

      const result = await loginHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(401);
      expect(response.code).toBe('INVALID_CREDENTIALS');
    }, 30000);

    it('should fail login with non-existent user', async () => {
      const event = createEvent({
        email: 'nonexistent@example.com',
        password: testPassword,
      });

      const result = await loginHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(401);
      expect(response.code).toBe('INVALID_CREDENTIALS');
    }, 30000);
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset', async () => {
      const event = createEvent({
        email: testEmail,
      });

      const result = await forgotPasswordHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.message).toBe('Password reset code sent successfully');
      expect(response.codeDeliveryDetails).toBeDefined();

      console.log('Password reset initiated:', response);
    }, 30000);

    it('should handle password reset for non-existent user gracefully', async () => {
      const event = createEvent({
        email: 'nonexistent@example.com',
      });

      const result = await forgotPasswordHandler(event, mockContext);
      const response = JSON.parse(result.body);

      // For security, we don't reveal if user exists or not
      expect(result.statusCode).toBe(200);
      expect(response.message).toContain('If the email exists');
    }, 30000);

    // Note: This test requires manual intervention to get the reset code
    it.skip('should confirm password reset with valid code', async () => {
      // This test is skipped because it requires a real reset code
      const resetCode = 'REPLACE_WITH_ACTUAL_RESET_CODE';
      const newPassword = 'NewTestPass123!';

      const event = createEvent({
        email: testEmail,
        confirmationCode: resetCode,
        newPassword: newPassword,
      });

      const result = await confirmForgotPasswordHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.message).toBe('Password reset successfully');
    }, 30000);

    it('should fail password reset with invalid code', async () => {
      const event = createEvent({
        email: testEmail,
        confirmationCode: 'invalid-code',
        newPassword: 'NewTestPass123!',
      });

      const result = await confirmForgotPasswordHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('INVALID_CODE');
    }, 30000);
  });

  describe('Token Refresh Flow', () => {
    // Note: This test requires a valid refresh token from login
    it.skip('should refresh tokens with valid refresh token', async () => {
      const event = createEvent({
        refreshToken: refreshToken,
      });

      const result = await refreshTokenHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.message).toBe('Tokens refreshed successfully');
      expect(response.tokens).toBeDefined();
      expect(response.tokens.accessToken).toBeDefined();

      console.log('Token refresh successful:', {
        tokenType: response.tokens.tokenType,
        expiresIn: response.tokens.expiresIn,
      });
    }, 30000);

    it('should fail token refresh with invalid refresh token', async () => {
      const event = createEvent({
        refreshToken: 'invalid-refresh-token',
      });

      const result = await refreshTokenHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(401);
      expect(response.code).toBe('INVALID_REFRESH_TOKEN');
    }, 30000);
  });

  describe('Input Validation', () => {
    it('should handle missing request body', async () => {
      const event = createEvent(null);
      event.body = null;

      const result = await registerHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('MISSING_BODY');
    });

    it('should handle malformed JSON', async () => {
      const event = createEvent({});
      event.body = 'invalid-json{';

      try {
        await registerHandler(event, mockContext);
      } catch (error) {
        // Should handle JSON parsing errors gracefully
        expect(error).toBeDefined();
      }
    });

    it('should validate required fields', async () => {
      const event = createEvent({
        email: testEmail,
        // missing password
      });

      const result = await registerHandler(event, mockContext);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(response.code).toBe('MISSING_FIELDS');
    });
  });
});

/**
 * Manual test helper
 * Use this to test with actual confirmation codes from email
 */
export async function manualTestWithConfirmationCode(
  email: string,
  confirmationCode: string
): Promise<void> {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:127393435518:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  const event: APIGatewayProxyEvent = {
    body: JSON.stringify({ email, confirmationCode }),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/auth/confirm-email',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '127393435518',
      apiId: 'test-api',
      authorizer: {},
      httpMethod: 'POST',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
      },
      path: '/auth/confirm-email',
      protocol: 'HTTP/1.1',
      requestId: 'test-request-id',
      requestTime: '09/Apr/2015:12:34:56 +0000',
      requestTimeEpoch: 1428582896000,
      resourceId: 'test-resource',
      resourcePath: '/auth/confirm-email',
      stage: 'test',
    },
    resource: '/auth/confirm-email',
  };

  const result = await confirmEmailHandler(event, mockContext);
  console.log('Manual confirmation test result:', JSON.parse(result.body));
}