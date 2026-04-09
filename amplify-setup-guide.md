# AWS Amplify Setup Guide for AI Recipe Generator

## Task 1.2.5: Set up AWS Amplify for Frontend Hosting

### Overview
AWS Amplify will host the Next.js frontend application for the AI Recipe Generator. It provides continuous deployment, SSL certificates, CDN distribution, and seamless integration with other AWS services.

**Target Account:** 972803002725 (Vedanth Raj)  
**Region:** us-east-1  
**Free Tier Limits:** 1,000 build minutes, 15 GB served per month

## Frontend Technology Stack

### Next.js Application Structure
```
ai-recipe-generator-frontend/
├── pages/
│   ├── index.js              # Home page with recipe generation
│   ├── recipes/
│   │   ├── index.js          # Recipe history
│   │   ├── [id].js           # Individual recipe view
│   │   └── favorites.js      # Favorite recipes
│   ├── auth/
│   │   ├── login.js          # Login page
│   │   └── register.js       # Registration page
│   └── _app.js               # App configuration
├── components/
│   ├── RecipeForm.js         # Recipe generation form
│   ├── RecipeCard.js         # Recipe display component
│   ├── AuthForm.js           # Authentication forms
│   └── Layout.js             # App layout
├── lib/
│   ├── api-client.js         # API Gateway client
│   ├── aws-config.js         # AWS Amplify configuration
│   └── auth.js               # Authentication utilities
├── hooks/
│   ├── useAuth.js            # Authentication hook
│   └── useRecipes.js         # Recipe management hook
├── styles/
│   └── globals.css           # Global styles
├── public/
│   └── favicon.ico           # App favicon
├── .env.local                # Environment variables
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
└── amplify.yml               # Amplify build configuration
```

## Step 1: Create Next.js Application

### Initialize Project
```bash
# Create Next.js application
npx create-next-app@latest ai-recipe-generator-frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd ai-recipe-generator-frontend

# Install additional dependencies
npm install aws-amplify @aws-amplify/ui-react uuid joi
npm install -D @types/uuid
```

### Package.json Configuration
```json
{
  "name": "ai-recipe-generator-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next export"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "aws-amplify": "^6.0.0",
    "@aws-amplify/ui-react": "^6.0.0",
    "uuid": "^9.0.0",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/uuid": "^9.0.0",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}
```

## Step 2: Configure AWS Amplify

### Environment Variables (.env.local)
```bash
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# App Configuration
NEXT_PUBLIC_APP_NAME=AI Recipe Generator
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### AWS Amplify Configuration (lib/aws-config.js)
```javascript
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH',
    oauth: {
      domain: `${process.env.NEXT_PUBLIC_USER_POOL_DOMAIN}`,
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
        region: process.env.NEXT_PUBLIC_AWS_REGION
      }
    ]
  }
};

// Configure Amplify
if (typeof window !== 'undefined') {
  Amplify.configure(awsConfig);
}

export default awsConfig;
```

### App Configuration (pages/_app.js)
```javascript
import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import awsConfig from '../lib/aws-config';
import '../styles/globals.css';
import '@aws-amplify/ui-react/styles.css';

// Configure Amplify
Amplify.configure(awsConfig);

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Any additional client-side configuration
  }, []);

  return (
    <Authenticator.Provider>
      <Component {...pageProps} />
    </Authenticator.Provider>
  );
}
```

## Step 3: Create Core Components

### Authentication Hook (hooks/useAuth.js)
```javascript
import { useState, useEffect, useContext, createContext } from 'react';
import { Auth } from 'aws-amplify';

const AuthContext = createContext();

