const https = require('https');

// Test the Titan model deployment
async function testTitanDeployment() {
    console.log('🧪 Testing Amazon Titan Model Deployment\n');
    
    // Step 1: Login to get fresh tokens
    console.log('1️⃣ Getting authentication token...');
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
                        console.log('✅ Authentication successful!');
                        console.log('   - Token obtained\n');
                        
                        // Step 2: Test recipe generation
                        testRecipeGeneration(loginResponse.tokens.idToken)
                            .then((result) => {
                                console.log('\n📊 Test Results Summary:');
                                if (result.success) {
                                    console.log('✅ Amazon Titan model is working!');
                                    console.log('✅ Recipe generation successful');
                                    console.log('✅ Authentication working');
                                    console.log('✅ API endpoints responding');
                                } else {
                                    console.log('❌ Issues detected:');
                                    console.log(`   - ${result.error}`);
                                    
                                    if (result.error.includes('use case details')) {
                                        console.log('\n💡 Next Steps:');
                                        console.log('   1. The Lambda function still has Claude model code');
                                        console.log('   2. Deploy the updated Titan model code');
                                        console.log('   3. Update IAM permissions for Titan model');
                                    } else if (result.error.includes('AccessDenied')) {
                                        console.log('\n💡 Next Steps:');
                                        console.log('   1. Update IAM role to include Titan model permissions');
                                        console.log('   2. Redeploy CloudFormation stack');
                                    } else {
                                        console.log('\n💡 Next Steps:');
                                        console.log('   1. Check Lambda function logs');
                                        console.log('   2. Verify Bedrock service configuration');
                                        console.log('   3. Test with different model if needed');
                                    }
                                }
                                resolve(result);
                            })
                            .catch(reject);
                    } else {
                        reject(new Error('Authentication failed: ' + loginResponseData));
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
    return new Promise((resolve) => {
        console.log('2️⃣ Testing recipe generation with current deployment...');
        
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
                console.log(`   Response status: ${recipeRes.statusCode}`);
                
                try {
                    const recipeResponse = JSON.parse(recipeResponseData);
                    
                    if (recipeRes.statusCode === 200) {
                        console.log('✅ Recipe generated successfully!');
                        console.log(`   - Recipe: ${recipeResponse.title}`);
                        console.log(`   - Servings: ${recipeResponse.servings}`);
                        console.log(`   - Prep time: ${recipeResponse.prepTime} minutes`);
                        resolve({ success: true, data: recipeResponse });
                    } else {
                        console.log('❌ Recipe generation failed');
                        console.log(`   - Error: ${recipeResponse.error || 'Unknown error'}`);
                        resolve({ success: false, error: recipeResponse.error || 'Unknown error' });
                    }
                } catch (error) {
                    console.log('❌ Response parsing failed');
                    console.log(`   - Raw response: ${recipeResponseData}`);
                    resolve({ success: false, error: 'Parse error: ' + recipeResponseData });
                }
            });
        });
        
        recipeReq.on('error', (error) => {
            console.error('❌ Request error:', error);
            resolve({ success: false, error: error.message });
        });
        
        recipeReq.write(recipeData);
        recipeReq.end();
    });
}

// Run the test
testTitanDeployment().catch(console.error);