export interface RecipeRequest {
  ingredients: string[];
  dietaryRestrictions?: string[];
  cuisine?: string;
  servings?: number;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutritionInfo?: NutritionInfo;
  createdAt: string;
  userId: string;
}

export interface BedrockResponse {
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutritionInfo?: NutritionInfo;
}

export interface RecipeGenerationError extends Error {
  code: string;
  statusCode: number;
}

export class RecipeError extends Error implements RecipeGenerationError {
  constructor(message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = 'RecipeError';
  }
}