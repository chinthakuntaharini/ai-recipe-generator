import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { 
  withAuth, 
  validateJwtToken, 
  AuthenticationError, 
  CognitoUser,
  AuthenticatedEvent,
  hasPermission,
  withPermission,
  healthCheck
} from '../auth-middleware';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('jwks-client');

const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  const validUser: CognitoUser = {
    sub: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    email_verified: true,
    aud: 'test-client-id',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_N0KMxM07E',
    token_use: 'access',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    auth_time: Math.floor(Date.now() / 1000),
  };

  const createMockEvent = (authHeader?: string): APIGatewayProxyEvent => ({
    body: null,
    headers: authHeader ? { Authorization: authHeader } : {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: {},
      httpMethod: 'GET',
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
      path: '/test',
      stage: 'test',
      requestId: 'test-request',
      requestTime: '01/Jan/2024:00:00:00 +0000',
      requestTimeEpoch: 1704067200,
      resourceId: 'test-resource',
      resourcePath: '/test',
      protocol: 'HTTP/1.1',
    },
    resource: '/test',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.COGNITO_REGION = 'us-east-1';
    process.env.USER_POOL_ID = 'us-east-1_N0KMxM07E';
    process.env.USER_POOL_CLIENT_ID = 'test-client-id';
  });

  describe('validateJwtToken', () => {
    it('should throw AuthenticationError for invalid token format', async () => {
      mockJwt.decode.mockReturnValue(null);

      await expect(validateJwtToken('invalid-token')).rejects.toThrow(
        new AuthenticationError('Invalid token format')
      );
    });
  });

  describe('withAuth middleware', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should return 401 for missing Authorization header', async () => {
      const event = createMockEvent();
      
      const authenticatedHandler = withAuth(mockHandler);
      const result = await authenticatedHandler(event, mockContext);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual(
        expect.objectContaining({
          error: 'Missing Authorization header',
          type: 'AuthenticationError',
        })
      );
    });

    it('should return 401 for invalid Authorization header format', async () => {
      const event = createMockEvent('InvalidFormat token');
      
      const authenticatedHandler = withAuth(mockHandler);
      const result = await authenticatedHandler(event, mockContext);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual(
        expect.objectContaining({
          error: 'Invalid Authorization header format. Expected: Bearer <token>',
          type: 'AuthenticationError',
        })
      );
    });

    it('should return 401 for invalid token', async () => {
      const event = createMockEvent('Bearer invalid-token');
      
      mockJwt.decode.mockReturnValue(null);

      const authenticatedHandler = withAuth(mockHandler);
      const result = await authenticatedHandler(event, mockContext);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual(
        expect.objectContaining({
          error: 'Invalid token format',
          type: 'AuthenticationError',
        })
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      const event = createMockEvent('Bearer valid-token');
      
      mockJwt.decode.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const authenticatedHandler = withAuth(mockHandler);
      const result = await authenticatedHandler(event, mockContext);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual(
        expect.objectContaining({
          error: 'Token validation failed',
          type: 'AuthenticationError',
        })
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true for basic permissions', () => {
      expect(hasPermission(validUser, 'read:recipes')).toBe(true);
      expect(hasPermission(validUser, 'write:recipes')).toBe(true);
      expect(hasPermission(validUser, 'delete:own_recipes')).toBe(true);
    });

    it('should return false for unknown permissions', () => {
      expect(hasPermission(validUser, 'admin:all')).toBe(false);
      expect(hasPermission(validUser, 'delete:all_recipes')).toBe(false);
    });
  });

  describe('withPermission middleware', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should allow access with valid permission', async () => {
      const event: AuthenticatedEvent = {
        ...createMockEvent(),
        user: validUser,
      };

      mockHandler.mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ message: 'Success' }),
      });

      const permissionHandler = withPermission('read:recipes')(mockHandler);
      const result = await permissionHandler(event, mockContext);

      expect(mockHandler).toHaveBeenCalledWith(event, mockContext);
      expect(result.statusCode).toBe(200);
    });

    it('should deny access without valid permission', async () => {
      const event: AuthenticatedEvent = {
        ...createMockEvent(),
        user: validUser,
      };

      const permissionHandler = withPermission('admin:all')(mockHandler);
      const result = await permissionHandler(event, mockContext);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body)).toEqual(
        expect.objectContaining({
          error: 'Insufficient permissions',
          type: 'AuthenticationError',
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await healthCheck();

      expect(result).toEqual({
        status: 'healthy',
        jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_N0KMxM07E/.well-known/jwks.json',
        timestamp: expect.any(String),
      });
    });
  });
});