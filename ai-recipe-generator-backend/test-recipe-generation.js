const { generateRecipe } = require('./dist/handlers/recipe-handler');

// Mock event for testing
const mockEvent = {
  headers: {
    Authorization: 'Bearer test-token'
  },
  body: JSON.stringify({
    ingredients: ['chicken', 'rice', 'vegetables'],
    servings: 4
  }),
  requestContext: {
    requestId: 'test-request-id'
  }
};

// Test the function
async function testRecipeGeneration() {
  console.log('Testing recipe generation...');
  
  try {
    const result = await generateRecipe(mockEvent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testRecipeGeneration();