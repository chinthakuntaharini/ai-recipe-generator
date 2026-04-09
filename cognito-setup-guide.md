# Amazon Cognito Setup Guide for AI Recipe Generator

## Task 1.2.2: Set up Amazon Cognito User Pool for Authentication

### Overview
Amazon Cognito provides user authentication and authorization for the AI Recipe Generator. We'll set up a user pool for email/password authentication and configure JWT token validation for secure API access.

**Target Account:** 972803002725 (Vedanth Raj)  
**Region:** us-east-1  
**Authentication Method:** Email + Password

## Architecture Overview

```
User Registration/Login Flow:
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend  │───▶│  Cognito User   │───▶│   JWT Token     │───▶│   API Gateway   │
│  (Next.js)  │    │     Pool        │    │   Validation    │    │   + Lambda      │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step 1: Create Cognito User Pool

### Using AWS Management Console

#### 1.1 Navigate to Cognito
1. Log into AWS Console (Account: 972803002725)
2. Go to Services → Security, Identity, & Compliance → Amazon Cognito
3. Click "Create user pool"

#### 1.2 Configure Sign-in Experience
1. **Authentication providers**: Select "Cognito user pool"
2. **Cognito user pool sign-in options**: 
   - ✅ Email
   - ❌ Phone number (not needed for this project)
   - ❌ Username (using email as username)
3. Click "Next"

#### 1.3 Configure Security Requirements
1. **Password policy**: 
   - Policy: "Cognito defaults" (recommended)
   - Or customize:
     - Minimum length: 8 characters
     - Require uppercase: Yes
     - Require lowercase: Yes  
     - Require numbers: Yes
     - Require symbols: No (for better UX)

2. **Multi-factor authentication (MFA)**:
   - Select "No MFA" (for development simplicity)
   - Note: Enable for production deployment

3. **User account recovery**:
   - ✅ Enable self-service account recovery
   - Recovery methods: "Email only"

4. Click "Next"

#### 1.4 Configure Sign-up Experience
1. **Self-service sign-up**: ✅ Enable
2. **Attribute verification and user account confirmation**:
   - ✅ Send email verification messages
   - Verification method: "Send a verification code"
3. **Required attributes**:
   - ✅ email (required for login)
   - ❌ name (optional - can be added later)
4. Click "Next"

#### 1.5 Configure Message Delivery
1. **Email provider**: 
   - Select "Send email with Cognito" (for development)
   - Note: Use SES for production with higher volume
2. **FROM email address**: 
   - Use default: `no-reply@verificationemail.com`
3. **Reply-to email address**: Leave blank
4. Click "Next"

#### 1.6 Integrate Your App
1. **User pool name**: `ai-recipe-generator-users`
2. **App client name**: `ai-recipe-generator-client`
3. **Client secret**: 
   - ❌ Don't generate (easier for frontend integration)
4. Click "Next"

#### 1.7 Review and Create
1. Review all settings
2. Click "Create user pool"
3. Note the User Pool ID (format: `us-east-1_XXXXXXXXX`)

### Using AWS CLI

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name "ai-recipe-generator-users" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --verification-message-template '{
    "DefaultEmailOption": "CONFIRM_WITH_CODE",
    "DefaultEmailSubject": "AI Recipe Generator - Verify your email",
    "DefaultEmailMessage": "Your verification code is {####}"
  }' \
  --admin-create-user-config '{
    "AllowAdminCreateUserOnly": false
  }' \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

## Step 2: Create User Pool Client

### Using AWS Management Console
1. Go to your user pool → "App integration" tab
2. Click "Create app client"
3. **App client name**: `ai-recipe-generator-web-client`
4. **Client secret**: Don't generate (for web apps)
5. **Auth flows**: 
   - ✅ ALLOW_USER_SRP_AUTH
   - ✅ ALLOW_REFRESH_TOKEN_AUTH
6. Click "Create app client"

### Using AWS CLI
```bash
# Get User Pool ID from previous step
USER_POOL_ID="us-east-1_XXXXXXXXX"  # Replace with actual ID

# Create user pool client
aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name "ai-recipe-generator-web-client" \
  --generate-secret false \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --supported-identity-providers COGNITO \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

## Step 3: Configure User Pool Domain (Optional)

### Using AWS Management Console
1. Go to user pool → "App integration" tab
2. Scroll to "Domain" section
3. Click "Create Cognito domain"
4. **Domain prefix**: `ai-recipe-generator-auth` (must be unique)
5. Click "Create domain"

### Using AWS CLI
```bash
# Create domain
aws cognito-idp create-user-pool-domain \
  --domain "ai-recipe-generator-auth-$(date +%s)" \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

## Step 4: Test User Pool Configuration

### Create Test User via CLI
```bash
# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username "test@example.com" \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS \
  --region us-east-1 \
  --profile ai-recipe-generator-dev

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username "test@example.com" \
  --password "TestPass123!" \
  --permanent \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### Test Authentication
```bash
# Get client ID
CLIENT_ID=$(aws cognito-idp list-user-pool-clients \
  --user-pool-id $USER_POOL_ID \
  --region us-east-1 \
  --profile ai-recipe-generator-dev \
  --query 'UserPoolClients[0].ClientId' \
  --output text)

# Initiate auth (this will require SRP calculation - use SDK for actual implementation)
echo "Client ID: $CLIENT_ID"
echo "User Pool ID: $USER_POOL_ID"
```

## Step 5: JWT Token Validation Setup

