const https = require('https');

// Create a test user with known credentials
async function createTestUser() {
    console.log('Creating test user...');
    
    const registerData = JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!'
    });
    
    const registerOptions = {
        hostname: 'nuz5dbksz2.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/dev/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': registerData.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const registerReq = https.request(registerOptions, (registerRes) => {
            let registerResponseData = '';
            
            registerRes.on('data', (chunk) => {
                registerResponseData += chunk;
            });
            
            registerRes.on('end', () => {
                try {
                    const registerResponse = JSON.parse(registerResponseData);
                    console.log('Register response status:', registerRes.statusCode);
                    console.log('Register response:', JSON.stringify(registerResponse, null, 2));
                    resolve(registerResponse);
                } catch (error) {
                    console.log('Raw register response:', registerResponseData);
                    reject(error);
                }
            });
        });
        
        registerReq.on('error', (error) => {
            reject(error);
        });
        
        registerReq.write(registerData);
        registerReq.end();
    });
}

// Test login with existing user using different password attempts
async function testLogin(email, password) {
    console.log(`\nTesting login with ${email}...`);
    
    const loginData = JSON.stringify({
        email: email,
        password: password
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
                    resolve(loginResponse);
                } catch (error) {
                    console.log('Raw login response:', loginResponseData);
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

// Run tests
async function runTests() {
    try {
        // Try to create a test user first
        await createTestUser();
        
        // Wait a bit then try different password combinations for existing user
        setTimeout(async () => {
            await testLogin('pvvraj1234433@gmail.com', 'Test123!');
            await testLogin('pvvraj1234433@gmail.com', 'TestPassword123!');
            await testLogin('pvvraj1234433@gmail.com', 'Password123!');
        }, 2000);
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

runTests();