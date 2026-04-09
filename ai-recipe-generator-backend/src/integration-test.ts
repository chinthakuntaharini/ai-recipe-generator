/**
 * Integration test for JWT middleware with actual Cognito tokens
 * This script can be used to test the middleware with real tokens
 */

import { validateJwtToken, healthCheck } from './middleware/auth-middleware';

async function testMiddleware(): Promise<void> {
  console.log('🧪 Testing JWT Middleware Integration');
  console.log('=====================================');

  // Test health check
  try {
    console.log('\n1. Testing health check...');
    const health = await healthCheck();
    console.log('✅ Health check passed:', health);
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  // Test with sample token (this will fail as expected since it's not a real token)
  try {
    console.log('\n2. Testing with invalid token (expected to fail)...');
    await validateJwtToken('invalid.jwt.token');
    console.log('❌ This should not succeed');
  } catch (error) {
    console.log('✅ Invalid token correctly rejected:', error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('\n📝 To test with a real token:');
  console.log('1. Get a token from the frontend authentication');
  console.log('2. Replace the token in this script');
  console.log('3. Run: npm run test:integration');
  
  console.log('\n🔧 Environment Configuration:');
  console.log('COGNITO_REGION:', process.env.COGNITO_REGION || 'us-east-1');
  console.log('USER_POOL_ID:', process.env.USER_POOL_ID || 'us-east-1_N0KMxM07E');
  console.log('USER_POOL_CLIENT_ID:', process.env.USER_POOL_CLIENT_ID || '1ia9lcg1nsld42j3giuvaeeo1b');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMiddleware().catch(console.error);
}

export { testMiddleware };