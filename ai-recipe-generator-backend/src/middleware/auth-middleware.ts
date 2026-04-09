import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import https from 'https';
import jwkToPem from 'jwk-to-pem';

// Configuration for Cognito JWT validation
const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_N0KMxM07E';
const JWKS_URI = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;

// Cache for JWKS keys
let jwksCache: any = null;
let jwksCacheExpiry = 0;

/**
 * Interface for decoded JWT token payload
 */
export interface CognitoUser {
  sub: string;
  username?: string;
  'cognito:username'?: string;
  email?: string;
  email_verified?: boolean;
  aud: string;
  iss: string;
  token_use: 'access' | 'id';
  exp: number;
  iat: number;
  auth_time: number;
}

/**
 * Extended API Gateway event with authenticated user context
 */
export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: CognitoUser;
}

/**
 * Lambda handler type with authentication
 */
export type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

/**
 * Error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Fetch JWKS from Cognito
 */
async function fetchJwks(): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = https.get(JWKS_URI, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jwks = JSON.parse(data);
          resolve(jwks);
        } catch (error) {
          reject(new Error('Failed to parse JWKS response'));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('JWKS request timeout'));
    });
  });
}

/**
 * Get JWKS with caching
 */
async function getJwks(): Promise<any> {
  const now = Date.now();
  
  // Return cached JWKS if still valid (cache for 10 minutes)
  if (jwksCache && now < jwksCacheExpiry) {
    return jwksCache;
  }
  
  try {
    const jwks = await fetchJwks();
    jwksCache = jwks;
    jwksCacheExpiry = now + (10 * 60 * 1000); // 10 minutes
    return jwks;
  } catch (error) {
    console.error('Failed to fetch JWKS:', error);
    throw new AuthenticationError('Unable to fetch signing keys');
  }
}

/**
 * Get signing key from JWKS endpoint
 */
async function getSigningKey(kid: string): Promise<string> {
  try {
    const jwks = await getJwks();
    
    if (!jwks.keys || !Array.isArray(jwks.keys)) {
      throw new Error('Invalid JWKS format');
    }
    
    const key = jwks.keys.find((k: any) => k.kid === kid);
    if (!key) {
      throw new Error(`Unable to find key with kid: ${kid}`);
    }
    
    if (key.kty !== 'RSA') {
      throw new Error('Only RSA keys are supported');
    }
    
    return jwkToPem(key);
  } catch (error) {
    console.error('Error retrieving signing key:', error);
    throw new AuthenticationError('Unable to retrieve signing key');
  }
}

/**
 * Validate JWT token against Cognito user pool
 */
export async function validateJwtToken(token: string): Promise<CognitoUser> {
  try {
    // Decode token header to get key ID
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new AuthenticationError('Invalid token format');
    }

    // Also decode payload to check token_use for audience validation
    const payload = decodedHeader.payload as any;

    // Get the signing key
    const signingKey = await getSigningKey(decodedHeader.header.kid);

    // Verify and decode the token
    const decoded = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      // Don't validate audience for ID tokens as they have the client ID as audience
      ...(payload?.token_use !== 'id' && { audience: process.env.COGNITO_USER_POOL_CLIENT_ID }),
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}`,
    }) as CognitoUser;

    // Validate token use (should be 'access' or 'id')
    if (!decoded.token_use || !['access', 'id'].includes(decoded.token_use)) {
      throw new AuthenticationError('Invalid token use');
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      throw new AuthenticationError('Token has expired');
    }

    // Validate required fields
    if (!decoded.sub) {
      throw new AuthenticationError('Token missing required fields');
    }

    // Get username from either username or cognito:username field
    const username = decoded.username || decoded['cognito:username'];
    if (!username && decoded.token_use === 'access') {
      throw new AuthenticationError('Token missing username field');
    }

    // Add username to the decoded token for consistency
    if (username && !decoded.username) {
      decoded.username = username;
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError(`Invalid token: ${error.message}`);
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    
    console.error('JWT validation error:', error);
    throw new AuthenticationError('Token validation failed');
  }
}

/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeader(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new AuthenticationError('Missing Authorization header');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthenticationError('Invalid Authorization header format. Expected: Bearer <token>');
  }

  return parts[1];
}

/**
 * Create error response for authentication failures
 */
function createErrorResponse(error: AuthenticationError): APIGatewayProxyResult {
  return {
    statusCode: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({
      error: error.message,
      type: 'AuthenticationError',
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * JWT authentication middleware for Lambda functions
 * 
 * Usage:
 * export const handler = withAuth(async (event: AuthenticatedEvent, context: Context) => {
 *   // Access authenticated user via event.user
 *   const userId = event.user.sub;
 *   // ... your handler logic
 * });
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
      // Extract and validate JWT token
      const token = extractTokenFromHeader(event);
      const user = await validateJwtToken(token);

      // Add user to event context
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user,
      };

      // Log authentication success (without sensitive data)
      console.log('Authentication successful', {
        userId: user.sub,
        username: user.username || user['cognito:username'],
        tokenUse: user.token_use,
        requestId: context.awsRequestId,
      });

      // Call the original handler with authenticated event
      return await handler(authenticatedEvent, context);
    } catch (error) {
      // Log authentication failure
      console.error('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.awsRequestId,
        userAgent: event.headers['User-Agent'],
        sourceIp: event.requestContext.identity.sourceIp,
      });

      if (error instanceof AuthenticationError) {
        return createErrorResponse(error);
      }

      // Handle unexpected errors
      return createErrorResponse(new AuthenticationError('Internal authentication error', 500));
    }
  };
}

/**
 * Utility function to check if user has specific permissions
 * Can be extended based on user groups or custom attributes
 */
export function hasPermission(user: CognitoUser, permission: string): boolean {
  // Basic implementation - can be extended with Cognito groups
  // For now, all authenticated users have basic permissions
  const basicPermissions = ['read:recipes', 'write:recipes', 'delete:own_recipes'];
  return basicPermissions.includes(permission);
}

/**
 * Middleware for role-based access control
 */
export function withPermission(permission: string) {
  return function (handler: AuthenticatedHandler): AuthenticatedHandler {
    return async (event: AuthenticatedEvent, context: Context): Promise<APIGatewayProxyResult> => {
      if (!hasPermission(event.user, permission)) {
        return createErrorResponse(new AuthenticationError('Insufficient permissions', 403));
      }
      return await handler(event, context);
    };
  };
}

/**
 * Health check function for authentication middleware
 */
export async function healthCheck(): Promise<{ status: string; jwksUri: string; timestamp: string }> {
  return {
    status: 'healthy',
    jwksUri: JWKS_URI,
    timestamp: new Date().toISOString(),
  };
}