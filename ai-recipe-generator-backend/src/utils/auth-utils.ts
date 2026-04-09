import { CognitoUser } from '../middleware/auth-middleware';

/**
 * Utility functions for authentication and authorization
 */

/**
 * Extract user ID from authenticated user
 */
export function getUserId(user: CognitoUser): string {
  return user.sub;
}

/**
 * Extract username from authenticated user
 */
export function getUsername(user: CognitoUser): string {
  return user.username || user['cognito:username'] || '';
}

/**
 * Extract email from authenticated user
 */
export function getUserEmail(user: CognitoUser): string {
  return user.email || '';
}

/**
 * Check if user's email is verified
 */
export function isEmailVerified(user: CognitoUser): boolean {
  return user.email_verified === true;
}

/**
 * Check if token is an access token
 */
export function isAccessToken(user: CognitoUser): boolean {
  return user.token_use === 'access';
}

/**
 * Check if token is an ID token
 */
export function isIdToken(user: CognitoUser): boolean {
  return user.token_use === 'id';
}

/**
 * Get token expiration time as Date object
 */
export function getTokenExpiration(user: CognitoUser): Date {
  return new Date(user.exp * 1000);
}

/**
 * Get token issued time as Date object
 */
export function getTokenIssuedAt(user: CognitoUser): Date {
  return new Date(user.iat * 1000);
}

/**
 * Check if token will expire within specified minutes
 */
export function willExpireSoon(user: CognitoUser, minutes: number = 5): boolean {
  const expirationTime = getTokenExpiration(user);
  const warningTime = new Date(Date.now() + (minutes * 60 * 1000));
  return expirationTime <= warningTime;
}

/**
 * Get user context for logging (without sensitive information)
 */
export function getUserContext(user: CognitoUser): {
  userId: string;
  username: string;
  email: string;
  tokenType: string;
  emailVerified: boolean;
} {
  return {
    userId: user.sub,
    username: user.username || user['cognito:username'] || '',
    email: user.email || '',
    tokenType: user.token_use,
    emailVerified: user.email_verified || false,
  };
}

/**
 * Create a sanitized user object for API responses
 */
export function sanitizeUserForResponse(user: CognitoUser): {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
} {
  return {
    id: user.sub,
    username: user.username || user['cognito:username'] || '',
    email: user.email || '',
    emailVerified: user.email_verified || false,
  };
}

/**
 * Validate that user owns a resource (basic ownership check)
 */
export function validateResourceOwnership(user: CognitoUser, resourceUserId: string): boolean {
  return user.sub === resourceUserId;
}

/**
 * Create audit log entry for user actions
 */
export function createAuditLog(
  user: CognitoUser,
  action: string,
  resource: string,
  details?: Record<string, any>
): {
  userId: string;
  username: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: Record<string, any>;
} {
  return {
    userId: user.sub,
    username: user.username || user['cognito:username'] || '',
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };
}