export function AuthProvider({ children }) {
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

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Recipe Generation Form (components/RecipeForm.js)
```javascript
import { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';

export default function RecipeForm() {
  const [ingredients, setIngredients] = useState(['']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [cuisine, setCuisine] = useState('');
  const [servings, setServings] = useState(4);
  const { generateRecipe, loading } = useRecipes();

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, value) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    try {
      await generateRecipe(validIngredients, {
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        cuisine: cuisine || undefined,
        servings
      });
    } catch (error) {
      console.error('Recipe generation failed:', error);
      alert('Failed to generate recipe. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Generate Recipe</h2>
      
      {/* Ingredients */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ingredients
        </label>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex mb-2">
            <input
              type="text"
              value={ingredient}
              onChange={(e) => updateIngredient(index, e.target.value)}
              placeholder="Enter ingredient"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="ml-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Add Ingredient
        </button>
      </div>

      {/* Dietary Restrictions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dietary Restrictions (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto'].map((restriction) => (
            <label key={restriction} className="flex items-center">
              <input
                type="checkbox"
                checked={dietaryRestrictions.includes(restriction)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDietaryRestrictions([...dietaryRestrictions, restriction]);
                  } else {
                    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm capitalize">{restriction}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cuisine (Optional)
        </label>
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any cuisine</option>
          <option value="Italian">Italian</option>
          <option value="Mediterranean">Mediterranean</option>
          <option value="Asian">Asian</option>
          <option value="Mexican">Mexican</option>
          <option value="Indian">Indian</option>
          <option value="American">American</option>
        </select>
      </div>

      {/* Servings */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Servings
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={servings}
          onChange={(e) => setServings(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating Recipe...' : 'Generate Recipe'}
      </button>
    </form>
  );
}
```

## Step 4: Create Amplify App

### Using AWS Management Console

#### 4.1 Navigate to Amplify
1. Log into AWS Console (Account: 972803002725)
2. Go to Services → Mobile → AWS Amplify
3. Click "Create app"

#### 4.2 Choose Deployment Method
1. Select "Deploy without Git provider" (for initial setup)
2. Or select "GitHub/GitLab/Bitbucket" if you have a repository

#### 4.3 Configure App Settings
1. **App name**: `ai-recipe-generator-frontend`
2. **Environment name**: `main`
3. **Build settings**: Auto-detect (Next.js)

### Using AWS CLI

```bash
# Create Amplify app
aws amplify create-app \
  --name "ai-recipe-generator-frontend" \
  --description "Frontend for AI Recipe Generator application" \
  --platform WEB \
  --iam-service-role-arn "arn:aws:iam::972803002725:role/amplifyconsole-backend-role" \
  --environment-variables \
    NEXT_PUBLIC_AWS_REGION=us-east-1 \
    NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX \
    NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id \
    NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod \
  --region us-east-1 \
  --profile ai-recipe-generator-dev \
  --output json
```

## Step 5: Configure Build Settings

### Amplify Build Configuration (amplify.yml)
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: /
```

### Next.js Configuration (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  output: 'export',
  distDir: 'out',
  env: {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
  }
}

module.exports = nextConfig
```

## Step 6: Deploy Application

### Manual Deployment
```bash
# Build the application
npm run build

# Create deployment package
zip -r deployment.zip .next/ public/ package.json

# Deploy to Amplify (using CLI)
aws amplify create-deployment \
  --app-id your-app-id \
  --branch-name main \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### Continuous Deployment Setup

#### Connect Git Repository
1. Go to Amplify Console
2. Select your app
3. Click "Connect branch"
4. Choose your Git provider (GitHub, GitLab, etc.)
5. Select repository and branch
6. Configure build settings
7. Deploy

#### GitHub Actions Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Amplify

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_AWS_REGION: ${{ secrets.NEXT_PUBLIC_AWS_REGION }}
        NEXT_PUBLIC_USER_POOL_ID: ${{ secrets.NEXT_PUBLIC_USER_POOL_ID }}
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_USER_POOL_CLIENT_ID }}
        NEXT_PUBLIC_API_GATEWAY_URL: ${{ secrets.NEXT_PUBLIC_API_GATEWAY_URL }}
    
    - name: Deploy to Amplify
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
```

## Step 7: Configure Custom Domain (Optional)

### Add Custom Domain
```bash
# Add custom domain
aws amplify create-domain-association \
  --app-id your-app-id \
  --domain-name "recipes.yourdomain.com" \
  --sub-domain-settings prefix=www,branchName=main \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### SSL Certificate
- Amplify automatically provisions SSL certificates
- HTTPS is enabled by default
- Custom domains get SSL certificates via AWS Certificate Manager

## Step 8: Environment Configuration

### Environment Variables in Amplify
```bash
# Set environment variables
aws amplify put-backend-environment \
  --app-id your-app-id \
  --environment-name main \
  --deployment-artifacts '{
    "NEXT_PUBLIC_AWS_REGION": "us-east-1",
    "NEXT_PUBLIC_USER_POOL_ID": "us-east-1_XXXXXXXXX",
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID": "your-client-id",
    "NEXT_PUBLIC_API_GATEWAY_URL": "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"
  }' \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### Branch-Specific Configuration
