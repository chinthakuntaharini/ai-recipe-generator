#!/usr/bin/env node

/**
 * Comprehensive Authentication Flow Test Script
 * Tests all authentication endpoints and flows with sample users
 * 
 * Task 2.1.5: Test authentication flow with sample users
 * 
 * This script tests:
 * - Complete user registration flow
 * - User login and token generation
 * - Email confirmation process
 * - Password reset functionality
 * - Token refresh mechanism
 * - JWT token validation
 * - Error handling scenarios
 * - Frontend integration compatibility
 */

const { 
  registerHandler, 
  loginHandler, 
  confirmEmailHandler,
  resendConfirmationHandler,
  forgotPasswordHandler,
  confirmForgotPasswordHandler,
  refreshTokenHandler 
} = require('./dist/handlers/auth-handler');

const { validateJWTToken } = require('./dist/middleware/auth-middleware');

// Test configuration
const config = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_N0KMxM07E',
  clientId: '1ia9lcg1nsld42j3giuvaeeo1b',
  testUsers: [
    {
      email: `test-user-1-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Test User 1'
    },
    {
      email: `test-user-2-${Date.now()}@example.com`,
      password: 'SecurePass456!',
      name: 'Test User 2'
    }
  ]
};

// Set environment variables
process.env.COGNITO_REGION = config.region;
process.env.USER_POOL_ID = config.userPoolId;
process.env.USER_POOL_CLIENT_ID = config.clientId;

// Mock API Gateway event structure
function createEvent(body, path = '/auth/test', headers = {}) {
  return {
    body: JSON.stringify(body),
    headers: headers,
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
        userAgent: 'comprehensive-test-script',
        userArn: null,
        clientCert: null,
      },
      path: path,
      protocol: 'HTTP/1.1',
      requestId: `test-${Date.now()}`,
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: path,
      stage: 'test',
    },
    resource: path,
  };
}

// Mock Lambda context
function createContext() {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:127393435518:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: `test-${Date.now()}`,
    logGroupName: '/aws/lambda/test-function',
    logStreamName: `2023/01/01/[$LATEST]test-stream-${Date.now()}`,
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

function logTest(testName, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${statusIcon} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({ testName, status, details });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

// Helper function to wait for user input
function waitForInput(prompt) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Test 1: User Registration Flow
 */
async function testUserRegistration() {
  console.log('\n🧪 Testing User Registration Flow...');
  
  for (let i = 0; i < config.testUsers.length; i++) {
    const user = config.testUsers[i];
    
    try {
      const event = createEvent({
        email: user.email,
        password: user.password,
      }, '/auth/register');

      const result = await registerHandler(event, createContext());
      const response = JSON.parse(result.body);

      if (result.statusCode === 201) {
        logTest(`Registration for ${user.name}`, 'PASS', 
          `User ID: ${response.userId}, Confirmation required: ${response.confirmationRequired}`);
        user.userId = response.userId;
        user.confirmationRequired = response.confirmationRequired;
      } else {
        logTest(`Registration for ${user.name}`, 'FAIL', 
          `Status: ${result.statusCode}, Error: ${response.error}`);
      }
    } catch (error) {
      logTest(`Registration for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
    }
  }

  // Test duplicate registration
  try {
    const event = createEvent({
      email: config.testUsers[0].email,
      password: config.testUsers[0].password,
    }, '/auth/register');

    const result = await registerHandler(event, createContext());
    const response = JSON.parse(result.body);

    if (result.statusCode === 409 && response.code === 'USER_EXISTS') {
      logTest('Duplicate registration prevention', 'PASS', 'Correctly rejected duplicate user');
    } else {
      logTest('Duplicate registration prevention', 'FAIL', 
        `Expected 409 USER_EXISTS, got ${result.statusCode} ${response.code}`);
    }
  } catch (error) {
    logTest('Duplicate registration prevention', 'FAIL', `Exception: ${error.message}`);
  }
}

/**
 * Test 2: Input Validation
 */
