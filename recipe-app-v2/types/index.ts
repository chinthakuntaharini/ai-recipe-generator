// User Profile Types
export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Eggetarian';
export type SpiceLevel = 'Mild' | 'Medium' | 'Spicy' | 'Very Spicy' | 'Extra spicy';
export type CookingGoal = 'Taste & Indulgence' | 'Fitness & Health' | 'Quick & Easy' | 'Balanced';
export type Appliance = 'Gas stove' | 'Induction' | 'Microwave' | 'Air fryer' | 'Oven/OTG' | 'Pressure cooker' | 'Instant pot';
export type CookingTime = 'Under 15 min' | '15–30 min' | '30–60 min' | 'Over an hour';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  dietPreference: DietType;
  spiceLevel: SpiceLevel;
  cookingGoal: CookingGoal;
  favoriteCuisines: string[];
  availableAppliances: Appliance[];
  dietaryRestrictions: string[];
  usualCookingTime: CookingTime;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

// Recipe Types
export type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' | 'Dessert';
export type CookingStyle = 'Curry' | 'Dry / Stir-fry' | 'Deep fry' | 'Semi-curry / Gravy' | 'Steamed' | 'Baked' | 'Grilled' | 'Salad / Raw';

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
  recipeId: string;
  userId: string;
  recipeName: string;
  recipeDescription: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionInfo: NutritionInfo;
  difficulty: string;
  variationTips: string[];
  cuisine: string;
  mealType: MealType;
  cookTime: number;
  isFavorite: boolean;
  createdAt: string;
}

export interface RecipeRequest {
  dietType: DietType;
  mealType: MealType;
  cuisine: string;
  cookingStyle: CookingStyle;
  appliances: Appliance[];
  pantryStaples: string[];
  spiceLevel: SpiceLevel;
  healthGoal: CookingGoal;
  cookTime: number;
  ingredients: string[];
  restrictions: string[];
}

// Onboarding Types
export interface OnboardingResponses {
  dietPreference: DietType;
  spiceLevel: SpiceLevel;
  cookingGoal: CookingGoal;
  favoriteCuisines: string[];
  availableAppliances: Appliance[];
  dietaryRestrictions: string[];
  usualCookingTime: CookingTime;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface OnboardingState {
  currentStep: OnboardingStep;
  responses: Partial<OnboardingResponses>;
}

// Recipe Form State
export interface RecipeFormState {
  dietType: DietType;
  mealType: MealType;
  cuisine: string;
  cookingStyle: CookingStyle;
  appliances: Appliance[];
  pantryStaples: Record<string, boolean>;
  spiceLevel: SpiceLevel;
  healthGoal: CookingGoal;
  cookTime: number;
  ingredients: string;
}
