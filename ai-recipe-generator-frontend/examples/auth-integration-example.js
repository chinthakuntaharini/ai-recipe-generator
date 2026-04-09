/**
 * Frontend Authentication Integration Example
 * Demonstrates how to use the optimized Cognito client configuration
 */

import React, { useState, useEffect } from 'react';
import AuthHelper from '../lib/auth-helper';

// Example Login Component
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await AuthHelper.signIn(email, password);
      
      if (result.success) {
        console.log('Login successful:', result.user);
        // Redirect to dashboard or update app state
        window.location.href = '/dashboard';
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2>Sign In</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}

// Example Registration Component
export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await AuthHelper.signUp(email, password);
      
      if (result.success) {
        if (result.needsConfirmation) {
          setNeedsConfirmation(true);
        } else {
          // Auto sign in or redirect
          window.location.href = '/dashboard';
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return <ConfirmationForm email={email} />;
  }

  return (
    <form onSubmit={handleRegister} className="auth-form">
      <h2>Create Account</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="reg-email">Email:</label>
        <input
          type="email"
          id="reg-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="reg-password">Password:</label>
        <input
          type="password"
          id="reg-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={8}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="confirm-password">Confirm Password:</label>
        <input
          type="password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength={8}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}

// Example Confirmation Component
export function ConfirmationForm({ email }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await AuthHelper.confirmSignUp(email, code);
      
      if (result.success) {
        // Auto sign in after confirmation
        window.location.href = '/login?confirmed=true';
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleConfirm} className="auth-form">
      <h2>Confirm Your Email</h2>
      <p>We sent a confirmation code to {email}</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="confirmation-code">Confirmation Code:</label>
        <input
          type="text"
          id="confirmation-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter 6-digit code"
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Confirming...' : 'Confirm Email'}
      </button>
    </form>
  );
}

// Example Protected Route Component
export function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await AuthHelper.isAuthenticated();
      setIsAuthenticated(isAuth);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }

  return children;
}

// Example User Profile Component
export function UserProfile() {
  const [user, setUser] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userResult, attributesResult] = await Promise.all([
        AuthHelper.getCurrentUser(),
        AuthHelper.getUserAttributes()
      ]);

      if (userResult.success) {
        setUser(userResult.user);
      }

      if (attributesResult.success) {
        setAttributes(attributesResult.attributes);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const result = await AuthHelper.signOut();
      if (result.success) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      
      <div className="profile-info">
        <p><strong>Email:</strong> {attributes.email}</p>
        <p><strong>Email Verified:</strong> {attributes.email_verified}</p>
        <p><strong>User ID:</strong> {user?.username}</p>
      </div>
      
      <button onClick={handleLogout} className="logout-btn">
        Sign Out
      </button>
    </div>
  );
}

// Example API Call with Authentication
export async function makeAuthenticatedAPICall(endpoint, data) {
  try {
    // Check if user is authenticated
    const isAuth = await AuthHelper.isAuthenticated();
    if (!isAuth) {
      throw new Error('User not authenticated');
    }

    // Get current tokens
    const tokens = await AuthHelper.getTokens();
    if (!tokens) {
      throw new Error('No valid tokens available');
    }

    // Make API call with auth header
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.idToken}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to refresh
        const refreshResult = await AuthHelper.refreshSession();
        if (refreshResult.success) {
          // Retry the request
          return makeAuthenticatedAPICall(endpoint, data);
        } else {
          // Redirect to login
          window.location.href = '/login';
          return;
        }
      }
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authenticated API call failed:', error);
    throw error;
  }
}

// Example usage in a React component
export function RecipeGenerator() {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRecipe = async () => {
    setLoading(true);
    try {
      const result = await makeAuthenticatedAPICall('/api/generate-recipe', {
        ingredients: ingredients.split(',').map(i => i.trim())
      });
      setRecipe(result);
    } catch (error) {
      console.error('Recipe generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="recipe-generator">
        <h2>Generate Recipe</h2>
        
        <div className="form-group">
          <label>Ingredients (comma-separated):</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="chicken, rice, broccoli"
          />
        </div>
        
        <button onClick={generateRecipe} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Recipe'}
        </button>
        
        {recipe && (
          <div className="recipe-result">
            <h3>{recipe.title}</h3>
            <p>{recipe.instructions}</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default {
  LoginForm,
  RegisterForm,
  ConfirmationForm,
  ProtectedRoute,
  UserProfile,
  RecipeGenerator,
  makeAuthenticatedAPICall
};