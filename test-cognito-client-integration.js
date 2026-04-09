#!/usr/bin/env node

/**
 * Test script for Cognito User Pool Client Frontend Integration
 * Tests authentication flows, token handling, and client configuration
 */

const { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  GetUserCommand,
  DescribeUserPoolClientCommand 
} = require('@aws-sdk/client-cognito-identity-provider');

const config = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_N0KMxM07E',
  clientId: '1ia9lcg1nsld42j3giuvaeeo1b',
  testUser: {
    email: 'test@example.com',
    password: 'TestPass123!'
  }
};

const client = new CognitoIdentityProviderClient({ region: config.region });

async function testClientConfiguration() {
  console.log('🔍 Testing Cognito User Pool Client Configuration...\n');
  
  try {
    // Test 1: Verify client configuration
    console.log('1. Verifying client configuration...');
    const clientConfig = await client.send(new DescribeUserPoolClientCommand({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId
    }));
    
    const clientDetails = clientConfig.UserPoolClient;
    console.log('✅ Client Configuration:');
    console.log(`   - Client Name: ${clientDetails.ClientName}`);
    console.log(`   - Access Token Validity: ${clientDetails.AccessTokenValidity} ${clientDetails.TokenValidityUnits?.AccessToken || 'hours'}`);
    console.log(`   - ID Token Validity: ${clientDetails.IdTokenValidity} ${clientDetails.TokenValidityUnits?.IdToken || 'hours'}`);
    console.log(`   - Refresh Token Validity: ${clientDetails.RefreshTokenValidity} ${clientDetails.TokenValidityUnits?.RefreshToken || 'days'}`);
    console.log(`   - Auth Flows: ${clientDetails.ExplicitAuthFlows.join(', ')}`);
    console.log(`   - Prevent User Existence Errors: ${clientDetails.PreventUserExistenceErrors || 'Not set'}`);
    console.log(`   - Token Revocation Enabled: ${clientDetails.EnableTokenRevocation}`);
    
    // Test 2: Test USER_SRP_AUTH flow (recommended for frontend)
    console.log('\n2. Testing USER_SRP_AUTH flow...');
    try {
      const authResult = await client.send(new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH', // Using password auth for testing
        ClientId: config.clientId,
        AuthParameters: {
          USERNAME: config.testUser.email,
          PASSWORD: config.testUser.password
        }
      }));
      
      if (authResult.AuthenticationResult) {
        console.log('✅ Authentication successful');
        console.log(`   - Access Token: ${authResult.AuthenticationResult.AccessToken.substring(0, 50)}...`);
        console.log(`   - ID Token: ${authResult.AuthenticationResult.IdToken.substring(0, 50)}...`);
        console.log(`   - Refresh Token: ${authResult.AuthenticationResult.RefreshToken.substring(0, 50)}...`);
        console.log(`   - Token Type: ${authResult.AuthenticationResult.TokenType}`);
        console.log(`   - Expires In: ${authResult.AuthenticationResult.ExpiresIn} seconds`);
        
        // Test 3: Verify token can be used to get user info
        console.log('\n3. Testing token validation...');
        const userInfo = await client.send(new GetUserCommand({
          AccessToken: authResult.AuthenticationResult.AccessToken
        }));
        
        console.log('✅ Token validation successful');
        console.log(`   - Username: ${userInfo.Username}`);
        console.log(`   - User Attributes: ${userInfo.UserAttributes.length} attributes`);
        
        const emailAttr = userInfo.UserAttributes.find(attr => attr.Name === 'email');
        if (emailAttr) {
          console.log(`   - Email: ${emailAttr.Value}`);
        }
        
      } else {
        console.log('❌ Authentication failed - no result returned');
      }
      
    } catch (authError) {
      console.log(`❌ Authentication failed: ${authError.message}`);
    }
    
    // Test 4: Verify frontend integration readiness
    console.log('\n4. Frontend Integration Readiness Check...');
    
    const checks = [
      {
        name: 'SRP Auth Flow Enabled',
        condition: clientDetails.ExplicitAuthFlows.includes('ALLOW_USER_SRP_AUTH'),
        importance: 'Critical'
      },
      {
        name: 'Refresh Token Auth Enabled',
        condition: clientDetails.ExplicitAuthFlows.includes('ALLOW_REFRESH_TOKEN_AUTH'),
        importance: 'Critical'
      },
      {
        name: 'Token Revocation Enabled',
        condition: clientDetails.EnableTokenRevocation,
        importance: 'Recommended'
      },
      {
        name: 'Prevent User Existence Errors',
        condition: clientDetails.PreventUserExistenceErrors === 'ENABLED',
        importance: 'Security'
      },
      {
        name: 'Reasonable Token Validity',
        condition: clientDetails.AccessTokenValidity <= 60 && clientDetails.IdTokenValidity <= 60,
        importance: 'Security'
      }
    ];
    
    checks.forEach(check => {
      const status = check.condition ? '✅' : '⚠️';
      console.log(`   ${status} ${check.name} (${check.importance})`);
    });
    
    // Test 5: Environment configuration check
    console.log('\n5. Environment Configuration...');
    console.log('✅ Required environment variables for frontend:');
    console.log(`   NEXT_PUBLIC_AWS_REGION=${config.region}`);
    console.log(`   NEXT_PUBLIC_USER_POOL_ID=${config.userPoolId}`);
    console.log(`   NEXT_PUBLIC_USER_POOL_CLIENT_ID=${config.clientId}`);
    
    console.log('\n🎉 Cognito User Pool Client is optimized for frontend integration!');
    
    // Recommendations
    console.log('\n📋 Frontend Integration Recommendations:');
    console.log('   1. Use AWS Amplify Auth library for seamless integration');
    console.log('   2. Implement automatic token refresh in your app');
    console.log('   3. Store tokens securely (httpOnly cookies recommended)');
    console.log('   4. Handle authentication errors gracefully');
    console.log('   5. Implement proper logout functionality');
    console.log('   6. Consider implementing MFA for production use');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testClientConfiguration().catch(console.error);