// Test script to verify Cognito configuration
// Run with: node test-cognito-setup.js

const { CognitoIdentityProviderClient, DescribeUserPoolCommand, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

async function testCognitoSetup() {
  const userPoolId = 'us-east-1_N0KMxM07E';
  const clientId = '1ia9lcg1nsld42j3giuvaeeo1b';

  try {
    console.log('🔐 Testing Cognito Configuration...\n');

    // Test user pool
    console.log('1. Testing User Pool...');
    const userPoolCommand = new DescribeUserPoolCommand({ UserPoolId: userPoolId });
    const userPoolResponse = await client.send(userPoolCommand);
    
    console.log('✅ User Pool Status:', userPoolResponse.UserPool.Name);
    console.log('   - Password Policy:', userPoolResponse.UserPool.Policies.PasswordPolicy);
    console.log('   - Auto Verified:', userPoolResponse.UserPool.AutoVerifiedAttributes);
    console.log('   - Username Attributes:', userPoolResponse.UserPool.UsernameAttributes);

    // Test user pool client
    console.log('\n2. Testing User Pool Client...');
    const clientCommand = new DescribeUserPoolClientCommand({ 
      UserPoolId: userPoolId, 
      ClientId: clientId 
    });
    const clientResponse = await client.send(clientCommand);
    
    console.log('✅ Client Status:', clientResponse.UserPoolClient.ClientName);
    console.log('   - Auth Flows:', clientResponse.UserPoolClient.ExplicitAuthFlows);
    console.log('   - Identity Providers:', clientResponse.UserPoolClient.SupportedIdentityProviders);

    console.log('\n🎉 Cognito configuration test completed successfully!');
    console.log('\nConfiguration Summary:');
    console.log(`   User Pool ID: ${userPoolId}`);
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Region: us-east-1`);
    console.log(`   Test User: test@example.com`);
    console.log(`   Test Password: TestPass123!`);

  } catch (error) {
    console.error('❌ Error testing Cognito configuration:', error.message);
    process.exit(1);
  }
}

// Run the test
testCognitoSetup();