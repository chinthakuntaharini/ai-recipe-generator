import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Initialize Cognito client
const cognito = new CognitoIdentityServiceProvider({
  region: process.env.COGNITO_REGION || 'us-east-1',
});

// Configuration
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_N0KMxM07E';
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '1ia9lcg1nsld42j3giuvaeeo1b';

/**
 * Interface for user registration request
 */
interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

/**
 * Interface for user login request
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for email confirmation request
 */
interface ConfirmEmailRequest {
  email: string;
  confirmationCode: string;
}

/**
 * Interface for password reset request
 */
interface ResetPasswordRequest {
  email: string;
}

/**
 * Interface for confirm password reset request
 */
interface ConfirmResetPasswordRequest {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

/**
 * Create standardized API response
 */
function createResponse(
  statusCode: number,
  body: any,
  additionalHeaders: Record<string, string> = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...additionalHeaders,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * User Registration Handler
 * POST /auth/register
 */
export async function registerHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Registration request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { email, password, username }: RegisterRequest = JSON.parse(event.body);

    // Validate required fields
    if (!email || !password) {
      return createResponse(400, {
        error: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createResponse(400, {
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return createResponse(400, {
        error: passwordValidation.message,
        code: 'INVALID_PASSWORD',
      });
    }

    // Prepare user attributes
    const userAttributes = [
      {
        Name: 'email',
        Value: email,
      },
    ];

    // Add username if provided, otherwise use email
    const finalUsername = username || email;

    // Register user with Cognito
    const signUpParams = {
      ClientId: CLIENT_ID,
      Username: finalUsername,
      Password: password,
      UserAttributes: userAttributes,
    };

    const result = await cognito.signUp(signUpParams).promise();

    console.log('User registration successful', {
      userId: result.UserSub,
      username: finalUsername,
      requestId: context.awsRequestId,
    });

    return createResponse(201, {
      message: 'User registered successfully',
      userId: result.UserSub,
      username: finalUsername,
      email: email,
      confirmationRequired: !result.UserConfirmed,
      codeDeliveryDetails: result.CodeDeliveryDetails,
    });

  } catch (error: any) {
    console.error('Registration error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'UsernameExistsException') {
      return createResponse(409, {
        error: 'User already exists',
        code: 'USER_EXISTS',
      });
    }

    if (error.code === 'InvalidPasswordException') {
      return createResponse(400, {
        error: 'Password does not meet requirements',
        code: 'INVALID_PASSWORD',
      });
    }

    if (error.code === 'InvalidParameterException') {
      return createResponse(400, {
        error: 'Invalid parameters provided',
        code: 'INVALID_PARAMETERS',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during registration',
      code: 'REGISTRATION_ERROR',
    });
  }
}
/**
 * User Login Handler
 * POST /auth/login
 */
export async function loginHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Login request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { email, password }: LoginRequest = JSON.parse(event.body);

    // Validate required fields
    if (!email || !password) {
      return createResponse(400, {
        error: 'Email and password are required',
        code: 'MISSING_FIELDS',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createResponse(400, {
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Initiate authentication with Cognito
    const authParams = {
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const result = await cognito.initiateAuth(authParams).promise();

    // Handle successful authentication
    if (result.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken, ExpiresIn, TokenType } = result.AuthenticationResult;

      console.log('User login successful', {
        username: email,
        tokenType: TokenType,
        expiresIn: ExpiresIn,
        requestId: context.awsRequestId,
      });

      return createResponse(200, {
        message: 'Login successful',
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken: RefreshToken,
          expiresIn: ExpiresIn,
          tokenType: TokenType,
        },
        user: {
          username: email,
        },
      });
    }

    // Handle challenges (e.g., password reset required, MFA)
    if (result.ChallengeName) {
      console.log('Authentication challenge required', {
        challenge: result.ChallengeName,
        username: email,
        requestId: context.awsRequestId,
      });

      return createResponse(200, {
        message: 'Authentication challenge required',
        challenge: result.ChallengeName,
        challengeParameters: result.ChallengeParameters,
        session: result.Session,
      });
    }

    // Unexpected response
    return createResponse(500, {
      error: 'Unexpected authentication response',
      code: 'UNEXPECTED_RESPONSE',
    });

  } catch (error: any) {
    console.error('Login error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'NotAuthorizedException') {
      return createResponse(401, {
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (error.code === 'UserNotConfirmedException') {
      return createResponse(400, {
        error: 'User email not confirmed',
        code: 'EMAIL_NOT_CONFIRMED',
      });
    }

    if (error.code === 'UserNotFoundException') {
      return createResponse(401, {
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (error.code === 'TooManyRequestsException') {
      return createResponse(429, {
        error: 'Too many login attempts. Please try again later',
        code: 'TOO_MANY_REQUESTS',
      });
    }

    if (error.code === 'PasswordResetRequiredException') {
      return createResponse(400, {
        error: 'Password reset required',
        code: 'PASSWORD_RESET_REQUIRED',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during login',
      code: 'LOGIN_ERROR',
    });
  }
}

/**
 * Email Confirmation Handler
 * POST /auth/confirm-email
 */
export async function confirmEmailHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Email confirmation request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { email, confirmationCode }: ConfirmEmailRequest = JSON.parse(event.body);

    // Validate required fields
    if (!email || !confirmationCode) {
      return createResponse(400, {
        error: 'Email and confirmation code are required',
        code: 'MISSING_FIELDS',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createResponse(400, {
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Confirm user registration with Cognito
    const confirmParams = {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    };

    await cognito.confirmSignUp(confirmParams).promise();

    console.log('Email confirmation successful', {
      username: email,
      requestId: context.awsRequestId,
    });

    return createResponse(200, {
      message: 'Email confirmed successfully',
      username: email,
    });

  } catch (error: any) {
    console.error('Email confirmation error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'CodeMismatchException') {
      return createResponse(400, {
        error: 'Invalid confirmation code',
        code: 'INVALID_CODE',
      });
    }

    if (error.code === 'ExpiredCodeException') {
      return createResponse(400, {
        error: 'Confirmation code has expired',
        code: 'EXPIRED_CODE',
      });
    }

    if (error.code === 'UserNotFoundException') {
      return createResponse(404, {
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (error.code === 'NotAuthorizedException') {
      return createResponse(400, {
        error: 'User is already confirmed',
        code: 'ALREADY_CONFIRMED',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during email confirmation',
      code: 'CONFIRMATION_ERROR',
    });
  }
}

/**
 * Resend Confirmation Code Handler
 * POST /auth/resend-confirmation
 */
export async function resendConfirmationHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Resend confirmation request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { email } = JSON.parse(event.body);

    // Validate required fields
    if (!email) {
      return createResponse(400, {
        error: 'Email is required',
        code: 'MISSING_EMAIL',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createResponse(400, {
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Resend confirmation code
    const resendParams = {
      ClientId: CLIENT_ID,
      Username: email,
    };

    const result = await cognito.resendConfirmationCode(resendParams).promise();

    console.log('Confirmation code resent successfully', {
      username: email,
      requestId: context.awsRequestId,
    });

    return createResponse(200, {
      message: 'Confirmation code sent successfully',
      codeDeliveryDetails: result.CodeDeliveryDetails,
    });

  } catch (error: any) {
    console.error('Resend confirmation error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'UserNotFoundException') {
      return createResponse(404, {
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (error.code === 'InvalidParameterException') {
      return createResponse(400, {
        error: 'User is already confirmed',
        code: 'ALREADY_CONFIRMED',
      });
    }

    if (error.code === 'LimitExceededException') {
      return createResponse(429, {
        error: 'Too many requests. Please try again later',
        code: 'TOO_MANY_REQUESTS',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during resend confirmation',
      code: 'RESEND_ERROR',
    });
  }
}
/**
 * Forgot Password Handler
 * POST /auth/forgot-password
 */
export async function forgotPasswordHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Forgot password request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { email }: ResetPasswordRequest = JSON.parse(event.body);

    // Validate required fields
    if (!email) {
      return createResponse(400, {
        error: 'Email is required',
        code: 'MISSING_EMAIL',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createResponse(400, {
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Initiate password reset with Cognito
    const forgotPasswordParams = {
      ClientId: CLIENT_ID,
      Username: email,
    };

    const result = await cognito.forgotPassword(forgotPasswordParams).promise();

    console.log('Password reset initiated successfully', {
      username: email,
      requestId: context.awsRequestId,
    });

    return createResponse(200, {
      message: 'Password reset code sent successfully',
      codeDeliveryDetails: result.CodeDeliveryDetails,
    });

  } catch (error: any) {
    console.error('Forgot password error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'UserNotFoundException') {
      // For security, don't reveal if user exists or not
      return createResponse(200, {
        message: 'If the email exists, a password reset code has been sent',
      });
    }

    if (error.code === 'InvalidParameterException') {
      return createResponse(400, {
        error: 'Invalid email parameter',
        code: 'INVALID_PARAMETER',
      });
    }

    if (error.code === 'LimitExceededException') {
      return createResponse(429, {
        error: 'Too many requests. Please try again later',
        code: 'TOO_MANY_REQUESTS',
      });
    }

    if (error.code === 'NotAuthorizedException') {
      return createResponse(400, {
        error: 'Password reset not allowed for this user',
        code: 'RESET_NOT_ALLOWED',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during password reset',
      code: 'RESET_ERROR',
    });
  }
}

/**
 * Confirm Forgot Password Handler
 * POST /auth/confirm-forgot-password
 */
export async function confirmForgotPasswordHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Confirm forgot password request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { email, confirmationCode, newPassword }: ConfirmResetPasswordRequest = JSON.parse(event.body);

    // Validate required fields
    if (!email || !confirmationCode || !newPassword) {
      return createResponse(400, {
        error: 'Email, confirmation code, and new password are required',
        code: 'MISSING_FIELDS',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return createResponse(400, {
        error: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
    }

    // Validate new password strength
    const passwordValidation = isValidPassword(newPassword);
    if (!passwordValidation.valid) {
      return createResponse(400, {
        error: passwordValidation.message,
        code: 'INVALID_PASSWORD',
      });
    }

    // Confirm password reset with Cognito
    const confirmForgotPasswordParams = {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    };

    await cognito.confirmForgotPassword(confirmForgotPasswordParams).promise();

    console.log('Password reset confirmed successfully', {
      username: email,
      requestId: context.awsRequestId,
    });

    return createResponse(200, {
      message: 'Password reset successfully',
      username: email,
    });

  } catch (error: any) {
    console.error('Confirm forgot password error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'CodeMismatchException') {
      return createResponse(400, {
        error: 'Invalid confirmation code',
        code: 'INVALID_CODE',
      });
    }

    if (error.code === 'ExpiredCodeException') {
      return createResponse(400, {
        error: 'Confirmation code has expired',
        code: 'EXPIRED_CODE',
      });
    }

    if (error.code === 'UserNotFoundException') {
      return createResponse(404, {
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (error.code === 'InvalidPasswordException') {
      return createResponse(400, {
        error: 'New password does not meet requirements',
        code: 'INVALID_PASSWORD',
      });
    }

    if (error.code === 'LimitExceededException') {
      return createResponse(429, {
        error: 'Too many attempts. Please try again later',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during password reset confirmation',
      code: 'CONFIRM_RESET_ERROR',
    });
  }
}

/**
 * Refresh Token Handler
 * POST /auth/refresh-token
 */
export async function refreshTokenHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    console.log('Refresh token request received', {
      requestId: context.awsRequestId,
      sourceIp: event.requestContext.identity.sourceIp,
    });

    // Parse request body
    if (!event.body) {
      return createResponse(400, {
        error: 'Request body is required',
        code: 'MISSING_BODY',
      });
    }

    const { refreshToken } = JSON.parse(event.body);

    // Validate required fields
    if (!refreshToken) {
      return createResponse(400, {
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    // Refresh tokens with Cognito
    const refreshParams = {
      ClientId: CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    const result = await cognito.initiateAuth(refreshParams).promise();

    if (result.AuthenticationResult) {
      const { AccessToken, IdToken, ExpiresIn, TokenType } = result.AuthenticationResult;

      console.log('Token refresh successful', {
        tokenType: TokenType,
        expiresIn: ExpiresIn,
        requestId: context.awsRequestId,
      });

      return createResponse(200, {
        message: 'Tokens refreshed successfully',
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          expiresIn: ExpiresIn,
          tokenType: TokenType,
        },
      });
    }

    return createResponse(500, {
      error: 'Unexpected refresh response',
      code: 'UNEXPECTED_RESPONSE',
    });

  } catch (error: any) {
    console.error('Refresh token error:', {
      error: error.message,
      code: error.code,
      requestId: context.awsRequestId,
    });

    // Handle specific Cognito errors
    if (error.code === 'NotAuthorizedException') {
      return createResponse(401, {
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    if (error.code === 'UserNotFoundException') {
      return createResponse(404, {
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    return createResponse(500, {
      error: 'Internal server error during token refresh',
      code: 'REFRESH_ERROR',
    });
  }
}

/**
 * CORS Options Handler
 * OPTIONS /auth/*
 */
export async function optionsHandler(): Promise<APIGatewayProxyResult> {
  return createResponse(200, {}, {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Max-Age': '86400',
  });
}