// Simplified Amazon Titan Bedrock Service
// Copy this to replace bedrock-service.js if the previous version has issues

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.modelId = 'amazon.titan-text-express-v1';
  }

  async generateRecipe(request) {
    console.log('BedrockService: Starting recipe generation with Titan model');
    console.log('Request:', JSON.stringify(request, null, 2));
    
    try {
      const prompt = this.buildRecipePrompt(request);
      console.log('Generated prompt length:', prompt.length);
      
      const input = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: 1000,
            temperature: 0.7,
            topP: 0.9,
            stopSequences: []
          }
        })
      };

      console.log('Calling Bedrock with model:', this.modelId);
      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log('Bedrock response:', JSON.stringify(responseBody, null, 2));
      
      // Handle Titan response format
      let recipeText = '';
      if (responseBody.results && responseBody.results[0] && responseBody.results[0].outputText) {
        recipeText = responseBody.results[0].outputText;
      } else if (responseBody.outputText) {
        recipeText = responseBody.outputText;
      } else {
        console.error('Unexpected response format:', responseBody);
        // Return a simple fallback recipe instead of throwing
        return this.createSimpleFallbackRecipe(request);
      }
      
      console.log('Raw recipe text:', recipeText);
      return this.parseRecipeResponse(recipeText, request);
      
    } catch (error) {
      console.error('Bedrock API error:', error);
      
      // Return fallback recipe instead of throwing error
      console.log('Returning fallback recipe due to error');
      return this.createSimpleFallbackRecipe(request);
    }
  }

  buildRecipePrompt(request) {
    const ingredients = request.ingredients.join(', ');
    const servings = request.servings || 4;
    
    return `Create a simple recipe using these ingredients: ${ingredients}. 
Serve ${servings} people. 
Format as JSON with title, ingredients array (name, amount, unit), instructions array, prepTime, cookTime, servings.
Keep it simple and practical.`;
  }

  parseRecipeResponse(responseText, request) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const recipeData = JSON.parse(jsonMatch[0]);
        
        // Validate and return
        return {
          title: recipeData.title || 'Generated Recipe',
          ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [
            { name: request.ingredients[0] || 'main ingredient', amount: '1', unit: 'portion' }
          ],
          instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [
            'Prepare ingredients',
            'Cook as desired',
            'Serve and enjoy'
          ],
          prepTime: recipeData.prepTime || 15,
          cookTime: recipeData.cookTime || 30,
          servings: recipeData.servings || request.servings || 4,
          nutritionInfo: recipeData.nutritionInfo || {
            calories: 300,
            protein: 20,
            carbohydrates: 30,
            fat: 10
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse recipe response:', error);
    }
    
    // Fallback if parsing fails
    return this.createSimpleFallbackRecipe(request);
  }
  
  createSimpleFallbackRecipe(request) {
    const mainIngredient = request.ingredients && request.ingredients[0] ? request.ingredients[0] : 'ingredients';
    
    return {
      title: `Simple ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`,
      ingredients: (request.ingredients || ['main ingredient']).map((ing, index) => ({
        name: ing,
        amount: index === 0 ? "1 lb" : "1 cup",
        unit: ""
      })),
      instructions: [
        `Prepare the ${mainIngredient}`,
        "Cook in a pan with oil over medium heat",
        "Season with salt and pepper",
        "Cook until tender",
        "Serve hot"
      ],
      prepTime: 10,
      cookTime: 20,
      servings: request.servings || 4,
      nutritionInfo: {
        calories: 250,
        protein: 15,
        carbohydrates: 20,
        fat: 8
      }
    };
  }
}

module.exports = { BedrockService };