import { Recipe, Ingredient, NutritionInfo } from '@/types';

/**
 * Error thrown when recipe parsing fails
 */
export class RecipeParseError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'RecipeParseError';
  }
}

/**
 * Parses a recipe from API response format to frontend Recipe type
 * Handles field name mismatches and validates data
 */
export function parseRecipe(data: any): Recipe {
  try {
    // Validate required fields
    if (!data) {
      throw new RecipeParseError('Recipe data is null or undefined');
    }

    if (!data.id) {
      throw new RecipeParseError('Recipe ID is missing');
    }

    if (!data.title) {
      throw new RecipeParseError('Recipe title is missing');
    }

    // Parse ingredients
    const ingredients: Ingredient[] = Array.isArray(data.ingredients)
      ? data.ingredients.map((ing: any, index: number) => {
          if (typeof ing === 'string') {
            // Handle string format
            return {
              name: ing,
              amount: '',
              unit: '',
            };
          }
          
          if (!ing.name) {
            throw new RecipeParseError(`Ingredient at index ${index} is missing name`);
          }

          return {
            name: ing.name,
            amount: ing.amount || '',
            unit: ing.unit || '',
          };
        })
      : [];

    // Parse instructions
    const instructions: string[] = Array.isArray(data.instructions)
      ? data.instructions.map((step: any) => String(step))
      : [];

    // Parse nutrition info (handle both string and number formats)
    const nutritionInfo: NutritionInfo | undefined = data.nutritionInfo ? {
      calories: data.nutritionInfo.calories,
      protein: data.nutritionInfo.protein,
      carbohydrates: data.nutritionInfo.carbohydrates || data.nutritionInfo.carbs,
      fat: data.nutritionInfo.fat,
      fiber: data.nutritionInfo.fiber,
    } : undefined;

    // Parse variation tips
    const variationTips: string[] | undefined = Array.isArray(data.variationTips)
      ? data.variationTips.map((tip: any) => String(tip))
      : undefined;

    // Build the recipe object
    const recipe: Recipe = {
      id: data.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      ingredients,
      instructions,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      nutritionInfo,
      difficulty: data.difficulty,
      variationTips,
      cuisine: data.cuisine,
      mealType: data.mealType,
      isFavorite: Boolean(data.isFavorite),
      createdAt: data.createdAt || new Date().toISOString(),
      tags: Array.isArray(data.tags) ? data.tags : undefined,
    };

    return recipe;
  } catch (error) {
    if (error instanceof RecipeParseError) {
      throw error;
    }
    throw new RecipeParseError(
      'Failed to parse recipe',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Serializes a Recipe object to JSON format for API requests
 */
export function serializeRecipe(recipe: Recipe): any {
  return {
    id: recipe.id,
    userId: recipe.userId,
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
    })),
    instructions: recipe.instructions,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    nutritionInfo: recipe.nutritionInfo,
    difficulty: recipe.difficulty,
    variationTips: recipe.variationTips,
    cuisine: recipe.cuisine,
    mealType: recipe.mealType,
    isFavorite: recipe.isFavorite,
    createdAt: recipe.createdAt,
    tags: recipe.tags,
  };
}

/**
 * Validates that a recipe can be round-tripped (parsed then serialized then parsed)
 * without data loss
 */
export function validateRoundTrip(recipe: Recipe): boolean {
  try {
    const serialized = serializeRecipe(recipe);
    const parsed = parseRecipe(serialized);
    
    // Compare key fields
    return (
      parsed.id === recipe.id &&
      parsed.title === recipe.title &&
      parsed.description === recipe.description &&
      parsed.ingredients.length === recipe.ingredients.length &&
      parsed.instructions.length === recipe.instructions.length &&
      parsed.difficulty === recipe.difficulty &&
      parsed.cuisine === recipe.cuisine &&
      parsed.mealType === recipe.mealType
    );
  } catch (error) {
    return false;
  }
}

/**
 * Parses multiple recipes from an API response
 */
export function parseRecipes(data: any[]): Recipe[] {
  if (!Array.isArray(data)) {
    throw new RecipeParseError('Expected array of recipes');
  }

  const recipes: Recipe[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  data.forEach((item, index) => {
    try {
      recipes.push(parseRecipe(item));
    } catch (error) {
      errors.push({
        index,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // If more than 50% of recipes failed to parse, throw an error
  if (errors.length > data.length / 2) {
    throw new RecipeParseError(
      `Failed to parse ${errors.length} out of ${data.length} recipes`,
      errors
    );
  }

  return recipes;
}
