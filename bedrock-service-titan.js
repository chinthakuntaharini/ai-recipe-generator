// Amazon Titan Bedrock Service - Ready for Lambda Console
// Copy this entire content to replace the existing bedrock-service.js file

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.modelId = 'amazon.titan-text-express-v1';
  }

  async generateRecipe(request) {
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
      
      // Handle Titan response format
      let recipeText;
      if (responseBody.results && responseBody.results[0] && responseBody.results[0].outputText) {
        recipeText = responseBody.results[0].outputText;
      } else if (responseBody.outputText) {
        recipeText = responseBody.outputText;
      } else {
        console.error('Unexpected response format:', responseBody);
        throw new Error('Unexpected response format from Bedrock');
      }
      
      return this.parseRecipeResponse(recipeText);
    } catch (error) {
      console.error('Bedrock API error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('AccessDenied')) {
        throw new Error('Access denied to Bedrock model. Please check IAM permissions.');
      } else if (error.message.includes('ValidationException')) {
        throw new Error('Invalid request to Bedrock model. Please check model parameters.');
      } else if (error.message.includes('use case details')) {
        throw new Error('Model requires use case approval. Switching to Titan model should resolve this.');
      }
      
      throw new Error(`Failed to generate recipe: ${error.message || 'Unknown error'}`);
    }
  }

  buildRecipePrompt(request) {
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
- Make sure all measurements are specific and accurate
- Return ONLY the JSON object, no additional text`;

    return prompt;
  }

  parseRecipeResponse(responseText) {
    try {
      console.log('Raw Titan response:', responseText);
      
      // Clean up the response text
      let cleanedText = responseText.trim();
      
      // Extract JSON from the response text - try multiple patterns
      let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to find JSON between code blocks
        jsonMatch = cleanedText.match(/```json\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        // Try to find any JSON-like structure
        jsonMatch = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      }
      
      if (!jsonMatch) {
        console.error('No JSON found in response:', responseText);
        // Return a fallback recipe
        return this.createFallbackRecipe(request);
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);
      
      // Validate and fix required fields
      if (!recipeData.title) {
        recipeData.title = "Generated Recipe";
      }
      
      if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients)) {
        recipeData.ingredients = [
          { name: "Main ingredient", amount: "1", unit: "portion" }
        ];
      }
      
      if (!recipeData.instructions || !Array.isArray(recipeData.instructions)) {
        recipeData.instructions = [
          "Prepare ingredients according to recipe requirements",
          "Cook as directed",
          "Serve and enjoy"
        ];
      }
      
      // Ensure ingredients have proper structure
      recipeData.ingredients.forEach((ingredient, index) => {
        if (!ingredient.name) ingredient.name = `Ingredient ${index + 1}`;
        if (!ingredient.amount) ingredient.amount = "1";
        if (!ingredient.unit) ingredient.unit = "piece";
      });
      
      // Provide default values for missing fields
      return {
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime || 15,
        cookTime: recipeData.cookTime || 30,
        servings: recipeData.servings || 4,
        nutritionInfo: recipeData.nutritionInfo || {
          calories: 300,
          protein: 20,
          carbohydrates: 30,
          fat: 10
        }
      };
    } catch (error) {
      console.error('Failed to parse recipe response:', error);
      console.error('Response text was:', responseText);
      
      // Return fallback recipe instead of throwing error
      return this.createFallbackRecipe(request);
    }
  }
  
  createFallbackRecipe(request) {
    const mainIngredient = request.ingredients[0] || 'ingredients';
    return {
      title: `Simple ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`,
      ingredients: request.ingredients.map((ing, index) => ({
        name: ing,
        amount: index === 0 ? "1 lb" : "1 cup",
        unit: ""
      })),
      instructions: [
        `Prepare the ${mainIngredient} by cleaning and cutting as needed`,
        "Heat oil in a large pan over medium heat",
        `Add ${mainIngredient} and cook until tender`,
        "Season with salt and pepper to taste",
        "Serve hot and enjoy"
      ],
      prepTime: 15,
      cookTime: 25,
      servings: request.servings || 4,
      nutritionInfo: {
        calories: 300,
        protein: 20,
        carbohydrates: 30,
        fat: 10
      }
    };
  }
}

module.exports = { BedrockService };