- **main branch**: Production environment
- **develop branch**: Staging environment
- **feature branches**: Preview deployments

## Step 9: Performance Optimization

### CDN Configuration
- Amplify uses Amazon CloudFront CDN
- Global edge locations for fast content delivery
- Automatic caching of static assets

### Build Optimization
```javascript
// next.config.js optimizations
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['aws-amplify', '@aws-amplify/ui-react']
  }
}
```

### Caching Strategy
```javascript
// Cache API responses
const apiClient = {
  cache: new Map(),
  
  async get(url, options = {}) {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache for 5 minutes
    this.cache.set(cacheKey, data);
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
    
    return data;
  }
};
```

## Step 10: Monitoring and Analytics

### CloudWatch Integration
```bash
# Enable CloudWatch monitoring
aws amplify put-app \
  --app-id your-app-id \
  --name "ai-recipe-generator-frontend" \
  --enable-auto-branch-creation true \
  --enable-branch-auto-build true \
  --enable-basic-auth false \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### Performance Monitoring
- Core Web Vitals tracking
- Real User Monitoring (RUM)
- Error tracking and reporting
- Build performance metrics

### Analytics Setup
```javascript
// lib/analytics.js
import { Analytics } from 'aws-amplify';

export const trackEvent = (eventName, attributes = {}) => {
  Analytics.record({
    name: eventName,
    attributes: {
      ...attributes,
      timestamp: new Date().toISOString()
    }
  });
};

export const trackPageView = (pageName) => {
  trackEvent('page_view', { page: pageName });
};

export const trackRecipeGeneration = (ingredients, success) => {
  trackEvent('recipe_generation', {
    ingredient_count: ingredients.length,
    success: success.toString()
  });
};
```

## Security Configuration

### Content Security Policy
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com;"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
}
```

### Environment Security
- Environment variables are encrypted at rest
- Build-time secrets are not exposed to client
- HTTPS enforced for all traffic
- AWS IAM roles for service access

## Cost Optimization

### Free Tier Limits
- **Build minutes**: 1,000 per month
- **Data served**: 15 GB per month
- **Data stored**: 5 GB
- **Requests**: 500,000 per month

### Optimization Strategies
1. **Efficient builds**: Minimize build time and resources
2. **CDN caching**: Leverage CloudFront for static assets
3. **Image optimization**: Use Next.js image optimization
4. **Code splitting**: Implement dynamic imports
5. **Bundle analysis**: Monitor and optimize bundle size

## Troubleshooting

### Common Issues

#### 1. Build Failures
- Check build logs in Amplify Console
- Verify environment variables
- Ensure all dependencies are in package.json
- Check Node.js version compatibility

#### 2. Authentication Issues
- Verify Cognito configuration
- Check CORS settings
- Validate JWT token handling
- Ensure proper redirect URLs

#### 3. API Integration Problems
- Verify API Gateway endpoints
- Check CORS configuration
- Validate authentication headers
- Test API endpoints independently

#### 4. Performance Issues
- Analyze bundle size
- Check CDN cache hit rates
- Monitor Core Web Vitals
- Optimize images and assets

## Next Steps

After completing Amplify setup:

1. ✅ **Deploy frontend application**
2. ✅ **Test authentication flow**
3. ✅ **Verify API integration**
4. ⏭️ **Proceed to Phase 2**: Backend Infrastructure Development
5. ⏭️ **Implement Lambda functions**
6. ⏭️ **Complete end-to-end testing**

---

**Amplify Configuration Summary:**
- App Name: `ai-recipe-generator-frontend`
- Platform: Next.js with TypeScript
- Authentication: AWS Cognito integration
- API: AWS API Gateway integration
- Hosting: Global CDN with SSL
- Deployment: Continuous deployment from Git
- Monitoring: CloudWatch and analytics enabled