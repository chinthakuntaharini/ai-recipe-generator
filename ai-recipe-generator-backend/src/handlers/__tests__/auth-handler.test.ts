// Mock environment variables BEFORE importing handlers
process.env.COGNITO_REGION = 'us-east-1';
process.env.USER_POOL_ID = 'us-east-1_N0KMxM07E';
process.env.USER_POOL_CLIENT_ID = '1ia9lcg1nsld42j3giuvaeeo1b';

import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS SDK before importing handlers
const mockSignUp = jest.fn();
const mockInitiateAuth = jest.fn();
const mockConfirmSignUp = jest.fn();
const mockResendConfirmationCode = jest.fn();
const mockForgotPassword = jest.fn();
const mockConfirmForgotPassword = jest.fn();

jest.mock('aws-sdk', () => ({
  CognitoIdentityServiceProvider: jest.fn(() => ({
    signUp: mockSignUp,
    initiateAuth: mockInitiateAuth,
    confirmSignUp: mockConfirmSignUp,
    resendConfirmationCode: mockResendConfirmationCode,
    forgotPassword: mockForgotPassword,
    confirmForgotPassword: mockConfirmForgotPassword,
  })),
}));

import {
  registerHandler,
  loginHandler,
  confirmEmailHandler,
  resendConfirmationHandler,
  forgotPasswordHandler,
  confirmForgotPasswordHandler,
  refreshTokenHandler,
  optionsHandler,
} from '../auth-handler';

// Mock environment variables for integration tests

describe('Auth Handler Tests', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock event
    mockEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/auth/register',
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
          clientCert: null,
        },
        path: '/auth/register',
        protocol: 'HTTP/1.1',
        requestId: 'test-request-id',
        requestTime: '09/Apr/2015:12:34:56 +0000',
        requestTimeEpoch: 1428582896000,
        resourceId: 'test-resource',
        resourcePath: '/auth/register',
        stage: 'test',
      },
      resource: '/auth/register',
    };

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

    // Setup default mock responses
    mockSignUp.mockReturnValue({
      promise: () => Promise.resolve({
        UserSub: 'test-user-id',
        UserConfirmed: false,
        CodeDeliveryDetails: {
          Destination: 'test@example.com',
          DeliveryMedium: 'EMAIL',
          AttributeName: 'email',
        },
      }),
    });

    mockInitiateAuth.mockReturnValue({
      promise: () => Promise.resolve({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      }),
    });

    mockConfirmSignUp.mockReturnValue({
      promise: () => Promise.resolve({}),
    });

    mockResendConfirmationCode.mockReturnValue({
      promise: () => Promise.resolve({
        CodeDeliveryDetails: {
          Destination: 'test@example.com',
          DeliveryMedium: 'EMAIL',
          AttributeName: 'email',
        },
      }),
    });

    mockForgotPassword.mockReturnValue({
      promise: () => Promise.resolve({
        CodeDeliveryDetails: {
          Destination: 'test@example.com',
          DeliveryMedium: 'EMAIL',
          AttributeName: 'email',
        },
      }),
    });

    mockConfirmForgotPassword.mockReturnValue({
      promise: () => Promise.resolve({}),
    });
  });

  describe('registerHandler', () => {
    it('should successfully register a new user', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
        username: 'testuser',
      });

      const result = await registerHandler(mockEvent, mockContext);
      
      // Debug: Log the actual result if it's not what we expect
      if (result.statusCode !== 201) {
        console.log('Unexpected result:', result);
        console.log('Response body:', result.body);
      }

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toMatchObject({
        message: 'User registered successfully',
        userId: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        confirmationRequired: true,
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        ClientId: '1ia9lcg1nsld42j3giuvaeeo1b',
        Username: 'testuser',
        Password: 'TestPass123!',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
        ],
      });
    });

    it('should use email as username if username not provided', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const result = await registerHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(201);
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          Username: 'test@example.com',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
      });

      const result = await registerHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockEvent.body = JSON.stringify({
        email: 'invalid-email',
        password: 'TestPass123!',
      });

      const result = await registerHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    });

    it('should return 400 for weak password', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
      });

      const result = await registerHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Password must be at least 8 characters long',
        code: 'INVALID_PASSWORD',
      });
    });

    it('should handle user already exists error', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const error = new Error('User already exists');
      (error as any).code = 'UsernameExistsException';
      mockSignUp.mockReturnValue({
        promise: () => Promise.reject(error),
      });

      const result = await registerHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(409);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'User already exists',
        code: 'USER_EXISTS',
      });
    });
  });

  describe('loginHandler', () => {
    it('should successfully login a user', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const result = await loginHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toMatchObject({
        message: 'Login successful',
        tokens: {
          accessToken: 'mock-access-token',
          idToken: 'mock-id-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
        user: {
          username: 'test@example.com',
        },
      });

      expect(mockInitiateAuth).toHaveBeenCalledWith({
        ClientId: '1ia9lcg1nsld42j3giuvaeeo1b',
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: 'test@example.com',
          PASSWORD: 'TestPass123!',
        },
      });
    });

    it('should return 400 for missing credentials', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
      });

      const result = await loginHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
    });

    it('should handle invalid credentials error', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const error = new Error('Incorrect username or password');
      (error as any).code = 'NotAuthorizedException';
      mockInitiateAuth.mockReturnValue({
        promise: () => Promise.reject(error),
      });

      const result = await loginHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should handle user not confirmed error', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const error = new Error('User is not confirmed');
      (error as any).code = 'UserNotConfirmedException';
      mockInitiateAuth.mockReturnValue({
        promise: () => Promise.reject(error),
      });

      const result = await loginHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'User email not confirmed',
        code: 'EMAIL_NOT_CONFIRMED',
      });
    });
  });

  describe('confirmEmailHandler', () => {
    it('should successfully confirm email', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        confirmationCode: '123456',
      });

      const result = await confirmEmailHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toMatchObject({
        message: 'Email confirmed successfully',
        username: 'test@example.com',
      });

      expect(mockConfirmSignUp).toHaveBeenCalledWith({
        ClientId: '1ia9lcg1nsld42j3giuvaeeo1b',
        Username: 'test@example.com',
        ConfirmationCode: '123456',
      });
    });

    it('should return 400 for missing fields', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
      });

      const result = await confirmEmailHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Email and confirmation code are required',
        code: 'MISSING_FIELDS',
      });
    });

    it('should handle invalid confirmation code', async () => {
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        confirmationCode: 'invalid',
      });

      const error = new Error('Invalid verification code provided');
      (error as any).code = 'CodeMismatchException';
      mockConfirmSignUp.mockReturnValue({
        promise: () => Promise.reject(error),
      });

      const result = await confirmEmailHandler(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Invalid confirmation code',
        code: 'INVALID_CODE',
      });
    });
  });

  describe('optionsHandler', () => {
    it('should return CORS headers', async () => {
      const result = await optionsHandler();

      expect(result.statusCode).toBe(200);
      expect(result.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Max-Age': '86400',
      });
    });
  });
});