import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { getRecipes, getRecipe, toggleFavorite, deleteRecipe } from '../recipe-history-handler';
import { AuthenticatedEvent } from '../../middleware/auth-middleware';

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockQuery = jest.fn();
  const mockGet = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        query: mockQuery,
        get: mockGet,
        update: mockUpdate,
        delete: mockDelete,
      })),
    },
  };
});

// Mock auth middleware
jest.mock('../../middleware/auth-middleware', () => ({
  withAuth: (handler: any) => handler,
  AuthenticatedEvent: {} as any,
}));

describe('Recipe History Handler', () => {
  let mockQuery: jest.Mock;
  let mockGet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockContext: Context;

  beforeEach(() => {
    // Get mock functions
    const dynamodb = new DynamoDB.DocumentClient();
    mockQuery = (dynamodb.query as jest.Mock);
    mockGet = (dynamodb.get as jest.Mock);
    mockUpdate = (dynamodb.update as jest.Mock);
    mockDelete = (dynamodb.delete as jest.Mock);

    // Reset mocks
    mockQuery.mockReset();
    mockGet.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();

    // Mock context
    mockContext = {
      awsRequestId: 'test-request-id',
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: '256',
      logGroupName: '/aws/lambda/test',
      logStreamName: 'test-stream',
      callbackWaitsForEmptyEventLoop: true,
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  describe('getRecipes', () => {
    it('should retrieve all recipes for a user', async () => {
      const mockRecipes = [
        {
          userId: 'user123',
          recipeId: 'recipe1',
          recipeName: 'Pasta Carbonara',
          cuisine: 'Italian',
          mealType: 'Dinner',
          isFavorite: false,
          createdAt: '2024-01-20T10:00:00Z',
        },
        {
          userId: 'user123',
          recipeId: 'recipe2',
          recipeName: 'Chicken Curry',
          cuisine: 'Indian',
          mealType: 'Dinner',
          isFavorite: true,
          createdAt: '2024-01-19T10:00:00Z',
        },
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockRecipes }),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        queryStringParameters: null,
      } as any;

      const result = await getRecipes(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockRecipes);
      expect(mockQuery).toHaveBeenCalledWith({
        TableName: 'RecipeHistory',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'user123',
        },
        ScanIndexForward: false,
      });
    });

    it('should filter recipes by cuisine', async () => {
      const mockRecipes = [
        {
          userId: 'user123',
          recipeId: 'recipe1',
          recipeName: 'Pasta Carbonara',
          cuisine: 'Italian',
          mealType: 'Dinner',
        },
      ];

      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: mockRecipes }),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        queryStringParameters: {
          cuisine: 'Italian',
        },
      } as any;

      const result = await getRecipes(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith({
        TableName: 'RecipeHistory',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'user123',
          ':cuisine': 'Italian',
        },
        FilterExpression: 'cuisine = :cuisine',
        ScanIndexForward: false,
      });
    });

    it('should filter recipes by mealType', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Items: [] }),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        queryStringParameters: {
          mealType: 'Breakfast',
        },
      } as any;

      const result = await getRecipes(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith({
        TableName: 'RecipeHistory',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'user123',
          ':mealType': 'Breakfast',
        },
        FilterExpression: 'mealType = :mealType',
        ScanIndexForward: false,
      });
    });

    it('should handle errors gracefully', async () => {
      mockQuery.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        queryStringParameters: null,
      } as any;

      const result = await getRecipes(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Failed to retrieve recipes' });
    });
  });

  describe('getRecipe', () => {
    it('should retrieve a single recipe', async () => {
      const mockRecipe = {
        userId: 'user123',
        recipeId: 'recipe1',
        recipeName: 'Pasta Carbonara',
        cuisine: 'Italian',
        mealType: 'Dinner',
      };

      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Item: mockRecipe }),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: {
          recipeId: 'recipe1',
        },
      } as any;

      const result = await getRecipe(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockRecipe);
      expect(mockGet).toHaveBeenCalledWith({
        TableName: 'RecipeHistory',
        Key: { userId: 'user123', recipeId: 'recipe1' },
      });
    });

    it('should return 404 if recipe not found', async () => {
      mockGet.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: {
          recipeId: 'nonexistent',
        },
      } as any;

      const result = await getRecipe(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({ error: 'Recipe not found' });
    });

    it('should return 400 if recipeId is missing', async () => {
      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: null,
      } as any;

      const result = await getRecipe(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'Recipe ID is required' });
    });
  });

  describe('toggleFavorite', () => {
    it('should update favorite status', async () => {
      const mockUpdatedRecipe = {
        userId: 'user123',
        recipeId: 'recipe1',
        recipeName: 'Pasta Carbonara',
        isFavorite: true,
      };

      mockUpdate.mockReturnValue({
        promise: jest.fn().mockResolvedValue({ Attributes: mockUpdatedRecipe }),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: {
          recipeId: 'recipe1',
        },
        body: JSON.stringify({ isFavorite: true }),
      } as any;

      const result = await toggleFavorite(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockUpdatedRecipe);
      expect(mockUpdate).toHaveBeenCalledWith({
        TableName: 'RecipeHistory',
        Key: { userId: 'user123', recipeId: 'recipe1' },
        UpdateExpression: 'SET isFavorite = :isFavorite',
        ExpressionAttributeValues: {
          ':isFavorite': true,
        },
        ReturnValues: 'ALL_NEW',
      });
    });

    it('should return 400 if recipeId is missing', async () => {
      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: null,
        body: JSON.stringify({ isFavorite: true }),
      } as any;

      const result = await toggleFavorite(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'Recipe ID is required' });
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe', async () => {
      mockDelete.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: {
          recipeId: 'recipe1',
        },
      } as any;

      const result = await deleteRecipe(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ message: 'Recipe deleted successfully' });
      expect(mockDelete).toHaveBeenCalledWith({
        TableName: 'RecipeHistory',
        Key: { userId: 'user123', recipeId: 'recipe1' },
      });
    });

    it('should return 400 if recipeId is missing', async () => {
      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: null,
      } as any;

      const result = await deleteRecipe(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: 'Recipe ID is required' });
    });

    it('should handle errors gracefully', async () => {
      mockDelete.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

      const event: AuthenticatedEvent = {
        user: {
          sub: 'user123',
          aud: 'test-client',
          iss: 'https://cognito-idp.us-east-1.amazonaws.com/test',
          token_use: 'id',
          exp: Date.now() / 1000 + 3600,
          iat: Date.now() / 1000,
          auth_time: Date.now() / 1000,
        },
        pathParameters: {
          recipeId: 'recipe1',
        },
      } as any;

      const result = await deleteRecipe(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: 'Failed to delete recipe' });
    });
  });
});
