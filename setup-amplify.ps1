# PowerShell script to set up AWS Amplify for AI Recipe Generator frontend
# This script creates Amplify app and configures hosting

param(
    [string]$Profile = "ai-recipe-generator-dev",
    [string]$Region = "us-east-1",
    [string]$AppName = "ai-recipe-generator-frontend",
    [string]$UserPoolId = "",
    [string]$UserPoolClientId = "",
    [string]$ApiGatewayUrl = ""
)

Write-Host "🚀 Setting up AWS Amplify for AI Recipe Generator Frontend" -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "App Name: $AppName" -ForegroundColor Yellow
Write-Host ""

# Function to handle AWS CLI commands with error checking
function Invoke-AWSCommand {
    param([string]$Command, [string]$Description)
    
    Write-Host "Executing: $Description..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
            return $result
        } else {
            Write-Host "❌ $Description failed" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Error in $Description`: $_" -ForegroundColor Red
        return $null
    }
}

# Get configuration values if not provided
if (-not $UserPoolId) {
    Write-Host "Getting Cognito User Pool ID..." -ForegroundColor Yellow
    $userPools = aws cognito-idp list-user-pools --max-results 10 --region $Region --profile $Profile --output json 2>$null
    
    if ($userPools) {
        $poolsData = $userPools | ConvertFrom-Json
        $aiRecipePool = $poolsData.UserPools | Where-Object { $_.Name -like "*ai-recipe-generator*" }
        
        if ($aiRecipePool) {
            $UserPoolId = $aiRecipePool.Id
            Write-Host "Found User Pool: $UserPoolId" -ForegroundColor Green
        }
    }
}

if (-not $UserPoolClientId) {
    Write-Host "Getting User Pool Client ID..." -ForegroundColor Yellow
    if ($UserPoolId) {
        $clients = aws cognito-idp list-user-pool-clients --user-pool-id $UserPoolId --region $Region --profile $Profile --output json 2>$null
        
        if ($clients) {
            $clientsData = $clients | ConvertFrom-Json
            $aiRecipeClient = $clientsData.UserPoolClients | Where-Object { $_.ClientName -like "*ai-recipe-generator*" }
            
            if ($aiRecipeClient) {
                $UserPoolClientId = $aiRecipeClient.ClientId
                Write-Host "Found Client: $UserPoolClientId" -ForegroundColor Green
            }
        }
    }
}

if (-not $ApiGatewayUrl) {
    Write-Host "Getting API Gateway URL..." -ForegroundColor Yellow
    $apis = aws apigateway get-rest-apis --region $Region --profile $Profile --output json 2>$null
    
    if ($apis) {
        $apisData = $apis | ConvertFrom-Json
        $aiRecipeApi = $apisData.items | Where-Object { $_.name -like "*ai-recipe-generator*" }
        
        if ($aiRecipeApi) {
            $ApiGatewayUrl = "https://$($aiRecipeApi.id).execute-api.$Region.amazonaws.com/prod"
            Write-Host "Found API Gateway: $ApiGatewayUrl" -ForegroundColor Green
        }
    }
}

# Prompt for missing values
if (-not $UserPoolId) {
    $UserPoolId = Read-Host "Enter Cognito User Pool ID"
}
if (-not $UserPoolClientId) {
    $UserPoolClientId = Read-Host "Enter Cognito User Pool Client ID"
}
if (-not $ApiGatewayUrl) {
    $ApiGatewayUrl = Read-Host "Enter API Gateway URL"
}

# Step 1: Create Amplify App
Write-Host "Step 1: Creating Amplify App" -ForegroundColor Cyan

$createAppCommand = @"
aws amplify create-app \
  --name "$AppName" \
  --description "Frontend for AI Recipe Generator application" \
  --platform WEB \
  --environment-variables \
    NEXT_PUBLIC_AWS_REGION=$Region \
    NEXT_PUBLIC_USER_POOL_ID=$UserPoolId \
    NEXT_PUBLIC_USER_POOL_CLIENT_ID=$UserPoolClientId \
    NEXT_PUBLIC_API_GATEWAY_URL=$ApiGatewayUrl \
    NEXT_PUBLIC_APP_NAME="AI Recipe Generator" \
    NEXT_PUBLIC_APP_VERSION="1.0.0" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$appResult = Invoke-AWSCommand -Command $createAppCommand -Description "Create Amplify App"

if ($appResult) {
    $appData = $appResult | ConvertFrom-Json
    $appId = $appData.app.appId
    $defaultDomain = $appData.app.defaultDomain
    Write-Host "App ID: $appId" -ForegroundColor Green
    Write-Host "Default Domain: https://$defaultDomain" -ForegroundColor Green
} else {
    Write-Host "Failed to create Amplify app. Exiting." -ForegroundColor Red
    exit 1
}

# Step 2: Create main branch
Write-Host ""
Write-Host "Step 2: Creating main branch" -ForegroundColor Cyan

$createBranchCommand = @"
aws amplify create-branch \
  --app-id $appId \
  --branch-name main \
  --description "Main production branch" \
  --enable-auto-build true \
  --enable-basic-auth false \
  --environment-variables \
    NEXT_PUBLIC_AWS_REGION=$Region \
    NEXT_PUBLIC_USER_POOL_ID=$UserPoolId \
    NEXT_PUBLIC_USER_POOL_CLIENT_ID=$UserPoolClientId \
    NEXT_PUBLIC_API_GATEWAY_URL=$ApiGatewayUrl \
  --region $Region \
  --profile $Profile \
  --output json
"@

$branchResult = Invoke-AWSCommand -Command $createBranchCommand -Description "Create main branch"

if ($branchResult) {
    $branchData = $branchResult | ConvertFrom-Json
    Write-Host "Branch created: main" -ForegroundColor Green
    Write-Host "Branch URL: https://main.$defaultDomain" -ForegroundColor Green
} else {
    Write-Host "Failed to create branch. Continuing..." -ForegroundColor Yellow
}

# Step 3: Generate Next.js project structure
Write-Host ""
Write-Host "Step 3: Generating Next.js project files" -ForegroundColor Cyan

# Create package.json
$packageJson = @{
    name = "ai-recipe-generator-frontend"
    version = "0.1.0"
    private = $true
    scripts = @{
        dev = "next dev"
        build = "next build"
        start = "next start"
        lint = "next lint"
        export = "next export"
    }
    dependencies = @{
        next = "14.0.0"
        react = "^18"
        "react-dom" = "^18"
        "aws-amplify" = "^6.0.0"
        "@aws-amplify/ui-react" = "^6.0.0"
        uuid = "^9.0.0"
        joi = "^17.11.0"
    }
    devDependencies = @{
        typescript = "^5"
        "@types/node" = "^20"
        "@types/react" = "^18"
        "@types/react-dom" = "^18"
        "@types/uuid" = "^9.0.0"
        autoprefixer = "^10.0.1"
        eslint = "^8"
        "eslint-config-next" = "14.0.0"
        postcss = "^8"
        tailwindcss = "^3.3.0"
    }
} | ConvertTo-Json -Depth 3

$packageJson | Out-File -FilePath "package.json" -Encoding UTF8
Write-Host "✅ Created package.json" -ForegroundColor Green

# Create amplify.yml
$amplifyYml = @"
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
"@

$amplifyYml | Out-File -FilePath "amplify.yml" -Encoding UTF8
Write-Host "✅ Created amplify.yml" -ForegroundColor Green

# Create next.config.js
$nextConfig = @"
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
  },
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

module.exports = nextConfig
"@

$nextConfig | Out-File -FilePath "next.config.js" -Encoding UTF8
Write-Host "✅ Created next.config.js" -ForegroundColor Green
# Create .env.local template
$envLocal = @"
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=$Region
NEXT_PUBLIC_USER_POOL_ID=$UserPoolId
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$UserPoolClientId
NEXT_PUBLIC_API_GATEWAY_URL=$ApiGatewayUrl

# App Configuration
NEXT_PUBLIC_APP_NAME=AI Recipe Generator
NEXT_PUBLIC_APP_VERSION=1.0.0
"@

$envLocal | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Created .env.local" -ForegroundColor Green

# Create AWS config file
$awsConfig = @"
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: false,
    authenticationFlowType: 'USER_SRP_AUTH',
    oauth: {
      domain: \`\${process.env.NEXT_PUBLIC_USER_POOL_DOMAIN}\`,
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
"@

New-Item -ItemType Directory -Path "lib" -Force | Out-Null
$awsConfig | Out-File -FilePath "lib/aws-config.js" -Encoding UTF8
Write-Host "✅ Created lib/aws-config.js" -ForegroundColor Green

# Create API client
$apiClient = @"
import { Auth } from 'aws-amplify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

class ApiClient {
  async getAuthHeaders() {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      return {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      throw new Error('Authentication required');
    }
  }

  async generateRecipe(ingredients, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(\`\${API_BASE_URL}/recipes\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ingredients,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

  async getRecipes(limit = 20, lastEvaluatedKey = null) {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (lastEvaluatedKey) params.append('lastEvaluatedKey', encodeURIComponent(JSON.stringify(lastEvaluatedKey)));

    const response = await fetch(\`\${API_BASE_URL}/recipes?\${params}\`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

  async getRecipe(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(\`\${API_BASE_URL}/recipes/\${recipeId}\`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

  async toggleFavorite(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(\`\${API_BASE_URL}/recipes/\${recipeId}/favorite\`, {
      method: 'PUT',
      headers
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

  async getFavorites() {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(\`\${API_BASE_URL}/recipes/favorites\`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(\`\${API_BASE_URL}/health\`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(\`Health check failed: \${response.status}\`);
    }

    return response.json();
  }
}

export default new ApiClient();
"@

$apiClient | Out-File -FilePath "lib/api-client.js" -Encoding UTF8
Write-Host "✅ Created lib/api-client.js" -ForegroundColor Green

# Create basic pages structure
New-Item -ItemType Directory -Path "pages" -Force | Out-Null

# Create _app.js
$appJs = @"
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
"@

$appJs | Out-File -FilePath "pages/_app.js" -Encoding UTF8
Write-Host "✅ Created pages/_app.js" -ForegroundColor Green

# Create index.js
$indexJs = @"
import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import ApiClient from '../lib/api-client';

export default function Home() {
  const [ingredients, setIngredients] = useState(['']);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index, value) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const generateRecipe = async () => {
    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    try {
      const newRecipe = await ApiClient.generateRecipe(validIngredients);
      setRecipe(newRecipe);
    } catch (error) {
      console.error('Recipe generation failed:', error);
      alert('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI Recipe Generator
              </h1>
              <p className="text-gray-600">
                Welcome, {user.attributes.email}!
              </p>
              <button
                onClick={signOut}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </header>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Generate Recipe</h2>
              
              <div className="mb-4">
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

              <button
                onClick={generateRecipe}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Generating Recipe...' : 'Generate Recipe'}
              </button>
            </div>

            {recipe && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold mb-4">{recipe.title}</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Ingredients</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {recipe.ingredients?.map((ing, index) => (
                        <li key={index}>
                          {ing.amount} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Instructions</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      {recipe.instructions?.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="mt-6 flex gap-4 text-sm text-gray-600">
                  <span>Prep: {recipe.prepTime} min</span>
                  <span>Cook: {recipe.cookTime} min</span>
                  <span>Serves: {recipe.servings}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Authenticator>
  );
}
"@

$indexJs | Out-File -FilePath "pages/index.js" -Encoding UTF8
Write-Host "✅ Created pages/index.js" -ForegroundColor Green

# Create styles directory and globals.css
New-Item -ItemType Directory -Path "styles" -Force | Out-Null

$globalsCss = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
  body {
    color: white;
    background: black;
  }
}
"@

$globalsCss | Out-File -FilePath "styles/globals.css" -Encoding UTF8
Write-Host "✅ Created styles/globals.css" -ForegroundColor Green
# Step 4: Create deployment package
Write-Host ""
Write-Host "Step 4: Creating deployment package" -ForegroundColor Cyan

# Create README.md
$readme = @"
# AI Recipe Generator Frontend

A Next.js application for generating AI-powered recipes using AWS services.

## Features

- 🤖 AI-powered recipe generation using Claude 3 Sonnet
- 🔐 User authentication with AWS Cognito
- 📱 Responsive design with Tailwind CSS
- ☁️ Hosted on AWS Amplify
- 🔄 Real-time API integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- AWS Account with configured services
- Environment variables configured

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

\`\`\`bash
npm run build
\`\`\`

### Environment Variables

Create a \`.env.local\` file with:

\`\`\`
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
NEXT_PUBLIC_API_GATEWAY_URL=your-api-gateway-url
\`\`\`

## Deployment

This application is configured for deployment on AWS Amplify with continuous deployment from Git.

## Architecture

- **Frontend**: Next.js with TypeScript
- **Authentication**: AWS Cognito
- **API**: AWS API Gateway + Lambda
- **Database**: DynamoDB
- **AI**: Amazon Bedrock (Claude 3 Sonnet)
- **Hosting**: AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
"@

$readme | Out-File -FilePath "README.md" -Encoding UTF8
Write-Host "✅ Created README.md" -ForegroundColor Green

# Create .gitignore
$gitignore = @"
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Amplify
amplify/
.amplifyrc
"@

$gitignore | Out-File -FilePath ".gitignore" -Encoding UTF8
Write-Host "✅ Created .gitignore" -ForegroundColor Green

# Create tailwind.config.js
$tailwindConfig = @"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
"@

$tailwindConfig | Out-File -FilePath "tailwind.config.js" -Encoding UTF8
Write-Host "✅ Created tailwind.config.js" -ForegroundColor Green

# Create postcss.config.js
$postcssConfig = @"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@

$postcssConfig | Out-File -FilePath "postcss.config.js" -Encoding UTF8
Write-Host "✅ Created postcss.config.js" -ForegroundColor Green

Write-Host "✅ All project files created successfully!" -ForegroundColor Green

# Step 5: Set up monitoring
Write-Host ""
Write-Host "Step 5: Setting up monitoring" -ForegroundColor Cyan

# Create CloudWatch alarm for Amplify build failures
$buildAlarmCommand = @"
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-Amplify-Build-Failures" \
  --alarm-description "Monitor Amplify build failures" \
  --metric-name BuildFailures \
  --namespace AWS/Amplify \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=App,Value=$AppName \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:$Region`:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region $Region \
  --profile $Profile
"@

$buildAlarmResult = Invoke-AWSCommand -Command $buildAlarmCommand -Description "Create build failure alarm"

# Step 6: Generate configuration files
Write-Host ""
Write-Host "Step 6: Generating configuration files" -ForegroundColor Cyan

# Create environment configuration
$envConfig = @"
# AWS Amplify Configuration for AI Recipe Generator
# Add these to your deployment environment

AMPLIFY_APP_ID=$appId
AMPLIFY_BRANCH=main
AMPLIFY_DOMAIN=https://main.$defaultDomain

# Environment Variables (already configured in Amplify)
NEXT_PUBLIC_AWS_REGION=$Region
NEXT_PUBLIC_USER_POOL_ID=$UserPoolId
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$UserPoolClientId
NEXT_PUBLIC_API_GATEWAY_URL=$ApiGatewayUrl
NEXT_PUBLIC_APP_NAME=AI Recipe Generator
NEXT_PUBLIC_APP_VERSION=1.0.0
"@

$envConfig | Out-File -FilePath "amplify-config.env" -Encoding UTF8
Write-Host "✅ Environment configuration saved to: amplify-config.env" -ForegroundColor Green

# Create deployment script
$deployScript = @"
# AWS Amplify Deployment Commands
# Use these commands to manage your Amplify deployment

# 1. Get app information
aws amplify get-app --app-id $appId --region $Region --profile $Profile

# 2. List branches
aws amplify list-branches --app-id $appId --region $Region --profile $Profile

# 3. Start build
aws amplify start-job --app-id $appId --branch-name main --job-type RELEASE --region $Region --profile $Profile

# 4. Get job status
# aws amplify get-job --app-id $appId --branch-name main --job-id JOB_ID --region $Region --profile $Profile

# 5. Update environment variables
aws amplify update-app --app-id $appId --environment-variables NEXT_PUBLIC_AWS_REGION=$Region,NEXT_PUBLIC_USER_POOL_ID=$UserPoolId --region $Region --profile $Profile

# 6. Create domain association (optional)
# aws amplify create-domain-association --app-id $appId --domain-name "yourdomain.com" --sub-domain-settings prefix=www,branchName=main --region $Region --profile $Profile

# 7. Monitor build logs
# Check build logs in AWS Amplify Console: https://console.aws.amazon.com/amplify/home?region=$Region#/$appId

# 8. Test deployment
curl -I https://main.$defaultDomain
"@

$deployScript | Out-File -FilePath "deploy-amplify.sh" -Encoding UTF8
Write-Host "✅ Deployment script saved to: deploy-amplify.sh" -ForegroundColor Green

# Create GitHub Actions workflow (optional)
New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null

$githubWorkflow = @"
name: Deploy to AWS Amplify

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
    
    - name: Run tests
      run: npm run lint
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_AWS_REGION: \${{ secrets.NEXT_PUBLIC_AWS_REGION }}
        NEXT_PUBLIC_USER_POOL_ID: \${{ secrets.NEXT_PUBLIC_USER_POOL_ID }}
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: \${{ secrets.NEXT_PUBLIC_USER_POOL_CLIENT_ID }}
        NEXT_PUBLIC_API_GATEWAY_URL: \${{ secrets.NEXT_PUBLIC_API_GATEWAY_URL }}
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: $Region
    
    - name: Deploy to Amplify
      run: |
        aws amplify start-job --app-id $appId --branch-name main --job-type RELEASE
"@

$githubWorkflow | Out-File -FilePath ".github/workflows/deploy.yml" -Encoding UTF8
Write-Host "✅ GitHub Actions workflow saved to: .github/workflows/deploy.yml" -ForegroundColor Green

# Step 7: Summary and next steps
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 AWS Amplify Configuration Summary:" -ForegroundColor Cyan
Write-Host "App Name: $AppName" -ForegroundColor White
Write-Host "App ID: $appId" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Default Domain: https://$defaultDomain" -ForegroundColor White
Write-Host "Main Branch URL: https://main.$defaultDomain" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor White
Write-Host "Client ID: $UserPoolClientId" -ForegroundColor White
Write-Host "API Gateway URL: $ApiGatewayUrl" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files Created:" -ForegroundColor Cyan
Write-Host "• package.json - Project dependencies" -ForegroundColor White
Write-Host "• amplify.yml - Build configuration" -ForegroundColor White
Write-Host "• next.config.js - Next.js configuration" -ForegroundColor White
Write-Host "• .env.local - Environment variables" -ForegroundColor White
Write-Host "• lib/aws-config.js - AWS Amplify configuration" -ForegroundColor White
Write-Host "• lib/api-client.js - API client" -ForegroundColor White
Write-Host "• pages/index.js - Main application page" -ForegroundColor White
Write-Host "• pages/_app.js - App configuration" -ForegroundColor White
Write-Host "• styles/globals.css - Global styles" -ForegroundColor White
Write-Host "• README.md - Project documentation" -ForegroundColor White
Write-Host "• .github/workflows/deploy.yml - CI/CD workflow" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Initialize Git repository: git init && git add . && git commit -m 'Initial commit'" -ForegroundColor White
Write-Host "2. Push to GitHub/GitLab repository" -ForegroundColor White
Write-Host "3. Connect repository to Amplify app for continuous deployment" -ForegroundColor White
Write-Host "4. Test local development: npm install && npm run dev" -ForegroundColor White
Write-Host "5. Verify authentication and API integration" -ForegroundColor White
Write-Host "6. Proceed to Phase 2: Backend Infrastructure Development" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Important URLs:" -ForegroundColor Yellow
Write-Host "• Amplify Console: https://console.aws.amazon.com/amplify/home?region=$Region#/$appId" -ForegroundColor White
Write-Host "• Application URL: https://main.$defaultDomain" -ForegroundColor White
Write-Host "• Local Development: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💰 Cost Monitoring:" -ForegroundColor Yellow
Write-Host "• Free tier: 1,000 build minutes, 15 GB served per month" -ForegroundColor White
Write-Host "• Build minutes: \$0.01 per minute after free tier" -ForegroundColor White
Write-Host "• Data served: \$0.15 per GB after free tier" -ForegroundColor White
Write-Host "• Monitor usage in Amplify Console and CloudWatch" -ForegroundColor White

Write-Host ""
Write-Host "✅ AWS Amplify setup completed successfully!" -ForegroundColor Green