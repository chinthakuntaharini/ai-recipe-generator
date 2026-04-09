import { RecipeRequest, BedrockResponse } from '../types/recipe-types';

export class MockBedrockService {
  async generateRecipe(request: RecipeRequest): Promise<BedrockResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRecipes = [
      {
        title: "Chicken and Vegetable Stir-Fry",
        ingredients: [
          { name: "Chicken Breast", amount: "1", unit: "lb" },
          { name: "Rice", amount: "2", unit: "cups" },
          { name: "Mixed Vegetables", amount: "2", unit: "cups" },
          { name: "Soy Sauce", amount: "3", unit: "tbsp" },
          { name: "Garlic", amount: "2", unit: "cloves" }
        ],
        instructions: [
          "Cook rice according to package instructions",
          "Cut chicken into bite-sized pieces",
          "Heat oil in a large pan or wok",
          "Cook chicken until golden brown",
          "Add vegetables and stir-fry for 5 minutes",
          "Add soy sauce and garlic, cook for 2 more minutes",
          "Serve over rice"
        ],
        prepTime: 15,
        cookTime: 20,
        servings: request.servings || 4,
        nutritionInfo: {
          calories: 350,
          protein: 28,
          carbohydrates: 35,
          fat: 12
        }
      },
      {
        title: "Vegetable Fried Rice",
        ingredients: [
          { name: "Cooked Rice", amount: "3", unit: "cups" },
          { name: "Mixed Vegetables", amount: "2", unit: "cups" },
          { name: "Eggs", amount: "2", unit: "large" },
          { name: "Soy Sauce", amount: "2", unit: "tbsp" },
          { name: "Sesame Oil", amount: "1", unit: "tsp" }
        ],
        instructions: [
          "Heat oil in a large pan",
          "Scramble eggs and set aside",
          "Add vegetables to pan and cook until tender",
          "Add rice and break up any clumps",
          "Stir in soy sauce and sesame oil",
          "Add scrambled eggs back to pan",
          "Stir everything together and serve hot"
        ],
        prepTime: 10,
        cookTime: 15,
        servings: request.servings || 4,
        nutritionInfo: {
          calories: 280,
          protein: 12,
          carbohydrates: 45,
          fat: 8
        }
      }
    ];
    
    // Select a random recipe or customize based on ingredients
    const selectedRecipe = mockRecipes[Math.floor(Math.random() * mockRecipes.length)];
    
    // Customize title based on dietary restrictions
    if (request.dietaryRestrictions?.includes('vegetarian')) {
      selectedRecipe.title = "Vegetarian " + selectedRecipe.title;
    }
    
    return selectedRecipe;
  }
}