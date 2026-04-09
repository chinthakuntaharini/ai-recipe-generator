import { RecipeFormState } from '../types';

/**
 * Builds an enhanced prompt for Amazon Bedrock that includes all recipe parameters
 * and user preferences to generate a comprehensive, personalized recipe.
 */
export function buildEnhancedBedrockPrompt(formState: RecipeFormState): string {
  const {
    ingredients,
    dietType,
    mealType,
    cuisine,
    cookingStyle,
    appliances,
    pantryStaples,
    spiceLevel,
    healthGoal,
    cookTime,
    dietaryRestrictions,
  } = formState;

  // Parse ingredients string into array
  const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(i => i);

  // Build appliances list
  const appliancesText = appliances.length > 0
    ? appliances.join(', ')
    : 'standard kitchen equipment';

  // Build pantry staples list (only include those that are available)
  const availableStaples = Object.entries(pantryStaples)
    .filter(([_, available]) => available)
    .map(([staple]) => staple);
  const staplesText = availableStaples.length > 0
    ? availableStaples.join(', ')
    : 'none specified';

  // Build dietary restrictions text
  const restrictionsText = dietaryRestrictions && dietaryRestrictions.length > 0
    ? dietaryRestrictions.join(', ')
    : 'none';

  const prompt = `You are a professional chef and nutritionist. Generate a detailed, practical recipe based on the following user preferences and constraints:

**User Preferences:**
- Diet type: ${dietType}
- Meal type: ${mealType}
- Cuisine: ${cuisine}
- Cooking style: ${cookingStyle}
- Spice level: ${spiceLevel}
- Health goal: ${healthGoal}

**Available Resources:**
- Main ingredients: ${ingredientsArray.join(', ')}
- Available appliances: ${appliancesText}
- Pantry staples available: ${staplesText}

**Constraints:**
- Maximum cooking time: ${cookTime} minutes (including prep and cook time)
- Dietary restrictions/allergies: ${restrictionsText}

**Instructions:**
1. Create a recipe that uses the provided main ingredients as the primary components
2. You may use the available pantry staples without listing them as additional ingredients
3. Only suggest cooking methods compatible with the available appliances
4. Ensure the total time (prep + cook) does not exceed ${cookTime} minutes
5. Match the specified spice level (${spiceLevel})
6. Align with the health goal (${healthGoal}): 
   - If "Fitness-centric": focus on high protein, low fat, nutrient-dense ingredients
   - If "Taste-centric": prioritize flavor, richness, and indulgence
   - If "Balanced": balance nutrition with taste
7. Respect all dietary restrictions: ${restrictionsText}
8. Follow ${dietType} dietary requirements strictly

**Output Format:**
Provide your response as a JSON object with the following structure:
{
  "title": "Recipe name",
  "description": "Brief 2-3 sentence description highlighting key flavors and appeal",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "unit": "measurement unit"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "difficulty": "Easy" | "Medium" | "Hard",
  "nutritionInfo": {
    "calories": number (per serving),
    "protein": "Xg",
    "carbs": "Xg",
    "fat": "Xg",
    "fiber": "Xg"
  },
  "tags": ["tag1", "tag2"],
  "variationTips": [
    "Variation tip 1",
    "Variation tip 2"
  ]
}

**Important Guidelines:**
- Do NOT include pantry staples in the ingredients list unless they are used in significant quantities
- Ensure prepTime + cookTime <= ${cookTime} minutes
- Make instructions clear, concise, and numbered
- Include specific temperatures and timings where relevant
- Provide realistic nutrition estimates
- Add 2-3 variation tips for customization
- Use tags to describe the recipe (e.g., "quick", "healthy", "spicy", "comfort-food")

Generate the recipe now:`;

  return prompt;
}
