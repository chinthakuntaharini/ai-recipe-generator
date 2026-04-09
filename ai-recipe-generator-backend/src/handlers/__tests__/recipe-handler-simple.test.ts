import { APIGatewayProxyEvent } from 'aws-lambda';
import { generateRecipe, handleCors } from '../recipe-handler';

// Helper function to create mock events
function createMockEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/generate-recipe',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      requestId: 'test-request-id',
      stage: 'dev',
      resourceId: 'resource-id',
      resourcePath: '/generate-recipe',
      httpMethod: 'POST',
      requestTimeEpoch: Date.now(),
      protocol: 'HTTP/1.1',
      accountId: '123456789012',
      apiId: 'api-id',
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
        clientCert: null
      },
      path: '/dev/generate-recipe',
      requestTime: new Date().toISOString(),
      authorizer: {}
    },
    resource: '/generate-recipe',
    ...overrides
  };
}

describe('Recipe Handler - Simple Tests', () => {
  describe('Input Validation', () => {
    it('should return 401 when authorization header is missing', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({ ingredients: ['chicken'] })
      });

      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(401);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Missing authorization header');
    });

    it('should return 400 when request body is missing', async () => {
      const mockEvent = createMockEvent({
        headers: { Authorization: 'Bearer test-token' },
        body: null
      });

      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Request body is required');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      const mockEvent = createMockEvent({
        headers: { Authorization: 'Bearer test-token' },
        body: 'invalid json'
      });

      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 when ingredients array is empty', async () => {
      const mockEvent = createMockEvent({
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ ingredients: [] })
      });

      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('At least one ingredient must be provided');
    });

    it('should return 400 when ingredients is not an array', async () => {
      const mockEvent = createMockEvent({
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify({ ingredients: 'not an array' })
      });

      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Ingredients must be provided as an array');
    });
  });

  describe('CORS Handler', () => {
    it('should return proper CORS headers', async () => {
      const mockEvent = createMockEvent();
      
      const result = await handleCors(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers!['Access-Control-Allow-Headers']).toBe('Content-Type,Authorization');
      expect(result.headers!['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
      expect(result.body).toBe('');
    });
  });
});