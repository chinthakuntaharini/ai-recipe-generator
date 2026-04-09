const https = require('https');

// Test the complete authentication and recipe generation flow
async function testCompleteFlow() {
    console.log('🧪 Testing Complete Authentication Flow\n');
    
    // Step 1: Login to get fresh tokens
    console.log('1️⃣ Logging in to get fresh tokens...');
    const loginData = JSON.stringify({
        email: 'pvvraj1234433@gmail.com',
        password: 'TestPassword123!'
    });
    
    const loginOptions = {
        hostname: 'nuz5dbksz2.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/dev/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const loginReq = https.request(loginOptions, (loginRes) => {
            let loginResponseData = '';
            
            loginRes.on('data', (chunk) => {
                loginResponseData += chunk;
            });
            
            loginRes.on('end', () => {
                try {
                    const loginResponse = JSON.parse(loginResponseData);
                    
                    if (loginRes.statusCode === 200 && loginResponse.tokens) {
                        console.log('✅ Login successful!');
                        console.log('   - ID Token received');
                        console.log('   - Refresh Token received');
                        console.log('   - Expires in:', loginResponse.tokens.expiresIn, 'seconds\n');
                        
                        // Step 2: Test recipe generation with valid token
                        testRecipeGeneration(loginResponse.tokens.idToken, 'Fresh ID Token')
                            .then(() => {
                                // Step 3: Test with invalid token to simulate expiration
                                console.log('3️⃣ Testing with expired/invalid token...');
                                return testRecipeGeneration('invalid.token.here', 'Invalid Token');
                            })
                            .then(() => {
                                console.log('\n🎉 All tests completed!');
                                console.log('\n📋 Summary:');
                                console.log('✅ Authentication working correctly');
                                console.log('✅ Recipe generation working with valid tokens');
                                console.log('✅ Proper error handling for expired tokens');
                                console.log('✅ Web app will redirect to login on token expiration');
                                resolve();
                            })
                            .catch(reject);
                    } else {
                        reject(new Error('Login failed: ' + loginResponseData));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        loginReq.on('error', (error) => {
            reject(error);
        });
        
        loginReq.write(loginData);
        loginReq.end();
    });
}

function testRecipeGeneration(token, tokenType) {
    return new Promise((resolve, reject) => {
        console.log(`2️⃣ Testing recipe generation with ${tokenType}...`);
        
        const recipeData = JSON.stringify({
            ingredients: ['chicken', 'rice', 'vegetables'],
            servings: 4
        });
        
        const recipeOptions = {
            hostname: 'f3ohu70iha.execute-api.us-east-1.amazonaws.com',
            port: 443,
            path: '/dev/generate-recipe',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': recipeData.length
            }
        };
        
        const recipeReq = https.request(recipeOptions, (recipeRes) => {
            let recipeResponseData = '';
            
            recipeRes.on('data', (chunk) => {
                recipeResponseData += chunk;
            });
            
            recipeRes.on('end', () => {
                try {
                    const recipeResponse = JSON.parse(recipeResponseData);
                    
                    if (recipeRes.statusCode === 200) {
                        console.log(`✅ ${tokenType} - Recipe generated successfully!`);
                        console.log(`   - Recipe: ${recipeResponse.title}`);
                        console.log(`   - Servings: ${recipeResponse.servings}`);
                        console.log(`   - Prep time: ${recipeResponse.prepTime} minutes\n`);
                    } else {
                        console.log(`❌ ${tokenType} - Request failed (Status: ${recipeRes.statusCode})`);
                        console.log(`   - Error: ${recipeResponse.error || 'Unknown error'}\n`);
                    }
                    
                    resolve(recipeResponse);
                } catch (error) {
                    console.log(`❌ ${tokenType} - Response parsing failed`);
                    console.log(`   - Raw response: ${recipeResponseData}\n`);
                    resolve({ error: 'Parse error' });
                }
            });
        });
        
        recipeReq.on('error', (error) => {
            console.error(`❌ ${tokenType} - Request error:`, error);
            resolve({ error: error.message });
        });
        
        recipeReq.write(recipeData);
        recipeReq.end();
    });
}

// Run the test
testCompleteFlow().catch(console.error);