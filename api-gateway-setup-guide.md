# API Gateway Setup Guide for AI Recipe Generator

## Task 1.2.4: Configure API Gateway for REST API endpoints

### Overview
API Gateway will serve as the entry point for all client requests to the AI Recipe Generator backend. It will handle authentication, routing, CORS, and rate limiting while integrating with Lambda functions and Cognito for secure access.

**Target Account:** 972803002725 (Vedanth Raj)  
**Region:** us-east-1  
**Free Tier Limits:** 1 million API calls per month

## API Design

### REST API Endpoints

```
AI Recipe Generator API v1
Base URL: https://api-id.execute-api.us-east-1.amazonaws.com/prod

Authentication: Bearer JWT token from Cognito
Content-Type: application/json
```

#### Endpoint Structure
```
POST   /recipes                    # Generate new recipe
GET    /recipes                    # Get user's recipe history
GET    /recipes/{recipeId}         # Get specific recipe
PUT    /recipes/{recipeId}/favorite # Toggle favorite status
DELETE /recipes/{recipeId}         # Delete recipe
GET    /recipes/favorites          # Get favorite recipes
GET    /recipes/search             # Search recipes by ingredients
GET    /health                     # Health check endpoint
```

### Request/Response Schemas

#### POST /recipes - Generate Recipe
**Request:**
```json
{
  "ingredients": ["chicken breast", "rice", "onion"],
  "dietaryRestrictions": ["gluten-free"],
  "cuisine": "Mediterranean",
  "servings": 4
}
```

**Response:**
```json
{
  "recipeId": "recipe-uuid",
  "title": "Mediterranean Chicken and Rice",
  "ingredients": [
    {"name": "chicken breast", "amount": "2", "unit": "pieces"}
  ],
  "instructions": ["Step 1...", "Step 2..."],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "nutritionInfo": {
    "calories": 450,
    "protein": 35,
    "carbs": 45,
    "fat": 12
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### GET /recipes - Recipe History
**Query Parameters:**
- `limit`: Number of recipes to return (default: 20, max: 100)
- `lastEvaluatedKey`: Pagination token

**Response:**
```json
{
  "recipes": [...],
  "lastEvaluatedKey": "pagination-token",
  "count": 15
}
```

## Step 1: Create REST API

### Using AWS Management Console

#### 1.1 Navigate to API Gateway
1. Log into AWS Console (Account: 972803002725)
2. Go to Services → Networking & Content Delivery → API Gateway
3. Click "Create API"

#### 1.2 Choose API Type
1. Select "REST API" (not REST API Private)
2. Click "Build"

#### 1.3 Configure API Settings
1. **API name**: `ai-recipe-generator-api`
2. **Description**: `REST API for AI Recipe Generator application`
3. **Endpoint Type**: Regional
4. Click "Create API"

### Using AWS CLI

```bash
# Create REST API
aws apigateway create-rest-api \
  --name "ai-recipe-generator-api" \
  --description "REST API for AI Recipe Generator application" \
  --endpoint-configuration types=REGIONAL \
  --region us-east-1 \
  --profile ai-recipe-generator-dev \
  --output json
```

## Step 2: Create Cognito Authorizer

### Using AWS Management Console
1. Go to your API → Authorizers
2. Click "Create New Authorizer"
3. **Name**: `CognitoAuthorizer`
4. **Type**: Cognito
5. **Cognito User Pool**: Select your user pool
6. **Token Source**: Authorization
7. **Token Validation**: Leave empty
8. Click "Create"

### Using AWS CLI
```bash
# Get User Pool ARN (replace with your actual user pool ID)
USER_POOL_ID="us-east-1_XXXXXXXXX"
USER_POOL_ARN="arn:aws:cognito-idp:us-east-1:972803002725:userpool/$USER_POOL_ID"

# Get API ID
API_ID=$(aws apigateway get-rest-apis --region us-east-1 --profile ai-recipe-generator-dev --query 'items[?name==`ai-recipe-generator-api`].id' --output text)

# Create Cognito authorizer
aws apigateway create-authorizer \
  --rest-api-id $API_ID \
  --name "CognitoAuthorizer" \
  --type COGNITO_USER_POOLS \
  --provider-arns $USER_POOL_ARN \
  --identity-source method.request.header.Authorization \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

## Step 3: Create API Resources and Methods

### Resource Structure
```
/
├── recipes
│   ├── {recipeId}
│   │   └── favorite
│   ├── favorites
│   └── search
└── health
```

### Using AWS CLI Script

