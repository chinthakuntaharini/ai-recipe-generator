// Ultra-Simple Fallback Bedrock Service
// This will work immediately while we debug the Titan model issue
// Copy this entire content to replace bedrock-service.js

class BedrockService {
  constructor() {
    console.log('BedrockService initialized with fallback mode');
  }

  async generateRecipe(request) {
    console.log('Generating fallback recipe for request:', JSON.stringify(request, null, 2));
    
    // Always return a working recipe immediately
    const ingredients = request.ingredients || ['chicken', 'rice', 'vegetables'];
    const servings = request.servings || 4;
    const mainIngredient = ingredients[0] || 'chicken';
    
    // Create a realistic recipe based on the ingredients
    const recipe = {
      title: `Delicious ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`,
      ingredients: ingredients.map((ing, index) => ({
        name: ing.charAt(0).toUpperCase() + ing.slice(1),
        amount: index === 0 ? "1 lb" : index === 1 ? "2 cups" : "1 cup",
        unit: ""
      })),
      instructions: [
        `Prepare the ${mainIngredient} by cleaning and cutting into bite-sized pieces`,
        "Heat 2 tablespoons of oil in a large pan over medium-high heat",
        `Add the ${mainIngredient} to the pan and cook until golden brown`,
        "Add the remaining ingredients and stir well",
        "Season with salt, pepper, and your favorite spices",
        "Cook for 15-20 minutes until everything is tender",
        "Taste and adjust seasoning as needed",
        "Serve hot and enjoy your delicious meal!"
      ],
      prepTime: 15,
      cookTime: 25,
      servings: servings,
      nutritionInfo: {
        calories: 350,
        protein: 28,
        carbohydrates: 32,
        fat: 12
      }
    };
    
    console.log('Generated fallback recipe:', JSON.stringify(recipe, null, 2));
    return recipe;
  }
}

module.exports = { BedrockService };