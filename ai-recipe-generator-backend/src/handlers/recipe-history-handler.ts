import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { withAuth, AuthenticatedEvent } from '../middleware/auth-middleware';

const dynamodb = new DynamoDB.DocumentClient();
const RECIPE_HISTORY_TABLE = process.env.RECIPE_HISTORY_TABLE || 'RecipeHistory';

// GET /recipes - Get all user recipes
async function getRecipesHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;
  const cuisineFilter = event.queryStringParameters?.cuisine;
  const mealTypeFilter = event.queryStringParameters?.mealType;

  try {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: RECIPE_HISTORY_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt descending
    };

    // Add filters if provided
    if (cuisineFilter || mealTypeFilter) {
      const filterExpressions: string[] = [];
      if (cuisineFilter) {
        filterExpressions.push('cuisine = :cuisine');
        params.ExpressionAttributeValues![':cuisine'] = cuisineFilter;
      }
      if (mealTypeFilter) {
        filterExpressions.push('mealType = :mealType');
        params.ExpressionAttributeValues![':mealType'] = mealTypeFilter;
      }
      params.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    console.error('Get recipes error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to retrieve recipes' }),
    };
  }
}

// GET /recipes/:recipeId - Get single recipe
async function getRecipeHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;
  const recipeId = event.pathParameters?.recipeId;

  if (!recipeId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Recipe ID is required' }),
    };
  }

  try {
    const result = await dynamodb.get({
      TableName: RECIPE_HISTORY_TABLE,
      Key: { userId, recipeId },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Recipe not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Get recipe error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to retrieve recipe' }),
    };
  }
}

// PUT /recipes/:recipeId/favorite - Toggle favorite status
async function toggleFavoriteHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;
  const recipeId = event.pathParameters?.recipeId;

  if (!recipeId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Recipe ID is required' }),
    };
  }

  try {
    const { isFavorite } = JSON.parse(event.body || '{}');

    const result = await dynamodb.update({
      TableName: RECIPE_HISTORY_TABLE,
      Key: { userId, recipeId },
      UpdateExpression: 'SET isFavorite = :isFavorite',
      ExpressionAttributeValues: {
        ':isFavorite': isFavorite,
      },
      ReturnValues: 'ALL_NEW',
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to update favorite status' }),
    };
  }
}

// DELETE /recipes/:recipeId - Delete recipe
async function deleteRecipeHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;
  const recipeId = event.pathParameters?.recipeId;

  if (!recipeId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Recipe ID is required' }),
    };
  }

  try {
    await dynamodb.delete({
      TableName: RECIPE_HISTORY_TABLE,
      Key: { userId, recipeId },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Recipe deleted successfully' }),
    };
  } catch (error) {
    console.error('Delete recipe error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to delete recipe' }),
    };
  }
}

// Export handlers with authentication middleware
export const getRecipes = withAuth(getRecipesHandler);
export const getRecipe = withAuth(getRecipeHandler);
export const toggleFavorite = withAuth(toggleFavoriteHandler);
export const deleteRecipe = withAuth(deleteRecipeHandler);
