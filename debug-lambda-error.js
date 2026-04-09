const https = require('https');

// Debug the Lambda function error
async function debugLambdaError() {
    console.log('🔍 Debugging Lambda Function Error\n');
    
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
                        
                        // Step 2: Test with minimal request
                        testMinimalRequest(loginResponse.tokens.idToken)
                            .then(() => {
                                console.log('\n🔍 Debugging Complete');
                                resolve();
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

function testMinimalRequest(token) {
    return new Promise((resolve) => {
        console.log('\n2️⃣ Testing with minimal request...');
        
        // Very simple request
        const recipeData = JSON.stringify({
            ingredients: ['chicken'],
            servings: 2
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
                console.log(`   Response headers:`, recipeRes.headers);
                
                try {
                    const recipeResponse = JSON.parse(recipeResponseData);
                    console.log('   Parsed response:', JSON.stringify(recipeResponse, null, 2));
                    
                    if (recipeRes.statusCode === 200) {
                        console.log('✅ Success! Titan model is working');
                    } else if (recipeRes.statusCode === 502) {
                        console.log('❌ 502 Bad Gateway - Lambda function error');
                        console.log('   This usually means:');
                        console.log('   • Lambda function crashed');
                        console.log('   • Timeout occurred');
                        console.log('   • IAM permission denied');
                        console.log('   • Invalid response format');
                    } else if (recipeRes.statusCode === 403) {
                        console.log('❌ 403 Forbidden - IAM permission issue');
                        console.log('   Need to update IAM role for Titan model access');
                    } else {
                        console.log(`❌ Unexpected status: ${recipeRes.statusCode}`);
                    }
                } catch (error) {
                    console.log('❌ Response parsing failed');
                    console.log(`   Raw response: ${recipeResponseData}`);
                    
                    if (recipeResponseData.includes('Internal server error')) {
                        console.log('   This is a Lambda function internal error');
                    } else if (recipeResponseData.includes('AccessDenied')) {
                        console.log('   This is an IAM permission error');
                    } else if (recipeResponseData.includes('ValidationException')) {
                        console.log('   This is a Bedrock model validation error');
                    }
                }
                
                console.log('\n💡 Recommended Actions:');
                if (recipeRes.statusCode === 502) {
                    console.log('1. Check CloudWatch logs for the Lambda function');
                    console.log('2. Verify the Bedrock service code was deployed correctly');
                    console.log('3. Test with a simpler Bedrock model request');
                    console.log('4. Update IAM permissions for Titan model');
                } else if (recipeRes.statusCode === 403) {
                    console.log('1. Update CloudFormation stack with Titan IAM permissions');
                    console.log('2. Verify Bedrock service is enabled in your region');
                } else {
                    console.log('1. Check the specific error message above');
                    console.log('2. Verify Lambda function configuration');
                }
                
                resolve();
            });
        });
        
        recipeReq.on('error', (error) => {
            console.error('❌ Request error:', error);
            resolve();
        });
        
        recipeReq.write(recipeData);
        recipeReq.end();
    });
}

// Run the debug
debugLambdaError().catch(console.error);