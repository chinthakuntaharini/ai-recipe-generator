import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { withAuth, AuthenticatedEvent, withPermission } from '../middleware/auth-middleware';

/**
 * Example protected Lambda handler that requires authentication
 * This demonstrates how to use the auth middleware
 */
async function protectedHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    // Access authenticated user information
    const { user } = event;
    
    console.log('Processing request for authenticated user', {
      userId: user.sub,
      username: user.username,
      email: user.email,
      requestId: context.awsRequestId,
    });

    // Example business logic
    const response = {
      message: 'Successfully accessed protected resource',
      user: {
        id: user.sub,
        username: user.username,
        email: user.email,
        tokenType: user.token_use,
      },
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in protected handler:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      }),
    };
  }
}

/**
 * Example handler with permission-based access control
 */
async function adminHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const response = {
    message: 'Admin access granted',
    user: event.user.username,
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  };
}

// Export handlers with authentication middleware
export const handler = withAuth(protectedHandler);

// Export handler with both authentication and permission check
// Note: This will return 403 for regular users since 'admin:all' is not a basic permission
export const adminOnlyHandler = withAuth(withPermission('admin:all')(adminHandler));

// Export handler with basic permission that all authenticated users have
export const readRecipesHandler = withAuth(withPermission('read:recipes')(protectedHandler));