```bash
#!/bin/bash
# API Gateway setup script

API_ID="your-api-id"  # Replace with actual API ID
REGION="us-east-1"
PROFILE="ai-recipe-generator-dev"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --profile $PROFILE --query 'items[?path==`/`].id' --output text)

# Create /recipes resource
RECIPES_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part "recipes" \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

# Create /recipes/{recipeId} resource
RECIPE_ID_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $RECIPES_RESOURCE_ID \
  --path-part "{recipeId}" \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

# Create /recipes/{recipeId}/favorite resource
FAVORITE_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $RECIPE_ID_RESOURCE_ID \
  --path-part "favorite" \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

# Create /recipes/favorites resource
FAVORITES_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $RECIPES_RESOURCE_ID \
  --path-part "favorites" \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

# Create /recipes/search resource
SEARCH_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $RECIPES_RESOURCE_ID \
  --path-part "search" \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

# Create /health resource
HEALTH_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part "health" \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

echo "Resources created successfully!"
echo "Recipes Resource ID: $RECIPES_RESOURCE_ID"
echo "Recipe ID Resource ID: $RECIPE_ID_RESOURCE_ID"
echo "Favorite Resource ID: $FAVORITE_RESOURCE_ID"
echo "Favorites Resource ID: $FAVORITES_RESOURCE_ID"
echo "Search Resource ID: $SEARCH_RESOURCE_ID"
echo "Health Resource ID: $HEALTH_RESOURCE_ID"
```

## Step 4: Create Methods and Integrations

### Method Configuration Template

#### POST /recipes - Generate Recipe
```bash
# Create POST method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method POST \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $AUTHORIZER_ID \
  --request-validator-id $REQUEST_VALIDATOR_ID \
  --region $REGION \
  --profile $PROFILE

# Create Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:972803002725:function:generateRecipe/invocations" \
  --region $REGION \
  --profile $PROFILE
```

#### GET /recipes - Recipe History
```bash
# Create GET method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method GET \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $AUTHORIZER_ID \
  --request-parameters method.request.querystring.limit=false,method.request.querystring.lastEvaluatedKey=false \
  --region $REGION \
  --profile $PROFILE

# Create Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:972803002725:function:getRecipes/invocations" \
  --region $REGION \
  --profile $PROFILE
```

## Step 5: Configure CORS

### Enable CORS for All Resources
```bash
# Enable CORS for /recipes resource
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION \
  --profile $PROFILE

# Create CORS integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
  --region $REGION \
  --profile $PROFILE

# Configure CORS response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true \
  --region $REGION \
  --profile $PROFILE

# Configure CORS integration response
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RECIPES_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"}' \
  --region $REGION \
  --profile $PROFILE
```

## Step 6: Request Validation

### Create Request Validator
```bash
# Create request validator
VALIDATOR_ID=$(aws apigateway create-request-validator \
  --rest-api-id $API_ID \
  --name "ValidateRequestBody" \
  --validate-request-body true \
  --validate-request-parameters true \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)
```

### Request Models

#### Recipe Generation Model
```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Recipe Generation Request",
  "type": "object",
  "properties": {
    "ingredients": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "minItems": 1,
      "maxItems": 20
    },
    "dietaryRestrictions": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["vegan", "vegetarian", "gluten-free", "dairy-free", "nut-free", "low-carb", "keto"]
      }
    },
    "cuisine": {
      "type": "string",
      "maxLength": 50
    },
    "servings": {
      "type": "integer",
      "minimum": 1,
      "maximum": 20
    }
  },
  "required": ["ingredients"],
  "additionalProperties": false
}
```

## Step 7: Rate Limiting and Throttling

### Usage Plans and API Keys
```bash
# Create usage plan
USAGE_PLAN_ID=$(aws apigateway create-usage-plan \
  --name "ai-recipe-generator-plan" \
  --description "Usage plan for AI Recipe Generator" \
  --throttle burstLimit=100,rateLimit=50 \
  --quota limit=10000,period=MONTH \
  --region $REGION \
  --profile $PROFILE \
  --query 'id' \
  --output text)

# Associate API stage with usage plan
aws apigateway create-usage-plan-key \
  --usage-plan-id $USAGE_PLAN_ID \
  --key-id $API_KEY_ID \
  --key-type API_KEY \
  --region $REGION \
  --profile $PROFILE
```

## Step 8: Deploy API

### Create Deployment
```bash
# Create deployment
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --stage-description "Production stage for AI Recipe Generator API" \
  --description "Initial deployment" \
  --region $REGION \
  --profile $PROFILE
```

### Stage Configuration
```bash
# Configure stage settings
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name prod \
  --patch-ops op=replace,path=/throttle/rateLimit,value=100 \
  --patch-ops op=replace,path=/throttle/burstLimit,value=200 \
  --patch-ops op=replace,path=/logging/loglevel,value=INFO \
  --patch-ops op=replace,path=/logging/dataTrace,value=true \
  --patch-ops op=replace,path=/logging/metricsEnabled,value=true \
  --region $REGION \
  --profile $PROFILE
```

## Step 9: Lambda Integration Permissions

### Grant API Gateway Permission to Invoke Lambda
```bash
# For each Lambda function, grant invoke permission
aws lambda add-permission \
  --function-name generateRecipe \
  --statement-id apigateway-invoke-generateRecipe \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:972803002725:$API_ID/*/*" \
  --region $REGION \
  --profile $PROFILE

aws lambda add-permission \
  --function-name getRecipes \
  --statement-id apigateway-invoke-getRecipes \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:972803002725:$API_ID/*/*" \
  --region $REGION \
  --profile $PROFILE
```

