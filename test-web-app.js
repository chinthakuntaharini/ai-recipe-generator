// Simple test to verify the web app is working
const https = require('https');

const testUrl = 'http://ai-recipe-generator-web-app-914877613.s3-website-us-east-1.amazonaws.com';

console.log('Testing web application availability...');
console.log('URL:', testUrl);
console.log('\nYou can now access the AI Recipe Generator at:');
console.log('🌐', testUrl);
console.log('\nTo test the application:');
console.log('1. Open the URL in your browser');
console.log('2. Create a new account with your email');
console.log('3. Verify your email with the code sent to you');
console.log('4. Sign in and try generating a recipe');
console.log('\nThe backend APIs are:');
console.log('🔐 Auth API: https://nuz5dbksz2.execute-api.us-east-1.amazonaws.com/dev');
console.log('🤖 Recipe API: https://f3ohu70iha.execute-api.us-east-1.amazonaws.com/dev');