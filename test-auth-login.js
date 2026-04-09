const https = require('https');

async function testLogin() {
    const email = 'pvvraj1234433@gmail.com';
    const password = 'your-password-here'; // You'll need to replace this
    
    const postData = JSON.stringify({
        email: email,
        password: password
    });
    
    const options = {
        hostname: 'nuz5dbksz2.execute-api.us-east-1.amazonaws.com',
        port: 443,
        path: '/dev/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                console.log('Response Headers:', res.headers);
                console.log('Response Body:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
                } catch (e) {
                    console.log('Failed to parse JSON:', e.message);
                }
                
                resolve(data);
            });
        });
        
        req.on('error', (e) => {
            console.error('Request error:', e);
            reject(e);
        });
        
        req.write(postData);
        req.end();
    });
}

console.log('Testing authentication API...');
console.log('Note: You need to replace the password with your actual password');
// testLogin().catch(console.error);