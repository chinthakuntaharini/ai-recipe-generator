import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { validateJwtToken, AuthenticationError } from '../middleware/auth-middleware';
import { BedrockService } from '../utils/bedrock-service';
import { RecipeRequest, Recipe, RecipeError } from '../types/recipe-types';

const bedrockService = new BedrockService();

export const generateRecipe = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Recipe generation request received:', JSON.stringify(event, null, 2));

  try {
    // Validate authentication
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ error: 'Missing authorization header' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await validateJwtToken(token);
    
    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    let recipeRequest: RecipeRequest;
    try {
      recipeRequest = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Validate recipe request
    const validationError = validateRecipeRequest(recipeRequest);
    if (validationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ error: validationError })
      };
    }

    console.log('Generating recipe for user:', user.sub, 'with request:', recipeRequest);

    // Generate recipe using Bedrock
    const bedrockResponse = await bedrockService.generateRecipe(recipeRequest);
    
    // Create complete recipe object
    const recipe: Recipe = {
      id: uuidv4(),
      title: bedrockResponse.title,
      ingredients: bedrockResponse.ingredients,
      instructions: bedrockResponse.instructions,
      prepTime: bedrockResponse.prepTime,
      cookTime: bedrockResponse.cookTime,
      servings: bedrockResponse.servings,
      nutritionInfo: bedrockResponse.nutritionInfo,
      createdAt: new Date().toISOString(),
      userId: user.sub
    };

    console.log('Recipe generated successfully:', recipe.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify(recipe)
    };

  } catch (error) {
    console.error('Recipe generation error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
    } else if (error instanceof RecipeError) {
      statusCode = error.statusCode;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({ 
        error: errorMessage,
        requestId: event.requestContext?.requestId || 'unknown'
      })
    };
  }
};

function validateRecipeRequest(request: RecipeRequest): string | null {
  if (!request.ingredients || !Array.isArray(request.ingredients)) {
    return 'Ingredients must be provided as an array';
  }
  
  if (request.ingredients.length === 0) {
    return 'At least one ingredient must be provided';
  }
  
  if (request.ingredients.length > 20) {
    return 'Maximum 20 ingredients allowed';
  }
  
  // Validate each ingredient
  for (let i = 0; i < request.ingredients.length; i++) {
    const ingredient = request.ingredients[i];
    if (typeof ingredient !== 'string' || ingredient.trim().length === 0) {
      return `Ingredient at index ${i} must be a non-empty string`;
    }
    if (ingredient.length > 100) {
      return `Ingredient at index ${i} is too long (max 100 characters)`;
    }
  }
  
  // Validate dietary restrictions if provided
  if (request.dietaryRestrictions) {
    if (!Array.isArray(request.dietaryRestrictions)) {
      return 'Dietary restrictions must be an array';
    }
    if (request.dietaryRestrictions.length > 10) {
      return 'Maximum 10 dietary restrictions allowed';
    }
    for (let i = 0; i < request.dietaryRestrictions.length; i++) {
      const restriction = request.dietaryRestrictions[i];
      if (typeof restriction !== 'string' || restriction.trim().length === 0) {
        return `Dietary restriction at index ${i} must be a non-empty string`;
      }
    }
  }
  
  // Validate cuisine if provided
  if (request.cuisine && (typeof request.cuisine !== 'string' || request.cuisine.trim().length === 0)) {
    return 'Cuisine must be a non-empty string';
  }
  
  // Validate servings if provided
  if (request.servings !== undefined) {
    if (typeof request.servings !== 'number' || request.servings < 1 || request.servings > 20) {
      return 'Servings must be a number between 1 and 20';
    }
  }
  
  return null;
}

// Handle CORS preflight requests
export const handleCors = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: ''
  };
};