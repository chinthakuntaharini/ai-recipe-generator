import {
  getUserId,
  getUsername,
  getUserEmail,
  isEmailVerified,
  isAccessToken,
  isIdToken,
  getTokenExpiration,
  getTokenIssuedAt,
  willExpireSoon,
  getUserContext,
  sanitizeUserForResponse,
  validateResourceOwnership,
  createAuditLog,
} from '../auth-utils';
import { CognitoUser } from '../../middleware/auth-middleware';

describe('Auth Utils', () => {
  const mockUser: CognitoUser = {
    sub: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    email_verified: true,
    aud: 'test-client-id',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_N0KMxM07E',
    token_use: 'access',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    auth_time: Math.floor(Date.now() / 1000),
  };

  describe('getUserId', () => {
    it('should return user sub', () => {
      expect(getUserId(mockUser)).toBe('user-123');
    });
  });

  describe('getUsername', () => {
    it('should return username', () => {
      expect(getUsername(mockUser)).toBe('testuser');
    });
  });

  describe('getUserEmail', () => {
    it('should return user email', () => {
      expect(getUserEmail(mockUser)).toBe('test@example.com');
    });
  });

  describe('isEmailVerified', () => {
    it('should return true for verified email', () => {
      expect(isEmailVerified(mockUser)).toBe(true);
    });

    it('should return false for unverified email', () => {
      const unverifiedUser = { ...mockUser, email_verified: false };
      expect(isEmailVerified(unverifiedUser)).toBe(false);
    });
  });

  describe('isAccessToken', () => {
    it('should return true for access token', () => {
      expect(isAccessToken(mockUser)).toBe(true);
    });

    it('should return false for ID token', () => {
      const idTokenUser = { ...mockUser, token_use: 'id' as const };
      expect(isAccessToken(idTokenUser)).toBe(false);
    });
  });

  describe('isIdToken', () => {
    it('should return true for ID token', () => {
      const idTokenUser = { ...mockUser, token_use: 'id' as const };
      expect(isIdToken(idTokenUser)).toBe(true);
    });

    it('should return false for access token', () => {
      expect(isIdToken(mockUser)).toBe(false);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return correct expiration date', () => {
      const expectedDate = new Date(mockUser.exp * 1000);
      expect(getTokenExpiration(mockUser)).toEqual(expectedDate);
    });
  });

  describe('getTokenIssuedAt', () => {
    it('should return correct issued date', () => {
      const expectedDate = new Date(mockUser.iat * 1000);
      expect(getTokenIssuedAt(mockUser)).toEqual(expectedDate);
    });
  });

  describe('willExpireSoon', () => {
    it('should return false for token expiring in 1 hour', () => {
      expect(willExpireSoon(mockUser, 5)).toBe(false);
    });

    it('should return true for token expiring soon', () => {
      const soonExpiringUser = {
        ...mockUser,
        exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes from now
      };
      expect(willExpireSoon(soonExpiringUser, 5)).toBe(true);
    });

    it('should use default 5 minutes if not specified', () => {
      const soonExpiringUser = {
        ...mockUser,
        exp: Math.floor(Date.now() / 1000) + 240, // 4 minutes from now
      };
      expect(willExpireSoon(soonExpiringUser)).toBe(true);
    });
  });

  describe('getUserContext', () => {
    it('should return sanitized user context', () => {
      const context = getUserContext(mockUser);
      expect(context).toEqual({
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'access',
        emailVerified: true,
      });
    });
  });

  describe('sanitizeUserForResponse', () => {
    it('should return sanitized user for API response', () => {
      const sanitized = sanitizeUserForResponse(mockUser);
      expect(sanitized).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        emailVerified: true,
      });
    });
  });

  describe('validateResourceOwnership', () => {
    it('should return true for matching user ID', () => {
      expect(validateResourceOwnership(mockUser, 'user-123')).toBe(true);
    });

    it('should return false for different user ID', () => {
      expect(validateResourceOwnership(mockUser, 'user-456')).toBe(false);
    });
  });

  describe('createAuditLog', () => {
    it('should create audit log without details', () => {
      const log = createAuditLog(mockUser, 'CREATE', 'recipe');
      
      expect(log).toEqual({
        userId: 'user-123',
        username: 'testuser',
        action: 'CREATE',
        resource: 'recipe',
        timestamp: expect.any(String),
      });
      
      // Verify timestamp is valid ISO string
      expect(new Date(log.timestamp).toISOString()).toBe(log.timestamp);
    });

    it('should create audit log with details', () => {
      const details = { recipeId: 'recipe-123', ingredients: ['chicken', 'rice'] };
      const log = createAuditLog(mockUser, 'CREATE', 'recipe', details);
      
      expect(log).toEqual({
        userId: 'user-123',
        username: 'testuser',
        action: 'CREATE',
        resource: 'recipe',
        timestamp: expect.any(String),
        details,
      });
    });
  });
});