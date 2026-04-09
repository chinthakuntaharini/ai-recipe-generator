import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { AuthenticatedEvent } from '../../middleware/auth-middleware';

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockGet = jest.fn();
  const mockPut = jest.fn();
  const mockUpdate = jest.fn();
  
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        get: mockGet,
        put: mockPut,
        update: mockUpdate,
      })),
    },
  };
});

// Mock auth middleware to bypass authentication
jest.mock('../../middleware/auth-middleware', () => ({
  withAuth: (handler: any) => handler,
  AuthenticatedEvent: {} as any,
}));

// Import handlers after mocking
import { getProfile, updateProfile, createProfileFromOnboarding } from '../profile-handler';

describe('Profile Handler Tests', () => {
  let mockContext: Context;
  let mockDynamoDB: jest.Mocked<DynamoDB.DocumentClient>;

  // Helper function to create mock authenticated event
  const createMockEvent = (userId: string, email: string, body?: string): AuthenticatedEvent => {
    return {
      user: {
        sub: userId,
        username: 'testuser',
        email: email,
        aud: 'test-client-id',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
        token_use: 'id',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        auth_time: Math.floor(Date.now() / 1000),
      },
      headers: {},
      requestContext: {
        identity: {
          sourceIp: '127.0.0.1',
        },
      } as any,
      body,
    } as AuthenticatedEvent;
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '256',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2024/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };

    // Get mocked DynamoDB instance
    mockDynamoDB = new DynamoDB.DocumentClient() as jest.Mocked<DynamoDB.DocumentClient>;
  });

  describe('GET /profile', () => {
    it('should return 200 with profile data when profile exists', async () => {
      // Arrange
      const mockProfile = {
        userId: 'test-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        dietPreference: 'Vegetarian',
        spiceLevel: 'Medium',
        cookingGoal: 'Balanced',
        favoriteCuisines: ['Italian', 'Indian'],
        availableAppliances: ['Stove', 'Oven'],
        dietaryRestrictions: [],
        usualCookingTime: '30-60min',
        hasCompletedOnboarding: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockProfile }),
      });

      const event = createMockEvent('test-user-123', 'test@example.com');

      // Act
      const result = await getProfile(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockProfile);
      expect(mockDynamoDB.get).toHaveBeenCalledWith({
        TableName: 'Users',
        Key: { userId: 'test-user-123' },
      });
    });

    it('should return 404 when profile does not exist', async () => {
      // Arrange
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const event = createMockEvent('test-user-123', 'test@example.com');

      // Act
      const result = await getProfile(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({ error: 'Profile not found' });
    });

    it('should return 500 when DynamoDB query fails', async () => {
      // Arrange
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

      const event = createMockEvent('test-user-123', 'test@example.com');

      // Act
      const result = await getProfile(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Failed to retrieve profile' });
    });

    it('should extract userId from JWT token sub claim', async () => {
      // Arrange
      const userId = 'user-from-token-456';
      
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: { userId } }),
      });

      const event = createMockEvent(userId, 'test@example.com');

      // Act
      await getProfile(event, mockContext);

      // Assert
      expect(mockDynamoDB.get).toHaveBeenCalledWith({
        TableName: 'Users',
        Key: { userId },
      });
    });

    it('should include CORS headers in response', async () => {
      // Arrange
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: { userId: 'test-user' } }),
      });

      const event = createMockEvent('test-user-123', 'test@example.com');

      // Act
      const result = await getProfile(event, mockContext);

      // Assert
      expect(result.headers).toMatchObject({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
    });
  });

  describe('PUT /profile', () => {
    it('should return 200 with updated profile data', async () => {
      // Arrange
      const updatedProfile = {
        userId: 'test-user-123',
        displayName: 'Updated User',
        dietPreference: 'Vegan',
        spiceLevel: 'Spicy',
        cookingGoal: 'Fitness',
        favoriteCuisines: ['Mexican'],
        availableAppliances: ['Air Fryer'],
        dietaryRestrictions: ['Nut-free'],
        usualCookingTime: '15-30min',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      (mockDynamoDB.update as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Attributes: updatedProfile }),
      });

      const event = createMockEvent(
        'test-user-123',
        'test@example.com',
        JSON.stringify({
          displayName: 'Updated User',
          dietPreference: 'Vegan',
          spiceLevel: 'Spicy',
          cookingGoal: 'Fitness',
          favoriteCuisines: ['Mexican'],
          availableAppliances: ['Air Fryer'],
          dietaryRestrictions: ['Nut-free'],
          usualCookingTime: '15-30min',
        })
      );

      // Act
      const result = await updateProfile(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updatedProfile);
    });

    it('should return 400 when displayName is missing', async () => {
      // Arrange
      const event = createMockEvent(
        'test-user-123',
        'test@example.com',
        JSON.stringify({
          dietPreference: 'Vegan',
        })
      );

      // Act
      const result = await updateProfile(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'Display name is required' });
    });
  });

  describe('POST /profile/onboarding', () => {
    it('should return 201 with created profile', async () => {
      // Arrange
      (mockDynamoDB.put as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const event = createMockEvent(
        'test-user-123',
        'test@example.com',
        JSON.stringify({
          dietPreference: 'Vegetarian',
          spiceLevel: 'Medium',
          cookingGoal: 'Balanced',
          favoriteCuisines: ['Italian'],
          availableAppliances: ['Stove'],
          dietaryRestrictions: [],
          usualCookingTime: '30-60min',
        })
      );

      // Act
      const result = await createProfileFromOnboarding(event, mockContext);

      // Assert
      expect(result.statusCode).toBe(201);
      const profile = JSON.parse(result.body);
      expect(profile.userId).toBe('test-user-123');
      expect(profile.email).toBe('test@example.com');
      expect(profile.hasCompletedOnboarding).toBe(true);
      expect(profile.dietPreference).toBe('Vegetarian');
    });

    it('should set default displayName from email', async () => {
      // Arrange
      (mockDynamoDB.put as jest.Mock).mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const event = createMockEvent(
        'test-user-123',
        'john.doe@example.com',
        JSON.stringify({
          dietPreference: 'Vegetarian',
          spiceLevel: 'Medium',
          cookingGoal: 'Balanced',
          favoriteCuisines: [],
          availableAppliances: [],
          dietaryRestrictions: [],
          usualCookingTime: '30-60min',
        })
      );

      // Act
      const result = await createProfileFromOnboarding(event, mockContext);

      // Assert
      const profile = JSON.parse(result.body);
      expect(profile.displayName).toBe('john.doe');
    });
  });
});
