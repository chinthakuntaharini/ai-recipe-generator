#!/usr/bin/env node

/**
 * Test script for authentication endpoints
 * This script tests the authentication handlers with real AWS Cognito
 * 
 * Usage: node test-auth-endpoints.js
 */

const { registerHandler, loginHandler, confirmEmailHandler } = require('./dist/handlers/auth-handler');

// Mock API Gateway event structure
function createEvent(body, path = '/auth/test') {
  return {
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: path,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '127393435518',
      apiId: 'test-api',
      authorizer: {},
      httpMethod: 'POST',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-script',
        userArn: null,
        clientCert: null,
      },
      path: path,
      protocol: 'HTTP/1.1',
      requestId: 'test-request-id',
      requestTime: '09/Apr/2015:12:34:56 +0000',
      requestTimeEpoch: 1428582896000,
      resourceId: 'test-resource',
      resourcePath: path,
      stage: 'test',
    },
    resource: path,
  };
}

// Mock Lambda context
const mockContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:127393435518:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

async function testRegistration() {
  console.log('🧪 Testing User Registration...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';
  
  const event = createEvent({
    email: testEmail,
    password: testPassword,
  }, '/auth/register');

  try {
    const result = await registerHandler(event, mockContext);
    const response = JSON.parse(result.body);
    
    console.log(`Status: ${result.statusCode}`);
    console.log('Response:', response);
    
    if (result.statusCode === 201) {
      console.log('✅ Registration successful!');
      console.log(`📧 Test email: ${testEmail}`);
      console.log('🔑 Check your email for confirmation code');
      return { email: testEmail, password: testPassword };
    } else {
      console.log('❌ Registration failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🧪 Testing User Login (should fail - user not confirmed)...');
  
  const event = createEvent({
    email: email,
    password: password,
  }, '/auth/login');

  try {
    const result = await loginHandler(event, mockContext);
    const response = JSON.parse(result.body);
    
    console.log(`Status: ${result.statusCode}`);
    console.log('Response:', response);
    
    if (result.statusCode === 400 && response.code === 'EMAIL_NOT_CONFIRMED') {
      console.log('✅ Login correctly failed - user not confirmed (expected)');
    } else if (result.statusCode === 200) {
      console.log('✅ Login successful! (user was already confirmed)');
    } else {
      console.log('❌ Unexpected login response');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

async function testValidation() {
  console.log('\n🧪 Testing Input Validation...');
  
  // Test invalid email
  const invalidEmailEvent = createEvent({
    email: 'invalid-email',
    password: 'TestPass123!',
  }, '/auth/register');

  try {
    const result = await registerHandler(invalidEmailEvent, mockContext);
    const response = JSON.parse(result.body);
    
    if (result.statusCode === 400 && response.code === 'INVALID_EMAIL') {
      console.log('✅ Email validation working correctly');
    } else {
      console.log('❌ Email validation failed');
    }
  } catch (error) {
    console.error('❌ Validation test error:', error.message);
  }

  // Test weak password
  const weakPasswordEvent = createEvent({
    email: 'test@example.com',
    password: 'weak',
  }, '/auth/register');

  try {
    const result = await registerHandler(weakPasswordEvent, mockContext);
    const response = JSON.parse(result.body);
    
    if (result.statusCode === 400 && response.code === 'INVALID_PASSWORD') {
      console.log('✅ Password validation working correctly');
    } else {
      console.log('❌ Password validation failed');
    }
  } catch (error) {
    console.error('❌ Password validation test error:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Authentication Endpoint Tests');
  console.log('==========================================\n');

  // Set environment variables
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.USER_POOL_ID = 'us-east-1_N0KMxM07E';
  process.env.USER_POOL_CLIENT_ID = '1ia9lcg1nsld42j3giuvaeeo1b';

  // Test validation first (doesn't require AWS calls)
  await testValidation();

  // Test registration (requires AWS Cognito)
  const userCredentials = await testRegistration();

  if (userCredentials) {
    // Test login with unconfirmed user
    await testLogin(userCredentials.email, userCredentials.password);
  }

  console.log('\n🎉 Authentication endpoint tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Check your email for confirmation code');
  console.log('2. Use the confirmation code to confirm the user');
  console.log('3. Test login with confirmed user');
  console.log('4. Deploy the API endpoints to AWS');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testRegistration,
  testLogin,
  testValidation,
  createEvent,
  mockContext,
};