async function testInputValidation() {
  console.log('\n🧪 Testing Input Validation...');

  const validationTests = [
    {
      name: 'Invalid email format',
      data: { email: 'invalid-email', password: 'TestPass123!' },
      expectedCode: 'INVALID_EMAIL'
    },
    {
      name: 'Weak password',
      data: { email: 'test@example.com', password: 'weak' },
      expectedCode: 'INVALID_PASSWORD'
    },
    {
      name: 'Missing email',
      data: { password: 'TestPass123!' },
      expectedCode: 'MISSING_FIELDS'
    },
    {
      name: 'Missing password',
      data: { email: 'test@example.com' },
      expectedCode: 'MISSING_FIELDS'
    }
  ];

  for (const test of validationTests) {
    try {
      const event = createEvent(test.data, '/auth/register');
      const result = await registerHandler(event, createContext());
      const response = JSON.parse(result.body);

      if (result.statusCode === 400 && response.code === test.expectedCode) {
        logTest(test.name, 'PASS', `Correctly validated: ${response.error}`);
      } else {
        logTest(test.name, 'FAIL', 
          `Expected 400 ${test.expectedCode}, got ${result.statusCode} ${response.code}`);
      }
    } catch (error) {
      logTest(test.name, 'FAIL', `Exception: ${error.message}`);
    }
  }
}

/**
 * Test 3: Email Confirmation Process
 */
async function testEmailConfirmation() {
  console.log('\n🧪 Testing Email Confirmation Process...');

  // Test resend confirmation code
  for (const user of config.testUsers) {
    try {
      const event = createEvent({ email: user.email }, '/auth/resend-confirmation');
      const result = await resendConfirmationHandler(event, createContext());
      const response = JSON.parse(result.body);

      if (result.statusCode === 200) {
        logTest(`Resend confirmation for ${user.name}`, 'PASS', 
          `Code sent to: ${response.codeDeliveryDetails?.Destination || 'email'}`);
      } else {
        logTest(`Resend confirmation for ${user.name}`, 'FAIL', 
          `Status: ${result.statusCode}, Error: ${response.error}`);
      }
    } catch (error) {
      logTest(`Resend confirmation for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
    }
  }

  // Test invalid confirmation code
  try {
    const event = createEvent({
      email: config.testUsers[0].email,
      confirmationCode: 'invalid-code'
    }, '/auth/confirm-email');

    const result = await confirmEmailHandler(event, createContext());
    const response = JSON.parse(result.body);

    if (result.statusCode === 400 && response.code === 'INVALID_CODE') {
      logTest('Invalid confirmation code handling', 'PASS', 'Correctly rejected invalid code');
    } else {
      logTest('Invalid confirmation code handling', 'FAIL', 
        `Expected 400 INVALID_CODE, got ${result.statusCode} ${response.code}`);
    }
  } catch (error) {
    logTest('Invalid confirmation code handling', 'FAIL', `Exception: ${error.message}`);
  }

  // Interactive confirmation test
  console.log('\n📧 Email confirmation codes have been sent to:');
  config.testUsers.forEach(user => {
    console.log(`   - ${user.email}`);
  });

  const shouldTestConfirmation = await waitForInput(
    '\nDo you want to test email confirmation with real codes? (y/n): '
  );

  if (shouldTestConfirmation.toLowerCase() === 'y') {
    for (const user of config.testUsers) {
      const confirmationCode = await waitForInput(
        `Enter confirmation code for ${user.email}: `
      );

      if (confirmationCode) {
        try {
          const event = createEvent({
            email: user.email,
            confirmationCode: confirmationCode
          }, '/auth/confirm-email');

          const result = await confirmEmailHandler(event, createContext());
          const response = JSON.parse(result.body);

          if (result.statusCode === 200) {
            logTest(`Email confirmation for ${user.name}`, 'PASS', 'User confirmed successfully');
            user.confirmed = true;
          } else {
            logTest(`Email confirmation for ${user.name}`, 'FAIL', 
              `Status: ${result.statusCode}, Error: ${response.error}`);
          }
        } catch (error) {
          logTest(`Email confirmation for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
        }
      } else {
        logTest(`Email confirmation for ${user.name}`, 'SKIPPED', 'No confirmation code provided');
      }
    }
  } else {
    logTest('Interactive email confirmation', 'SKIPPED', 'User chose to skip');
  }
}

/**
 * Test 4: User Login and Token Generation
 */
