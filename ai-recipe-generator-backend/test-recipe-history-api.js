/**
 * Test script for Recipe History API endpoints
 * 
 * This script tests the GET /recipes, GET /recipes/:recipeId, PUT /recipes/:recipeId/favorite, and DELETE /recipes/:recipeId endpoints
 * 
 * Usage:
 *   node test-recipe-history-api.js <API_URL> <JWT_TOKEN>
 * 
 * Example:
 *   node test-recipe-history-api.js https://abc123.execute-api.us-east-1.amazonaws.com/dev eyJhbGc...
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const API_URL = process.argv[2];
const JWT_TOKEN = process.argv[3];

if (!API_URL || !JWT_TOKEN) {
  console.error('Usage: node test-recipe-history-api.js <API_URL> <JWT_TOKEN>');
  console.error('');
  console.error('Example:');
  console.error('  node test-recipe-history-api.js https://abc123.execute-api.us-east-1.amazonaws.com/dev eyJhbGc...');
  process.exit(1);
}

console.log('========================================');
console.log('Recipe History API Test Script');
console.log('========================================');
console.log('API URL:', API_URL);
console.log('JWT Token:', JWT_TOKEN.substring(0, 20) + '...');
console.log('========================================\n');

/**
 * Make HTTP request
 */
function makeRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Test 1: GET /recipes (get all recipes)
 */
async function testGetRecipes() {
  console.log('Test 1: GET /recipes');
  console.log('Expected: 200 OK with array of recipes');
  
  try {
    const response = await makeRequest(
      `${API_URL}/recipes`,
      'GET',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Recipes retrieved successfully');
      console.log(`  Found ${Array.isArray(response.body) ? response.body.length : 0} recipes`);
      return response.body;
    } else if (response.statusCode === 401) {
      console.log('✗ Authentication failed - check JWT token');
      return [];
    } else {
      console.log('✗ Unexpected status code:', response.statusCode);
      return [];
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
    return [];
  }
}

/**
 * Test 2: GET /recipes with cuisine filter
 */
async function testGetRecipesWithFilter() {
  console.log('\nTest 2: GET /recipes?cuisine=Italian');
  console.log('Expected: 200 OK with filtered recipes');
  
  try {
    const response = await makeRequest(
      `${API_URL}/recipes?cuisine=Italian`,
      'GET',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Filtered recipes retrieved successfully');
      console.log(`  Found ${Array.isArray(response.body) ? response.body.length : 0} Italian recipes`);
      return response.body;
    } else {
      console.log('✗ Unexpected status code:', response.statusCode);
      return [];
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
    return [];
  }
}

/**
 * Test 3: GET /recipes/:recipeId (get single recipe)
 */
async function testGetRecipe(recipeId) {
  console.log(`\nTest 3: GET /recipes/${recipeId}`);
  console.log('Expected: 200 OK with recipe details');
  
  try {
    const response = await makeRequest(
      `${API_URL}/recipes/${recipeId}`,
      'GET',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Recipe retrieved successfully');
      return response.body;
    } else if (response.statusCode === 404) {
      console.log('✓ Recipe not found (expected if recipe doesn\'t exist)');
      return null;
    } else if (response.statusCode === 401) {
      console.log('✗ Authentication failed - check JWT token');
      return null;
    } else {
      console.log('✗ Unexpected status code:', response.statusCode);
      return null;
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
    return null;
  }
}

/**
 * Test 4: PUT /recipes/:recipeId/favorite (toggle favorite)
 */
async function testToggleFavorite(recipeId, isFavorite) {
  console.log(`\nTest 4: PUT /recipes/${recipeId}/favorite`);
  console.log(`Expected: 200 OK with updated recipe (isFavorite: ${isFavorite})`);
  
  try {
    const response = await makeRequest(
      `${API_URL}/recipes/${recipeId}/favorite`,
      'PUT',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      { isFavorite }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Favorite status updated successfully');
      return response.body;
    } else if (response.statusCode === 401) {
      console.log('✗ Authentication failed - check JWT token');
      return null;
    } else if (response.statusCode === 404) {
      console.log('✗ Recipe not found');
      return null;
    } else {
      console.log('✗ Unexpected status code:', response.statusCode);
      return null;
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
    return null;
  }
}

/**
 * Test 5: DELETE /recipes/:recipeId (delete recipe)
 */
async function testDeleteRecipe(recipeId) {
  console.log(`\nTest 5: DELETE /recipes/${recipeId}`);
  console.log('Expected: 200 OK with success message');
  
  try {
    const response = await makeRequest(
      `${API_URL}/recipes/${recipeId}`,
      'DELETE',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Recipe deleted successfully');
      return true;
    } else if (response.statusCode === 401) {
      console.log('✗ Authentication failed - check JWT token');
      return false;
    } else if (response.statusCode === 404) {
      console.log('✗ Recipe not found');
      return false;
    } else {
      console.log('✗ Unexpected status code:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('✗ Request failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Test 1: Get all recipes
    const recipes = await testGetRecipes();
    
    // Test 2: Get recipes with filter
    await testGetRecipesWithFilter();
    
    // If there are recipes, test operations on the first one
    if (recipes && recipes.length > 0) {
      const testRecipeId = recipes[0].recipeId;
      
      // Test 3: Get single recipe
      await testGetRecipe(testRecipeId);
      
      // Test 4: Toggle favorite to true
      await testToggleFavorite(testRecipeId, true);
      
      // Test 4b: Toggle favorite to false
      await testToggleFavorite(testRecipeId, false);
      
      // Test 5: Delete recipe (commented out to preserve data)
      console.log('\nTest 5: DELETE /recipes/:recipeId');
      console.log('Skipped to preserve recipe data');
      console.log('To test deletion, uncomment the line below:');
      console.log(`// await testDeleteRecipe('${testRecipeId}');`);
      
    } else {
      console.log('\nNo recipes found. Skipping tests 3-5.');
      console.log('To test these endpoints:');
      console.log('1. Generate a recipe using the recipe generation API');
      console.log('2. Run this test script again');
    }
    
    console.log('\n========================================');
    console.log('All tests completed!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\nTest suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
