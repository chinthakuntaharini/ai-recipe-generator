import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { RecipeRequest, BedrockResponse } from '../types/recipe-types';

export class BedrockService {
  private client: BedrockRuntimeClient;
  private modelId = 'amazon.titan-text-express-v1';

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async generateRecipe(request: RecipeRequest): Promise<BedrockResponse> {
    const prompt = this.buildRecipePrompt(request);
    
    const input = {
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 2000,
          temperature: 0.7,
          topP: 0.9,
          stopSequences: []
        }
      })
    };

    try {
      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const recipeText = responseBody.results[0].outputText;
      
      return this.parseRecipeResponse(recipeText);
    } catch (error) {
      console.error('Bedrock API error:', error);
      throw new Error(`Failed to generate recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildRecipePrompt(request: RecipeRequest): string {
    let prompt = `Generate a detailed recipe using the following ingredients: ${request.ingredients.join(', ')}.`;
    
    if (request.dietaryRestrictions && request.dietaryRestrictions.length > 0) {
      prompt += ` The recipe must accommodate these dietary restrictions: ${request.dietaryRestrictions.join(', ')}.`;
    }
    
    if (request.cuisine) {
      prompt += ` The recipe should be in ${request.cuisine} cuisine style.`;
    }
    
    if (request.servings) {
      prompt += ` The recipe should serve ${request.servings} people.`;
    }
    
    prompt += `

Please provide the recipe in the following JSON format:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "unit": "measurement unit"
    }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "nutritionInfo": {
    "calories": 350,
    "protein": 25,
    "carbohydrates": 30,
    "fat": 15
  }
}

Requirements:
- Use at least 80% of the provided ingredients
- Provide clear, step-by-step instructions
- Include realistic preparation and cooking times
- Ensure the recipe is practical and achievable
- Include nutritional information if possible
- Make sure all measurements are specific and accurate`;

    return prompt;
  }

  private parseRecipeResponse(responseText: string): BedrockResponse {
    try {
      // Extract JSON from the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Missing required recipe fields');
      }
      
      // Ensure ingredients have proper structure
      if (!Array.isArray(recipeData.ingredients)) {
        throw new Error('Ingredients must be an array');
      }
      
      recipeData.ingredients.forEach((ingredient: any, index: number) => {
        if (!ingredient.name || !ingredient.amount) {
          throw new Error(`Invalid ingredient at index ${index}`);
        }
        // Provide default unit if missing
        if (!ingredient.unit) {
          ingredient.unit = 'piece';
        }
      });
      
      // Ensure instructions is an array
      if (!Array.isArray(recipeData.instructions)) {
        throw new Error('Instructions must be an array');
      }
      
      // Provide default values for missing fields
      return {
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime || 15,
        cookTime: recipeData.cookTime || 30,
        servings: recipeData.servings || 4,
        nutritionInfo: recipeData.nutritionInfo || undefined
      };
    } catch (error) {
      console.error('Failed to parse recipe response:', error);
      throw new Error(`Invalid recipe format: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }
}