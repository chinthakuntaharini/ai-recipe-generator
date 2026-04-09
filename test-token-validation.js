const https = require('https');

// Test authentication and recipe generation
async function testTokenValidation() {
    console.log('Testing token validation...');
    
    // First, let's login to get a token
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
                    console.log('Login response status:', loginRes.statusCode);
                    console.log('Login response:', JSON.stringify(loginResponse, null, 2));
                    
                    if (loginRes.statusCode === 200 && loginResponse.tokens) {
                        // Test with ID token (which should work for API calls)
                        testRecipeGeneration(loginResponse.tokens.idToken, 'ID Token');
                        
                        // Also test with access token to see the difference
                        setTimeout(() => {
                            testRecipeGeneration(loginResponse.tokens.accessToken, 'Access Token');
                        }, 2000);
                        
                        resolve(loginResponse);
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
    console.log(`\n--- Testing Recipe Generation with ${tokenType} ---`);
    
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
            console.log(`${tokenType} - Recipe response status:`, recipeRes.statusCode);
            try {
                const recipeResponse = JSON.parse(recipeResponseData);
                console.log(`${tokenType} - Recipe response:`, JSON.stringify(recipeResponse, null, 2));
            } catch (error) {
                console.log(`${tokenType} - Raw response:`, recipeResponseData);
            }
        });
    });
    
    recipeReq.on('error', (error) => {
        console.error(`${tokenType} - Recipe request error:`, error);
    });
    
    recipeReq.write(recipeData);
    recipeReq.end();
}

// Run the test
testTokenValidation().catch(console.error);