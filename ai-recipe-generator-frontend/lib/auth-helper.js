/**
 * Authentication Helper for AI Recipe Generator
 * Provides simplified auth functions for frontend integration
 */

import { Auth } from 'aws-amplify';

export class AuthHelper {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Sign up result
   */
  static async signUp(email, password) {
    try {
      const result = await Auth.signUp({
        username: email,
        password: password,
        attributes: {
          email: email
        }
      });
      
      return {
        success: true,
        user: result.user,
        userSub: result.userSub,
        needsConfirmation: !result.user.emailVerified
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Confirm user registration with verification code
   * @param {string} email - User email
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Confirmation result
   */
  static async confirmSignUp(email, code) {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Sign in result
   */
  static async signIn(email, password) {
    try {
      const user = await Auth.signIn(email, password);
      
      return {
        success: true,
        user: user,
        session: await Auth.currentSession()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} Sign out result
   */
  static async signOut() {
    try {
      await Auth.signOut();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} Current user or null
   */
  static async getCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const session = await Auth.currentSession();
      
      return {
        success: true,
        user: user,
        session: session,
        tokens: {
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        user: null
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  static async isAuthenticated() {
    try {
      await Auth.currentAuthenticatedUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current session tokens
   * @returns {Promise<Object>} Session tokens or null
   */
  static async getTokens() {
    try {
      const session = await Auth.currentSession();
      return {
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
        expiresAt: session.getAccessToken().getExpiration()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh current session
   * @returns {Promise<Object>} Refresh result
   */
  static async refreshSession() {
    try {
      const session = await Auth.currentSession();
      return {
        success: true,
        session: session
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset result
   */
  static async forgotPassword(email) {
    try {
      const result = await Auth.forgotPassword(email);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Confirm password reset
   * @param {string} email - User email
   * @param {string} code - Verification code
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Confirmation result
   */
  static async forgotPasswordSubmit(email, code, newPassword) {
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Change password for authenticated user
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change result
   */
  static async changePassword(oldPassword, newPassword) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Get user attributes
   * @returns {Promise<Object>} User attributes
   */
  static async getUserAttributes() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const attributes = await Auth.userAttributes(user);
      
      const attributeMap = {};
      attributes.forEach(attr => {
        attributeMap[attr.Name] = attr.Value;
      });
      
      return {
        success: true,
        attributes: attributeMap
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user attributes
   * @param {Object} attributes - Attributes to update
   * @returns {Promise<Object>} Update result
   */
  static async updateUserAttributes(attributes) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const result = await Auth.updateUserAttributes(user, attributes);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
}

export default AuthHelper;