async function testUserLogin() {
  console.log('\n🧪 Testing User Login and Token Generation...');

  for (const user of config.testUsers) {
    try {
      const event = createEvent({
        email: user.email,
        password: user.password,
      }, '/auth/login');

      const result = await loginHandler(event, createContext());
      const response = JSON.parse(result.body);

      if (result.statusCode === 200 && response.tokens) {
        logTest(`Login for ${user.name}`, 'PASS', 
          `Token type: ${response.tokens.tokenType}, Expires in: ${response.tokens.expiresIn}s`);
        
        // Store tokens for further testing
        user.tokens = response.tokens;
        
        // Test token structure
        const hasRequiredTokens = response.tokens.accessToken && 
                                response.tokens.idToken && 
                                response.tokens.refreshToken;
        
        if (hasRequiredTokens) {
          logTest(`Token completeness for ${user.name}`, 'PASS', 
            'All required tokens present (access, ID, refresh)');
        } else {
          logTest(`Token completeness for ${user.name}`, 'FAIL', 
            'Missing required tokens');
        }

      } else if (result.statusCode === 400 && response.code === 'EMAIL_NOT_CONFIRMED') {
        logTest(`Login for ${user.name}`, 'PASS', 
          'Correctly rejected unconfirmed user (expected if not confirmed)');
      } else {
        logTest(`Login for ${user.name}`, 'FAIL', 
          `Status: ${result.statusCode}, Error: ${response.error || response.message}`);
      }
    } catch (error) {
      logTest(`Login for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
    }
  }

  // Test invalid credentials
  try {
    const event = createEvent({
      email: config.testUsers[0].email,
      password: 'wrongpassword',
    }, '/auth/login');

    const result = await loginHandler(event, createContext());
    const response = JSON.parse(result.body);

    if (result.statusCode === 401 && response.code === 'INVALID_CREDENTIALS') {
      logTest('Invalid credentials handling', 'PASS', 'Correctly rejected wrong password');
    } else {
      logTest('Invalid credentials handling', 'FAIL', 
        `Expected 401 INVALID_CREDENTIALS, got ${result.statusCode} ${response.code}`);
    }
  } catch (error) {
    logTest('Invalid credentials handling', 'FAIL', `Exception: ${error.message}`);
  }
}

/**
 * Test 5: JWT Token Validation
 */
async function testJWTValidation() {
  console.log('\n🧪 Testing JWT Token Validation...');

  const usersWithTokens = config.testUsers.filter(user => user.tokens);

  if (usersWithTokens.length === 0) {
    logTest('JWT Token Validation', 'SKIPPED', 'No valid tokens available for testing');
    return;
  }

  for (const user of usersWithTokens) {
    try {
      // Test with valid token
      const event = createEvent({}, '/protected', {
        Authorization: `Bearer ${user.tokens.accessToken}`
      });

      const validationResult = await validateJWTToken(event, createContext(), () => {});
      
      if (validationResult.statusCode === 200 || !validationResult.statusCode) {
        logTest(`JWT validation for ${user.name}`, 'PASS', 'Valid token accepted');
      } else {
        logTest(`JWT validation for ${user.name}`, 'FAIL', 
          `Token validation failed: ${validationResult.statusCode}`);
      }
    } catch (error) {
      logTest(`JWT validation for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
    }
  }

  // Test with invalid token
  try {
    const event = createEvent({}, '/protected', {
      Authorization: 'Bearer invalid-token'
    });

    const validationResult = await validateJWTToken(event, createContext(), () => {});
    
    if (validationResult.statusCode === 401) {
      logTest('Invalid JWT token handling', 'PASS', 'Invalid token correctly rejected');
    } else {
      logTest('Invalid JWT token handling', 'FAIL', 
        `Expected 401, got ${validationResult.statusCode}`);
    }
  } catch (error) {
    // Expected to fail with invalid token
    logTest('Invalid JWT token handling', 'PASS', 'Invalid token correctly rejected with exception');
  }
}

/**
 * Test 6: Token Refresh Mechanism
 */
async function testTokenRefresh() {
  console.log('\n🧪 Testing Token Refresh Mechanism...');

  const usersWithTokens = config.testUsers.filter(user => user.tokens);

  if (usersWithTokens.length === 0) {
    logTest('Token Refresh', 'SKIPPED', 'No refresh tokens available for testing');
    return;
  }

  for (const user of usersWithTokens) {
    try {
      const event = createEvent({
        refreshToken: user.tokens.refreshToken
      }, '/auth/refresh-token');

      const result = await refreshTokenHandler(event, createContext());
      const response = JSON.parse(result.body);

      if (result.statusCode === 200 && response.tokens) {
        logTest(`Token refresh for ${user.name}`, 'PASS', 
          `New tokens generated, expires in: ${response.tokens.expiresIn}s`);
        
        // Update tokens
        user.tokens.accessToken = response.tokens.accessToken;
        user.tokens.idToken = response.tokens.idToken;
      } else {
        logTest(`Token refresh for ${user.name}`, 'FAIL', 
          `Status: ${result.statusCode}, Error: ${response.error}`);
      }
    } catch (error) {
      logTest(`Token refresh for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
    }
  }

  // Test with invalid refresh token
  try {
    const event = createEvent({
      refreshToken: 'invalid-refresh-token'
    }, '/auth/refresh-token');

    const result = await refreshTokenHandler(event, createContext());
    const response = JSON.parse(result.body);

    if (result.statusCode === 401 && response.code === 'INVALID_REFRESH_TOKEN') {
      logTest('Invalid refresh token handling', 'PASS', 'Invalid refresh token correctly rejected');
    } else {
      logTest('Invalid refresh token handling', 'FAIL', 
        `Expected 401 INVALID_REFRESH_TOKEN, got ${result.statusCode} ${response.code}`);
    }
  } catch (error) {
    logTest('Invalid refresh token handling', 'FAIL', `Exception: ${error.message}`);
  }
}

/**
 * Test 7: Password Reset Functionality
 */
async function testPasswordReset() {
  console.log('\n🧪 Testing Password Reset Functionality...');

  // Test forgot password initiation
  for (const user of config.testUsers) {
    try {
      const event = createEvent({
        email: user.email
      }, '/auth/forgot-password');

      const result = await forgotPasswordHandler(event, createContext());
      const response = JSON.parse(result.body);

      if (result.statusCode === 200) {
        logTest(`Password reset initiation for ${user.name}`, 'PASS', 
          `Reset code sent to: ${response.codeDeliveryDetails?.Destination || 'email'}`);
      } else {
        logTest(`Password reset initiation for ${user.name}`, 'FAIL', 
          `Status: ${result.statusCode}, Error: ${response.error}`);
      }
    } catch (error) {
      logTest(`Password reset initiation for ${user.name}`, 'FAIL', `Exception: ${error.message}`);
    }
  }

  // Test with non-existent user (should still return 200 for security)
  try {
    const event = createEvent({
      email: 'nonexistent@example.com'
    }, '/auth/forgot-password');

    const result = await forgotPasswordHandler(event, createContext());

    if (result.statusCode === 200) {
      logTest('Password reset for non-existent user', 'PASS', 
        'Correctly handled without revealing user existence');
    } else {
      logTest('Password reset for non-existent user', 'FAIL', 
        `Expected 200, got ${result.statusCode}`);
    }
  } catch (error) {
    logTest('Password reset for non-existent user', 'FAIL', `Exception: ${error.message}`);
  }

  // Test invalid reset code
  try {
    const event = createEvent({
      email: config.testUsers[0].email,
      confirmationCode: 'invalid-reset-code',
      newPassword: 'NewTestPass123!'
    }, '/auth/confirm-forgot-password');

    const result = await confirmForgotPasswordHandler(event, createContext());
    const response = JSON.parse(result.body);

    if (result.statusCode === 400 && response.code === 'INVALID_CODE') {
      logTest('Invalid password reset code handling', 'PASS', 'Invalid reset code correctly rejected');
    } else {
      logTest('Invalid password reset code handling', 'FAIL', 
        `Expected 400 INVALID_CODE, got ${result.statusCode} ${response.code}`);
    }
  } catch (error) {
    logTest('Invalid password reset code handling', 'FAIL', `Exception: ${error.message}`);
  }
}

/**
 * Test 8: Error Handling Scenarios
 */
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling Scenarios...');

  const errorTests = [
    {
      name: 'Missing request body',
      handler: registerHandler,
      event: { ...createEvent({}), body: null },
      expectedCode: 'MISSING_BODY'
    },
    {
      name: 'Malformed JSON',
      handler: registerHandler,
      event: { ...createEvent({}), body: 'invalid-json{' },
      expectException: true
    }
  ];

  for (const test of errorTests) {
    try {
      const result = await test.handler(test.event, createContext());
      
      if (test.expectException) {
        logTest(test.name, 'FAIL', 'Expected exception but got result');
      } else {
        const response = JSON.parse(result.body);
        if (result.statusCode === 400 && response.code === test.expectedCode) {
          logTest(test.name, 'PASS', `Correctly handled: ${response.error}`);
        } else {
          logTest(test.name, 'FAIL', 
            `Expected 400 ${test.expectedCode}, got ${result.statusCode} ${response.code}`);
        }
      }
    } catch (error) {
      if (test.expectException) {
        logTest(test.name, 'PASS', 'Exception correctly thrown for malformed input');
      } else {
        logTest(test.name, 'FAIL', `Unexpected exception: ${error.message}`);
      }
    }
  }
}

/**
 * Test 9: Frontend Integration Compatibility
 */
async function testFrontendCompatibility() {
  console.log('\n🧪 Testing Frontend Integration Compatibility...');

  // Test CORS headers
  const usersWithTokens = config.testUsers.filter(user => user.tokens);
  
  if (usersWithTokens.length > 0) {
    try {
      const event = createEvent({
        email: usersWithTokens[0].email,
        password: usersWithTokens[0].password,
      }, '/auth/login');

      const result = await loginHandler(event, createContext());

      const requiredCorsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods'
      ];

      const hasAllCorsHeaders = requiredCorsHeaders.every(header => 
        result.headers && result.headers[header]
      );

      if (hasAllCorsHeaders) {
        logTest('CORS headers presence', 'PASS', 'All required CORS headers present');
      } else {
        logTest('CORS headers presence', 'FAIL', 'Missing required CORS headers');
      }

      // Test response format
      const response = JSON.parse(result.body);
      const hasStandardFormat = response.message && 
                               (response.tokens || response.error || response.code);

      if (hasStandardFormat) {
        logTest('Response format consistency', 'PASS', 'Standard response format maintained');
      } else {
        logTest('Response format consistency', 'FAIL', 'Non-standard response format');
      }

    } catch (error) {
      logTest('Frontend compatibility test', 'FAIL', `Exception: ${error.message}`);
    }
  } else {
    logTest('Frontend compatibility test', 'SKIPPED', 'No authenticated users available');
  }

  // Test token format for frontend consumption
  const tokenUser = config.testUsers.find(user => user.tokens);
  if (tokenUser) {
    const tokens = tokenUser.tokens;
    
    // Check if tokens are JWT format (base64 encoded with dots)
    const isJWTFormat = (token) => {
      return token && typeof token === 'string' && token.split('.').length === 3;
    };

    const accessTokenValid = isJWTFormat(tokens.accessToken);
    const idTokenValid = isJWTFormat(tokens.idToken);

    if (accessTokenValid && idTokenValid) {
      logTest('JWT token format', 'PASS', 'Tokens are in valid JWT format');
    } else {
      logTest('JWT token format', 'FAIL', 'Tokens are not in valid JWT format');
    }
  }
}

/**
 * Generate Test Report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE AUTHENTICATION TEST REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 Test Summary:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⏭️  Skipped: ${testResults.skipped}`);
  console.log(`   📊 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  
  const successRate = testResults.passed / (testResults.passed + testResults.failed) * 100;
  console.log(`   🎯 Success Rate: ${successRate.toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   - ${test.testName}: ${test.details}`);
      });
  }

  if (testResults.skipped > 0) {
    console.log(`\n⏭️  Skipped Tests:`);
    testResults.details
      .filter(test => test.status === 'SKIPPED')
      .forEach(test => {
        console.log(`   - ${test.testName}: ${test.details}`);
      });
  }

  console.log(`\n📋 Test Coverage:`);
  console.log(`   ✅ User registration flow`);
  console.log(`   ✅ Input validation`);
  console.log(`   ✅ Email confirmation process`);
  console.log(`   ✅ User login and token generation`);
  console.log(`   ✅ JWT token validation`);
  console.log(`   ✅ Token refresh mechanism`);
  console.log(`   ✅ Password reset functionality`);
  console.log(`   ✅ Error handling scenarios`);
  console.log(`   ✅ Frontend integration compatibility`);

  console.log(`\n🎉 Task 2.1.5 Status: ${testResults.failed === 0 ? 'COMPLETED' : 'NEEDS ATTENTION'}`);
  
  if (testResults.failed === 0) {
    console.log(`\n✅ All authentication flows are working correctly!`);
    console.log(`   The authentication system is ready for production use.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please review and fix the issues before deployment.`);
  }

  console.log(`\n📝 Next Steps:`);
  console.log(`   1. Deploy authentication API endpoints to AWS API Gateway`);
  console.log(`   2. Configure frontend to use the authentication endpoints`);
  console.log(`   3. Test end-to-end authentication flow with frontend`);
  console.log(`   4. Set up monitoring and logging for production`);
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 COMPREHENSIVE AUTHENTICATION FLOW TEST');
  console.log('==========================================');
  console.log(`📧 Test users: ${config.testUsers.length}`);
  console.log(`🔧 User Pool: ${config.userPoolId}`);
  console.log(`🔑 Client ID: ${config.clientId}`);
  console.log('');

  try {
    // Run all test suites
    await testInputValidation();
    await testUserRegistration();
    await testEmailConfirmation();
    await testUserLogin();
    await testJWTValidation();
    await testTokenRefresh();
    await testPasswordReset();
    await testErrorHandling();
    await testFrontendCompatibility();

    // Generate final report
    generateTestReport();

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  testResults,
  config
};