## Step 10: Testing and Monitoring

### Test API Endpoints

#### Health Check Test
```bash
# Test health endpoint (no auth required)
curl -X GET https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health
```

#### Authenticated Request Test
```bash
# Get JWT token from Cognito (implement in your app)
JWT_TOKEN="your-jwt-token"

# Test recipe generation
curl -X POST https://$API_ID.execute-api.$REGION.amazonaws.com/prod/recipes \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": ["chicken", "rice", "onion"],
    "servings": 4
  }'
```

### CloudWatch Monitoring
```bash
# Create API Gateway monitoring alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-API-Errors" \
  --alarm-description "Monitor API Gateway 4XX/5XX errors" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=ai-recipe-generator-api Name=Stage,Value=prod \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:$REGION:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region $REGION \
  --profile $PROFILE
```

## Step 11: Frontend Integration

### API Client Configuration
```javascript
// lib/api-client.js
import { Auth } from 'aws-amplify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

class ApiClient {
  async getAuthHeaders() {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      throw new Error('Authentication required');
    }
  }

  async generateRecipe(ingredients, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ingredients,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getRecipes(limit = 20, lastEvaluatedKey = null) {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (lastEvaluatedKey) params.append('lastEvaluatedKey', encodeURIComponent(JSON.stringify(lastEvaluatedKey)));

    const response = await fetch(`${API_BASE_URL}/recipes?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getRecipe(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async toggleFavorite(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/favorite`, {
      method: 'PUT',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async deleteRecipe(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
  }

  async getFavorites() {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/favorites`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async searchRecipes(ingredients) {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    params.append('ingredients', ingredients.join(','));

    const response = await fetch(`${API_BASE_URL}/recipes/search?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

export default new ApiClient();
```

### React Hook for API Integration
```javascript
// hooks/useRecipes.js
import { useState, useEffect } from 'react';
import ApiClient from '../lib/api-client';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateRecipe = async (ingredients, options) => {
    setLoading(true);
    setError(null);
    
    try {
      const recipe = await ApiClient.generateRecipe(ingredients, options);
      setRecipes(prev => [recipe, ...prev]);
      return recipe;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async (limit, lastEvaluatedKey) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ApiClient.getRecipes(limit, lastEvaluatedKey);
      setRecipes(result.recipes);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipeId) => {
    try {
      const updatedRecipe = await ApiClient.toggleFavorite(recipeId);
      setRecipes(prev => 
        prev.map(recipe => 
          recipe.recipeId === recipeId ? updatedRecipe : recipe
        )
      );
      return updatedRecipe;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    recipes,
    loading,
    error,
    generateRecipe,
    loadRecipes,
    toggleFavorite
  };
}
```

## Security Best Practices

### 1. Authentication and Authorization
- Use Cognito JWT tokens for all protected endpoints
- Validate tokens in Lambda authorizer
- Implement proper RBAC if needed

### 2. Input Validation
- Validate all request parameters and body
- Use request validators in API Gateway
- Sanitize inputs in Lambda functions

### 3. Rate Limiting
- Implement usage plans and API keys
- Set appropriate throttling limits
- Monitor for abuse patterns

### 4. CORS Configuration
- Configure CORS properly for your frontend domain
- Avoid using wildcard (*) in production
- Validate origin headers

### 5. Logging and Monitoring
- Enable CloudWatch logging
- Monitor error rates and latency
- Set up alerts for anomalies

## Cost Optimization

### Free Tier Limits
- **1 million API calls** per month free
- **Additional calls**: $3.50 per million
- **Data transfer**: First 1 GB free, then $0.09/GB

### Best Practices
1. Implement caching where appropriate
2. Use efficient Lambda functions
3. Monitor usage patterns
4. Optimize request/response sizes
5. Consider API Gateway caching for static responses

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- Verify CORS configuration on all methods
- Check preflight OPTIONS requests
- Validate response headers

#### 2. Authentication Failures
- Verify Cognito authorizer configuration
- Check JWT token format and expiration
- Validate user pool settings

#### 3. Lambda Integration Issues
- Verify Lambda permissions for API Gateway
- Check Lambda function ARNs
- Validate integration configuration

#### 4. Request Validation Errors
- Check request model schemas
- Verify required parameters
- Validate content types

## Next Steps

After completing API Gateway setup:

1. ✅ **Test all endpoints** with sample requests
2. ✅ **Verify CORS configuration** with frontend
3. ⏭️ **Proceed to task 1.2.5**: Set up AWS Amplify
4. ⏭️ **Implement Lambda functions** for each endpoint
5. ⏭️ **Integrate with frontend** application

---

**API Gateway Configuration Summary:**
- API Name: `ai-recipe-generator-api`
- Authentication: Cognito User Pools
- Endpoints: 8 REST endpoints with proper CORS
- Rate Limiting: 100 requests/second burst, 50/second sustained
- Monitoring: CloudWatch metrics and alarms enabled
- Security: JWT token validation, input validation, throttling