### Lambda Authorizer Function (Node.js)
```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

exports.handler = async (event) => {
  const token = event.authorizationToken.replace('Bearer ', '');
  
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: process.env.CLIENT_ID,
        issuer: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.USER_POOL_ID}`,
        algorithms: ['RS256']
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    
    return generatePolicy('user', 'Allow', event.methodArn, decoded);
  } catch (error) {
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

function generatePolicy(principalId, effect, resource, context = {}) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    },
    context
  };
}
```

## Step 6: Frontend Integration Configuration

### Environment Variables
```bash
# Add to your .env.local file
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
```

### AWS Amplify Configuration
```javascript
// aws-config.js
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH'
  }
};

Amplify.configure(awsConfig);
export default awsConfig;
```

### React Authentication Hook
```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email, password) => {
    try {
      const user = await Auth.signIn(email, password);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password) => {
    try {
      const result = await Auth.signUp({
        username: email,
        password,
        attributes: { email }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      await Auth.confirmSignUp(email, code);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    isAuthenticated: !!user
  };
}
```

## Step 7: API Gateway Integration

### Configure API Gateway Authorizer
1. Go to API Gateway console
2. Select your API
3. Go to "Authorizers"
4. Click "Create New Authorizer"
5. **Name**: `CognitoAuthorizer`
6. **Type**: `Cognito`
7. **Cognito User Pool**: Select your user pool
8. **Token Source**: `Authorization`
9. Click "Create"

### Protect API Endpoints
1. Go to your API resource/method
2. Click "Method Request"
3. **Authorization**: Select `CognitoAuthorizer`
4. **OAuth Scopes**: Leave empty
5. Deploy API

## Step 8: Testing and Verification

### PowerShell Test Script
```powershell
# Test Cognito configuration
$UserPoolId = "us-east-1_XXXXXXXXX"  # Replace with actual ID
$ClientId = "your-client-id"         # Replace with actual client ID

# List user pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 --profile ai-recipe-generator-dev

# Describe user pool
aws cognito-idp describe-user-pool --user-pool-id $UserPoolId --region us-east-1 --profile ai-recipe-generator-dev

# List user pool clients
aws cognito-idp list-user-pool-clients --user-pool-id $UserPoolId --region us-east-1 --profile ai-recipe-generator-dev
```

### Frontend Test Component
```jsx
// components/AuthTest.jsx
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

export default function AuthTest() {
  const { user, signIn, signUp, signOut, confirmSignUp, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    const result = await signUp(email, password);
    console.log('Sign up result:', result);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const result = await signIn(email, password);
    console.log('Sign in result:', result);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    const result = await confirmSignUp(email, confirmationCode);
    console.log('Confirmation result:', result);
  };

  if (isAuthenticated) {
    return (
      <div>
        <h2>Welcome, {user.attributes.email}!</h2>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSignUp}>
        <h3>Sign Up</h3>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
      </form>

      <form onSubmit={handleSignIn}>
        <h3>Sign In</h3>
        <button type="submit">Sign In</button>
      </form>

      <form onSubmit={handleConfirm}>
        <h3>Confirm Email</h3>
        <input
          type="text"
          placeholder="Confirmation Code"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
        />
        <button type="submit">Confirm</button>
      </form>
    </div>
  );
}
```

## Step 9: Security Configuration

### Password Policy Best Practices
- Minimum 8 characters
- Require uppercase and lowercase
- Require numbers
- Consider symbols for production
- Set account lockout after failed attempts

### Token Configuration
- Access token expiration: 1 hour (default)
- Refresh token expiration: 30 days (default)
- ID token expiration: 1 hour (default)

### CORS Configuration
```json
{
  "AllowOrigins": ["http://localhost:3000", "https://your-domain.com"],
  "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowHeaders": ["Content-Type", "Authorization"],
  "ExposeHeaders": [],
  "MaxAge": 86400,
  "AllowCredentials": true
}
```

## Step 10: Monitoring and Logging

### CloudWatch Metrics
- Sign-in attempts
- Sign-up attempts  
- Failed authentications
- Token refresh rates

### CloudTrail Events
- User pool modifications
- Client configuration changes
- Administrative actions

## Troubleshooting

### Common Issues

#### 1. "User does not exist" Error
- Check if user is confirmed
- Verify email attribute is set correctly
- Check user pool configuration

#### 2. "Invalid password" Error
- Verify password policy requirements
- Check for special character requirements
- Ensure minimum length is met

#### 3. JWT Token Validation Fails
- Verify token hasn't expired
- Check audience (client ID) in token
- Validate issuer URL format
- Ensure correct signing key

#### 4. CORS Issues
- Configure API Gateway CORS
- Set proper headers in frontend
- Enable credentials if needed

### Support Resources
- AWS Cognito Documentation
- AWS Amplify Auth Documentation
- JWT.io for token debugging

## Next Steps

After completing Cognito setup:

1. ✅ **Test user registration and login flow**
2. ✅ **Verify JWT token validation**
3. ⏭️ **Proceed to task 1.2.3**: Create DynamoDB table
4. ⏭️ **Integrate authentication** with frontend components
5. ⏭️ **Implement protected API routes**

## Cost Considerations

### Cognito Pricing (Free Tier)
- **50,000 MAU** (Monthly Active Users) free
- Additional users: $0.0055 per MAU
- SMS messages: $0.00645 per message (if using phone verification)

### Monitoring Usage
- Track MAU in CloudWatch
- Set up billing alerts for overages
- Monitor authentication patterns

---

**Configuration Summary:**
- User Pool: Email-based authentication
- Client: Web client without secret
- Security: Password policy enforced
- Integration: JWT tokens for API access
- Monitoring: CloudWatch metrics enabled