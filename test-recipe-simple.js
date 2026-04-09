// Simple test version of recipe handler
exports.generateRecipe = async (event) => {
  console.log('Recipe generation request received:', JSON.stringify(event, null, 2));

  try {
    // Check if we have the basic event structure
    if (!event) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({ error: 'No event received' })
      };
    }

    // Check authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
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

    // Parse request body
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

    let recipeRequest;
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

    // Return a mock recipe for testing
    const mockRecipe = {
      id: 'test-recipe-123',
      title: `Delicious ${recipeRequest.ingredients?.join(' and ') || 'Mystery'} Recipe`,
      ingredients: recipeRequest.ingredients?.map(ing => ({
        name: ing,
        amount: '1',
        unit: 'cup'
      })) || [],
      instructions: [
        'Prepare all ingredients',
        'Cook according to your preference',
        'Serve and enjoy!'
      ],
      prepTime: 15,
      cookTime: 30,
      servings: recipeRequest.servings || 4,
      nutritionInfo: {
        calories: 350,
        protein: 25,
        carbohydrates: 30,
        fat: 15
      },
      createdAt: new Date().toISOString(),
      userId: 'test-user'
    };

    console.log('Mock recipe generated successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({ recipe: mockRecipe })
    };

  } catch (error) {
    console.error('Recipe generation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        requestId: event.requestContext?.requestId || 'unknown'
      })
    };
  }
};