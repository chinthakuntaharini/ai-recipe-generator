const https = require('https');

// Test the updated Bedrock service with Amazon Titan model
async function testTitanModel() {
    console.log('🧪 Testing Amazon Titan Model\n');
    
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
                        console.log('   - ID Token received\n');
                        
                        // Step 2: Test recipe generation with Amazon Titan
                        testRecipeGeneration(loginResponse.tokens.idToken)
                            .then(() => {
                                console.log('\n🎉 Test completed!');
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

function testRecipeGeneration(token) {
    return new Promise((resolve, reject) => {
        console.log('2️⃣ Testing recipe generation with Amazon Titan model...');
        
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
                console.log(`Response status: ${recipeRes.statusCode}`);
                
                try {
                    const recipeResponse = JSON.parse(recipeResponseData);
                    
                    if (recipeRes.statusCode === 200) {
                        console.log('✅ Recipe generated successfully with Amazon Titan!');
                        console.log(`   - Recipe: ${recipeResponse.title}`);
                        console.log(`   - Servings: ${recipeResponse.servings}`);
                        console.log(`   - Prep time: ${recipeResponse.prepTime} minutes`);
                        console.log(`   - Cook time: ${recipeResponse.cookTime} minutes`);
                        console.log(`   - Ingredients: ${recipeResponse.ingredients.length} items`);
                        console.log(`   - Instructions: ${recipeResponse.instructions.length} steps`);
                    } else {
                        console.log('❌ Recipe generation failed');
                        console.log(`   - Error: ${recipeResponse.error || 'Unknown error'}`);
                        
                        if (recipeResponse.error && recipeResponse.error.includes('use case details')) {
                            console.log('\n💡 Solution Options:');
                            console.log('   1. Submit Anthropic use case form in AWS Console');
                            console.log('   2. Try a different model (Amazon Titan, AI21, etc.)');
                            console.log('   3. Use a mock response for development');
                        }
                    }
                    
                    resolve(recipeResponse);
                } catch (error) {
                    console.log('❌ Response parsing failed');
                    console.log(`   - Raw response: ${recipeResponseData}`);
                    resolve({ error: 'Parse error' });
                }
            });
        });
        
        recipeReq.on('error', (error) => {
            console.error('❌ Request error:', error);
            resolve({ error: error.message });
        });
        
        recipeReq.write(recipeData);
        recipeReq.end();
    });
}

// Run the test
testTitanModel().catch(console.error);