/**
 * Test script for Profile API endpoints
 * 
 * This script tests the GET /profile, PUT /profile, and POST /profile/onboarding endpoints
 * 
 * Usage:
 *   node test-profile-api.js <API_URL> <JWT_TOKEN>
 * 
 * Example:
 *   node test-profile-api.js https://abc123.execute-api.us-east-1.amazonaws.com/dev eyJhbGc...
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const API_URL = process.argv[2];
const JWT_TOKEN = process.argv[3];

if (!API_URL || !JWT_TOKEN) {
  console.error('Usage: node test-profile-api.js <API_URL> <JWT_TOKEN>');
  console.error('');
  console.error('Example:');
  console.error('  node test-profile-api.js https://abc123.execute-api.us-east-1.amazonaws.com/dev eyJhbGc...');
  process.exit(1);
}

console.log('========================================');
console.log('Profile API Test Script');
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
 * Test 1: GET /profile (should return 404 if profile doesn't exist)
 */
async function testGetProfile() {
  console.log('Test 1: GET /profile');
  console.log('Expected: 200 OK with profile data OR 404 if profile not found');
  
  try {
    const response = await makeRequest(
      `${API_URL}/profile`,
      'GET',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Profile retrieved successfully');
      return response.body;
    } else if (response.statusCode === 404) {
      console.log('✓ Profile not found (expected for new users)');
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
 * Test 2: POST /profile/onboarding (create profile)
 */
async function testCreateProfile() {
  console.log('\nTest 2: POST /profile/onboarding');
  console.log('Expected: 201 Created with profile data');
  
  const onboardingData = {
    dietPreference: 'Vegetarian',
    spiceLevel: 'Medium',
    cookingGoal: 'Balanced',
    favoriteCuisines: ['Italian', 'Indian', 'Thai'],
    availableAppliances: ['Stove', 'Oven', 'Microwave'],
    dietaryRestrictions: ['Gluten-free'],
    usualCookingTime: '30-60min'
  };
  
  try {
    const response = await makeRequest(
      `${API_URL}/profile/onboarding`,
      'POST',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      onboardingData
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 201) {
      console.log('✓ Profile created successfully');
      return response.body;
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
 * Test 3: PUT /profile (update profile)
 */
async function testUpdateProfile() {
  console.log('\nTest 3: PUT /profile');
  console.log('Expected: 200 OK with updated profile data');
  
  const updateData = {
    displayName: 'Test User Updated',
    dietPreference: 'Vegan',
    spiceLevel: 'Spicy',
    cookingGoal: 'Fitness',
    favoriteCuisines: ['Mexican', 'Japanese'],
    availableAppliances: ['Stove', 'Air Fryer'],
    dietaryRestrictions: ['Nut-free'],
    usualCookingTime: '15-30min'
  };
  
  try {
    const response = await makeRequest(
      `${API_URL}/profile`,
      'PUT',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      updateData
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Profile updated successfully');
      return response.body;
    } else if (response.statusCode === 401) {
      console.log('✗ Authentication failed - check JWT token');
      return null;
    } else if (response.statusCode === 400) {
      console.log('✗ Validation error:', response.body.error);
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
 * Test 4: GET /profile again (verify update)
 */
async function testGetProfileAgain() {
  console.log('\nTest 4: GET /profile (verify update)');
  console.log('Expected: 200 OK with updated profile data');
  
  try {
    const response = await makeRequest(
      `${API_URL}/profile`,
      'GET',
      {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✓ Profile retrieved successfully');
      return response.body;
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
 * Run all tests
 */
async function runTests() {
  try {
    // Test 1: Get profile (may not exist yet)
    const existingProfile = await testGetProfile();
    
    // Test 2: Create profile if it doesn't exist
    if (!existingProfile) {
      await testCreateProfile();
    } else {
      console.log('\nSkipping Test 2 (profile already exists)');
    }
    
    // Test 3: Update profile
    await testUpdateProfile();
    
    // Test 4: Get profile again to verify update
    await testGetProfileAgain();
    
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
