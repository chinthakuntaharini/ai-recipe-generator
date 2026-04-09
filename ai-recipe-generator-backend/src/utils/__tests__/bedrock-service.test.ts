import { BedrockService } from '../bedrock-service';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockInvokeModelCommand = InvokeModelCommand as jest.MockedClass<typeof InvokeModelCommand>;

describe('BedrockService', () => {
  let bedrockService: BedrockService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSend = jest.fn();
    mockBedrockClient.mockImplementation(() => ({
      send: mockSend
    } as any));
    
    bedrockService = new BedrockService();
  });

  describe('generateRecipe', () => {
    const mockRequest = {
      ingredients: ['chicken', 'rice', 'vegetables'],
      servings: 4
    };

    const mockBedrockResponse = {
      body: new TextEncoder().encode(JSON.stringify({
        content: [{
          text: JSON.stringify({
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
          })
        }]
      }))
    };

    it('should generate recipe successfully', async () => {
      mockSend.mockResolvedValue(mockBedrockResponse);

      const result = await bedrockService.generateRecipe(mockRequest);

      expect(result.title).toBe('Chicken and Rice Bowl');
      expect(result.ingredients).toHaveLength(3);
      expect(result.instructions).toHaveLength(4);
      expect(result.prepTime).toBe(15);
      expect(result.cookTime).toBe(25);
      expect(result.servings).toBe(4);
      expect(result.nutritionInfo).toBeDefined();
    });

    it('should include dietary restrictions in prompt', async () => {
      const requestWithRestrictions = {
        ...mockRequest,
        dietaryRestrictions: ['vegan', 'gluten-free']
      };

      mockSend.mockResolvedValue(mockBedrockResponse);

      await bedrockService.generateRecipe(requestWithRestrictions);

      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      // Check that the command was created with the right parameters
      expect(mockInvokeModelCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('vegan, gluten-free')
        })
      );
    });

    it('should include cuisine preference in prompt', async () => {
      const requestWithCuisine = {
        ...mockRequest,
        cuisine: 'Italian'
      };

      mockSend.mockResolvedValue(mockBedrockResponse);

      await bedrockService.generateRecipe(requestWithCuisine);

      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      // Check that the command was created with the right parameters
      expect(mockInvokeModelCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Italian cuisine')
        })
      );
    });

    it('should handle missing response body', async () => {
      mockSend.mockResolvedValue({ body: null });

      await expect(bedrockService.generateRecipe(mockRequest))
        .rejects.toThrow('Failed to generate recipe: Empty response from Bedrock');
    });

    it('should handle invalid JSON response', async () => {
      const invalidResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'invalid json response'
          }]
        }))
      };

      mockSend.mockResolvedValue(invalidResponse);

      await expect(bedrockService.generateRecipe(mockRequest))
        .rejects.toThrow('Failed to generate recipe: Invalid recipe format');
    });

    it('should handle missing required fields in response', async () => {
      const incompleteResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: 'Incomplete Recipe'
              // Missing ingredients and instructions
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(incompleteResponse);

      await expect(bedrockService.generateRecipe(mockRequest))
        .rejects.toThrow('Failed to generate recipe: Invalid recipe format');
    });

    it('should provide default values for optional fields', async () => {
      const minimalResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: 'Simple Recipe',
              ingredients: [
                { name: 'ingredient1', amount: '1' }
              ],
              instructions: ['Step 1']
              // Missing prepTime, cookTime, servings, nutritionInfo
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(minimalResponse);

      const result = await bedrockService.generateRecipe(mockRequest);

      expect(result.prepTime).toBe(15); // default value
      expect(result.cookTime).toBe(30); // default value
      expect(result.servings).toBe(4); // default value
      expect(result.nutritionInfo).toBeUndefined();
      expect(result.ingredients[0].unit).toBe('piece'); // default unit
    });

    it('should handle Bedrock API errors', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock API unavailable'));

      await expect(bedrockService.generateRecipe(mockRequest))
        .rejects.toThrow('Failed to generate recipe: Bedrock API unavailable');
    });

    it('should validate ingredient structure', async () => {
      const responseWithInvalidIngredients = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: 'Recipe with Invalid Ingredients',
              ingredients: [
                { name: 'valid ingredient', amount: '1', unit: 'cup' },
                { amount: '2', unit: 'pieces' } // missing name
              ],
              instructions: ['Step 1']
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(responseWithInvalidIngredients);

      await expect(bedrockService.generateRecipe(mockRequest))
        .rejects.toThrow('Failed to generate recipe: Invalid recipe format');
    });

    it('should validate instructions array', async () => {
      const responseWithInvalidInstructions = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              title: 'Recipe with Invalid Instructions',
              ingredients: [
                { name: 'ingredient', amount: '1', unit: 'cup' }
              ],
              instructions: 'Not an array'
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(responseWithInvalidInstructions);

      await expect(bedrockService.generateRecipe(mockRequest))
        .rejects.toThrow('Failed to generate recipe: Invalid recipe format');
    });
  });
});