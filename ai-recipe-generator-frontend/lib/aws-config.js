import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH',
    // Optimized token settings for frontend integration
    cookieStorage: {
      domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      path: '/',
      expires: 365,
      sameSite: 'strict',
      secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false
    },
    // Token refresh configuration
    oauth: {
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      redirectSignOut: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      responseType: 'code'
    }
  },
  API: {
    endpoints: [
      {
        name: 'RecipeAPI',
        endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        custom_header: async () => {
          // Automatically include auth token in API requests
          try {
            const { Auth } = await import('aws-amplify');
            const session = await Auth.currentSession();
            return {
              Authorization: `Bearer ${session.getIdToken().getJwtToken()}`
            };
          } catch (error) {
            console.warn('No active session for API request');
            return {};
          }
        }
      }
    ]
  }
};

// Configure Amplify with error handling
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(awsConfig);
    console.log('Amplify configured successfully for frontend integration');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

export default awsConfig;