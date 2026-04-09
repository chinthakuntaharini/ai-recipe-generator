import { APIGatewayProxyEvent } from 'aws-lambda';
import { generateRecipe, handleCors } from '../recipe-handler';
import { validateJwtToken, AuthenticationError } from '../../middleware/auth-middleware';
import { BedrockService } from '../../utils/bedrock-service';

// Mock dependencies
jest.mock('../../middleware/auth-middleware');
jest.mock('../../utils/bedrock-service');
jest.mock('uuid', () => ({
  v4: () => 'test-recipe-id-123'
}));

const mockValidateJwtToken = validateJwtToken as jest.MockedFunction<typeof validateJwtToken>;
const mockBedrockService = BedrockService as jest.MockedClass<typeof BedrockService>;

describe('Recipe Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvent = {
      body: JSON.stringify({
        ingredients: ['chicken', 'rice', 'vegetables'],
        servings: 4
      }),
      headers: {
        Authorization: 'Bearer valid-token'
      },
      requestContext: {
        requestId: 'test-request-id'
      }
    } as any;

    // Mock successful authentication
    mockValidateJwtToken.mockResolvedValue({
      sub: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      email_verified: true,
      aud: 'test-audience',
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
      token_use: 'access',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      auth_time: Math.floor(Date.now() / 1000)
    });

    // Mock successful Bedrock response
    const mockGenerateRecipe = jest.fn().mockResolvedValue({
      title: 'Chicken and Rice Bowl',
      ingredients: [
        { name: 'chicken breast', amount: '2', unit: 'pieces' },
        { name: 'rice', amount: '1', unit: 'cup' },
        { name: 'mixed vegetables', amount: '1', unit: 'cup' }
      ],
      instructions: [
        'Cook rice according to package instructions',
        'Season and cook chicken breast',
        'Steam vegetables',
        'Combine all ingredients in a bowl'
      ],
      prepTime: 15,
      cookTime: 25,
      servings: 4,
      nutritionInfo: {
        calories: 350,
        protein: 30,
        carbohydrates: 40,
        fat: 8
      }
    });
    
    mockBedrockService.mockImplementation(() => ({
      generateRecipe: mockGenerateRecipe
    }) as any);
  });

  describe('generateRecipe', () => {
    it('should generate recipe successfully with valid request', async () => {
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers!['Content-Type']).toBe('application/json');
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.id).toBe('test-recipe-id-123');
      expect(responseBody.title).toBe('Chicken and Rice Bowl');
      expect(responseBody.userId).toBe('user-123');
      expect(responseBody.ingredients).toHaveLength(3);
      expect(responseBody.instructions).toHaveLength(4);
      expect(responseBody.createdAt).toBeDefined();
    });

    it('should return 401 when authorization header is missing', async () => {
      mockEvent.headers = {};
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(401);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Missing authorization header');
    });

    it('should return 401 when JWT validation fails', async () => {
      mockValidateJwtToken.mockRejectedValue(new AuthenticationError('Invalid token'));
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(401);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Invalid token');
    });

    it('should return 400 when request body is missing', async () => {
      mockEvent.body = null;
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Request body is required');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      mockEvent.body = 'invalid json';
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Invalid JSON in request body');
    });

    it('should return 400 when ingredients array is empty', async () => {
      mockEvent.body = JSON.stringify({
        ingredients: []
      });
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('At least one ingredient must be provided');
    });

    it('should return 400 when ingredients is not an array', async () => {
      mockEvent.body = JSON.stringify({
        ingredients: 'not an array'
      });
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Ingredients must be provided as an array');
    });

    it('should return 400 when servings is invalid', async () => {
      mockEvent.body = JSON.stringify({
        ingredients: ['chicken'],
        servings: 0
      });
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Servings must be a number between 1 and 20');
    });

    it('should handle Bedrock service errors', async () => {
      const mockGenerateRecipe = jest.fn().mockRejectedValue(new Error('Bedrock service unavailable'));
      mockBedrockService.mockImplementation(() => ({
        generateRecipe: mockGenerateRecipe
      }) as any);
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Bedrock service unavailable');
      expect(responseBody.requestId).toBe('test-request-id');
    });

    it('should handle dietary restrictions and cuisine preferences', async () => {
      mockEvent.body = JSON.stringify({
        ingredients: ['tofu', 'vegetables'],
        dietaryRestrictions: ['vegan', 'gluten-free'],
        cuisine: 'Asian',
        servings: 2
      });
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.servings).toBe(4); // From mock response
    });

    it('should validate dietary restrictions array', async () => {
      mockEvent.body = JSON.stringify({
        ingredients: ['chicken'],
        dietaryRestrictions: 'not an array'
      });
      
      const result = await generateRecipe(mockEvent);
      
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Dietary restrictions must be an array');
    });
  });

  describe('handleCors', () => {
    it('should return proper CORS headers', async () => {
      const result = await handleCors(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers!['Access-Control-Allow-Headers']).toBe('Content-Type,Authorization');
      expect(result.headers!['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
      expect(result.body).toBe('');
    });
  });
});