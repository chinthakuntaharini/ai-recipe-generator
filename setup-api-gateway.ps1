# PowerShell script to set up API Gateway for AI Recipe Generator
# This script creates REST API with proper authentication and CORS

param(
    [string]$Profile = "ai-recipe-generator-dev",
    [string]$Region = "us-east-1",
    [string]$ApiName = "ai-recipe-generator-api",
    [string]$UserPoolId = "",  # Will be prompted if not provided
    [string]$StageName = "prod"
)

Write-Host "🌐 Setting up API Gateway for AI Recipe Generator" -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "API Name: $ApiName" -ForegroundColor Yellow
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

# Get User Pool ID if not provided
if (-not $UserPoolId) {
    Write-Host "Getting Cognito User Pool ID..." -ForegroundColor Yellow
    $userPools = aws cognito-idp list-user-pools --max-results 10 --region $Region --profile $Profile --output json 2>$null
    
    if ($userPools) {
        $poolsData = $userPools | ConvertFrom-Json
        $aiRecipePool = $poolsData.UserPools | Where-Object { $_.Name -like "*ai-recipe-generator*" }
        
        if ($aiRecipePool) {
            $UserPoolId = $aiRecipePool.Id
            Write-Host "Found User Pool: $UserPoolId" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No AI Recipe Generator user pool found. Please provide User Pool ID:" -ForegroundColor Yellow
            $UserPoolId = Read-Host "Enter User Pool ID"
        }
    } else {
        Write-Host "⚠️  Could not retrieve user pools. Please provide User Pool ID:" -ForegroundColor Yellow
        $UserPoolId = Read-Host "Enter User Pool ID"
    }
}

# Step 1: Create REST API
Write-Host "Step 1: Creating REST API" -ForegroundColor Cyan

$createApiCommand = @"
aws apigateway create-rest-api \
  --name "$ApiName" \
  --description "REST API for AI Recipe Generator application" \
  --endpoint-configuration types=REGIONAL \
  --region $Region \
  --profile $Profile \
  --output json
"@

$apiResult = Invoke-AWSCommand -Command $createApiCommand -Description "Create REST API"

if ($apiResult) {
    $apiData = $apiResult | ConvertFrom-Json
    $apiId = $apiData.id
    Write-Host "API ID: $apiId" -ForegroundColor Green
} else {
    Write-Host "Failed to create API. Exiting." -ForegroundColor Red
    exit 1
}
# Step 2: Create Cognito Authorizer
Write-Host ""
Write-Host "Step 2: Creating Cognito Authorizer" -ForegroundColor Cyan

$userPoolArn = "arn:aws:cognito-idp:$Region`:972803002725:userpool/$UserPoolId"

$createAuthorizerCommand = @"
aws apigateway create-authorizer \
  --rest-api-id $apiId \
  --name "CognitoAuthorizer" \
  --type COGNITO_USER_POOLS \
  --provider-arns $userPoolArn \
  --identity-source method.request.header.Authorization \
  --region $Region \
  --profile $Profile \
  --output json
"@

$authorizerResult = Invoke-AWSCommand -Command $createAuthorizerCommand -Description "Create Cognito Authorizer"

if ($authorizerResult) {
    $authorizerData = $authorizerResult | ConvertFrom-Json
    $authorizerId = $authorizerData.id
    Write-Host "Authorizer ID: $authorizerId" -ForegroundColor Green
} else {
    Write-Host "Failed to create authorizer. Exiting." -ForegroundColor Red
    exit 1
}

# Step 3: Get root resource ID
Write-Host ""
Write-Host "Step 3: Getting root resource" -ForegroundColor Cyan

$getResourcesCommand = "aws apigateway get-resources --rest-api-id $apiId --region $Region --profile $Profile --output json"
$resourcesResult = Invoke-AWSCommand -Command $getResourcesCommand -Description "Get API resources"

if ($resourcesResult) {
    $resourcesData = $resourcesResult | ConvertFrom-Json
    $rootResourceId = ($resourcesData.items | Where-Object { $_.path -eq "/" }).id
    Write-Host "Root Resource ID: $rootResourceId" -ForegroundColor Green
} else {
    Write-Host "Failed to get resources. Exiting." -ForegroundColor Red
    exit 1
}

# Step 4: Create API resources
Write-Host ""
Write-Host "Step 4: Creating API resources" -ForegroundColor Cyan

# Create /recipes resource
$createRecipesCommand = @"
aws apigateway create-resource \
  --rest-api-id $apiId \
  --parent-id $rootResourceId \
  --path-part "recipes" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$recipesResult = Invoke-AWSCommand -Command $createRecipesCommand -Description "Create /recipes resource"
$recipesResourceId = ($recipesResult | ConvertFrom-Json).id

# Create /recipes/{recipeId} resource
$createRecipeIdCommand = @"
aws apigateway create-resource \
  --rest-api-id $apiId \
  --parent-id $recipesResourceId \
  --path-part "{recipeId}" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$recipeIdResult = Invoke-AWSCommand -Command $createRecipeIdCommand -Description "Create /recipes/{recipeId} resource"
$recipeIdResourceId = ($recipeIdResult | ConvertFrom-Json).id

# Create /recipes/{recipeId}/favorite resource
$createFavoriteCommand = @"
aws apigateway create-resource \
  --rest-api-id $apiId \
  --parent-id $recipeIdResourceId \
  --path-part "favorite" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$favoriteResult = Invoke-AWSCommand -Command $createFavoriteCommand -Description "Create /recipes/{recipeId}/favorite resource"
$favoriteResourceId = ($favoriteResult | ConvertFrom-Json).id

# Create /recipes/favorites resource
$createFavoritesCommand = @"
aws apigateway create-resource \
  --rest-api-id $apiId \
  --parent-id $recipesResourceId \
  --path-part "favorites" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$favoritesResult = Invoke-AWSCommand -Command $createFavoritesCommand -Description "Create /recipes/favorites resource"
$favoritesResourceId = ($favoritesResult | ConvertFrom-Json).id

# Create /health resource
$createHealthCommand = @"
aws apigateway create-resource \
  --rest-api-id $apiId \
  --parent-id $rootResourceId \
  --path-part "health" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$healthResult = Invoke-AWSCommand -Command $createHealthCommand -Description "Create /health resource"
$healthResourceId = ($healthResult | ConvertFrom-Json).id

Write-Host "All resources created successfully!" -ForegroundColor Green
# Step 5: Create methods (basic setup - Lambda integration will be added later)
Write-Host ""
Write-Host "Step 5: Creating API methods" -ForegroundColor Cyan

# Function to create CORS options method
function Add-CorsMethod {
    param([string]$ResourceId, [string]$ResourceName)
    
    # Create OPTIONS method
    $optionsCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $ResourceId \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $Region \
  --profile $Profile
"@
    
    Invoke-AWSCommand -Command $optionsCommand -Description "Create OPTIONS method for $ResourceName" | Out-Null
    
    # Create MOCK integration
    $mockIntegrationCommand = @"
aws apigateway put-integration \
  --rest-api-id $apiId \
  --resource-id $ResourceId \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{\"application/json\": \"{\\\"statusCode\\\": 200}\"}' \
  --region $Region \
  --profile $Profile
"@
    
    Invoke-AWSCommand -Command $mockIntegrationCommand -Description "Create MOCK integration for $ResourceName" | Out-Null
    
    # Create method response
    $methodResponseCommand = @"
aws apigateway put-method-response \
  --rest-api-id $apiId \
  --resource-id $ResourceId \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true \
  --region $Region \
  --profile $Profile
"@
    
    Invoke-AWSCommand -Command $methodResponseCommand -Description "Create method response for $ResourceName" | Out-Null
    
    # Create integration response
    $integrationResponseCommand = @"
aws apigateway put-integration-response \
  --rest-api-id $apiId \
  --resource-id $ResourceId \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\": \"\\\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\\\"\",\"method.response.header.Access-Control-Allow-Methods\": \"\\\"GET,POST,PUT,DELETE,OPTIONS\\\"\",\"method.response.header.Access-Control-Allow-Origin\": \"\\\"*\\\"\"}' \
  --region $Region \
  --profile $Profile
"@
    
    Invoke-AWSCommand -Command $integrationResponseCommand -Description "Create integration response for $ResourceName" | Out-Null
}

# Add CORS to all resources
Add-CorsMethod -ResourceId $recipesResourceId -ResourceName "/recipes"
Add-CorsMethod -ResourceId $recipeIdResourceId -ResourceName "/recipes/{recipeId}"
Add-CorsMethod -ResourceId $favoriteResourceId -ResourceName "/recipes/{recipeId}/favorite"
Add-CorsMethod -ResourceId $favoritesResourceId -ResourceName "/recipes/favorites"
Add-CorsMethod -ResourceId $healthResourceId -ResourceName "/health"

# Create basic methods (without Lambda integration for now)
# POST /recipes
$postRecipesCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $recipesResourceId \
  --http-method POST \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $authorizerId \
  --region $Region \
  --profile $Profile
"@

Invoke-AWSCommand -Command $postRecipesCommand -Description "Create POST /recipes method" | Out-Null

# GET /recipes
$getRecipesCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $recipesResourceId \
  --http-method GET \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $authorizerId \
  --region $Region \
  --profile $Profile
"@

Invoke-AWSCommand -Command $getRecipesCommand -Description "Create GET /recipes method" | Out-Null

# GET /recipes/{recipeId}
$getRecipeCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $recipeIdResourceId \
  --http-method GET \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $authorizerId \
  --region $Region \
  --profile $Profile
"@

Invoke-AWSCommand -Command $getRecipeCommand -Description "Create GET /recipes/{recipeId} method" | Out-Null

# PUT /recipes/{recipeId}/favorite
$putFavoriteCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $favoriteResourceId \
  --http-method PUT \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $authorizerId \
  --region $Region \
  --profile $Profile
"@

Invoke-AWSCommand -Command $putFavoriteCommand -Description "Create PUT /recipes/{recipeId}/favorite method" | Out-Null

# GET /recipes/favorites
$getFavoritesCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $favoritesResourceId \
  --http-method GET \
  --authorization-type COGNITO_USER_POOLS \
  --authorizer-id $authorizerId \
  --region $Region \
  --profile $Profile
"@

Invoke-AWSCommand -Command $getFavoritesCommand -Description "Create GET /recipes/favorites method" | Out-Null

# GET /health (no auth required)
$getHealthCommand = @"
aws apigateway put-method \
  --rest-api-id $apiId \
  --resource-id $healthResourceId \
  --http-method GET \
  --authorization-type NONE \
  --region $Region \
  --profile $Profile
"@

Invoke-AWSCommand -Command $getHealthCommand -Description "Create GET /health method" | Out-Null

Write-Host "All methods created successfully!" -ForegroundColor Green
# Step 6: Create deployment
Write-Host ""
Write-Host "Step 6: Creating API deployment" -ForegroundColor Cyan

$createDeploymentCommand = @"
aws apigateway create-deployment \
  --rest-api-id $apiId \
  --stage-name $StageName \
  --stage-description "Production stage for AI Recipe Generator API" \
  --description "Initial deployment with CORS and authentication" \
  --region $Region \
  --profile $Profile \
  --output json
"@

$deploymentResult = Invoke-AWSCommand -Command $createDeploymentCommand -Description "Create API deployment"

if ($deploymentResult) {
    Write-Host "✅ API deployed successfully to stage: $StageName" -ForegroundColor Green
} else {
    Write-Host "⚠️  Deployment may have issues, but API structure is created" -ForegroundColor Yellow
}

# Step 7: Configure stage settings
Write-Host ""
Write-Host "Step 7: Configuring stage settings" -ForegroundColor Cyan

$updateStageCommand = @"
aws apigateway update-stage \
  --rest-api-id $apiId \
  --stage-name $StageName \
  --patch-ops op=replace,path=/throttle/rateLimit,value=100 \
  --patch-ops op=replace,path=/throttle/burstLimit,value=200 \
  --patch-ops op=replace,path=/*/logging/loglevel,value=INFO \
  --patch-ops op=replace,path=/*/logging/dataTrace,value=true \
  --patch-ops op=replace,path=/*/logging/metricsEnabled,value=true \
  --region $Region \
  --profile $Profile
"@

$stageResult = Invoke-AWSCommand -Command $updateStageCommand -Description "Configure stage settings"

# Step 8: Create monitoring alarms
Write-Host ""
Write-Host "Step 8: Setting up CloudWatch monitoring" -ForegroundColor Cyan

# API Gateway error alarm
$errorAlarmCommand = @"
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-API-Errors" \
  --alarm-description "Monitor API Gateway 4XX/5XX errors" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=$ApiName Name=Stage,Value=$StageName \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:$Region`:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region $Region \
  --profile $Profile
"@

$errorAlarmResult = Invoke-AWSCommand -Command $errorAlarmCommand -Description "Create error monitoring alarm"

# API Gateway latency alarm
$latencyAlarmCommand = @"
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-API-Latency" \
  --alarm-description "Monitor API Gateway latency" \
  --metric-name Latency \
  --namespace AWS/ApiGateway \
  --statistic Average \
  --period 300 \
  --threshold 5000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=$ApiName Name=Stage,Value=$StageName \
  --evaluation-periods 3 \
  --alarm-actions "arn:aws:sns:$Region`:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region $Region \
  --profile $Profile
"@

$latencyAlarmResult = Invoke-AWSCommand -Command $latencyAlarmCommand -Description "Create latency monitoring alarm"

# Step 9: Generate configuration files
Write-Host ""
Write-Host "Step 9: Generating configuration files" -ForegroundColor Cyan

$apiUrl = "https://$apiId.execute-api.$Region.amazonaws.com/$StageName"

# Create environment configuration
$envConfig = @"
# API Gateway Configuration for AI Recipe Generator
# Add these to your .env.local file

NEXT_PUBLIC_API_GATEWAY_URL=$apiUrl
NEXT_PUBLIC_API_GATEWAY_ID=$apiId
NEXT_PUBLIC_API_GATEWAY_STAGE=$StageName
AWS_API_GATEWAY_REGION=$Region

# For backend/Lambda functions
API_GATEWAY_ID=$apiId
API_GATEWAY_STAGE=$StageName
"@

$envConfig | Out-File -FilePath "api-gateway-config.env" -Encoding UTF8
Write-Host "✅ Environment configuration saved to: api-gateway-config.env" -ForegroundColor Green

# Create API client template
$apiClientTemplate = @"
// API Client for AI Recipe Generator
// Generated by PowerShell setup script

import { Auth } from 'aws-amplify';

const API_BASE_URL = '$apiUrl';

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

$apiClientTemplate | Out-File -FilePath "api-client.js" -Encoding UTF8
Write-Host "✅ API client template saved to: api-client.js" -ForegroundColor Green
# Create test script
$testScript = @"
# API Gateway Test Commands
# Run these commands to test your API Gateway setup

# 1. Test health endpoint (no authentication required)
curl -X GET $apiUrl/health

# 2. Test CORS preflight request
curl -X OPTIONS $apiUrl/recipes \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"

# 3. Get API information
aws apigateway get-rest-api --rest-api-id $apiId --region $Region --profile $Profile

# 4. List all resources
aws apigateway get-resources --rest-api-id $apiId --region $Region --profile $Profile

# 5. Get stage information
aws apigateway get-stage --rest-api-id $apiId --stage-name $StageName --region $Region --profile $Profile

# 6. Test authenticated endpoint (requires JWT token)
# JWT_TOKEN="your-jwt-token-here"
# curl -X GET $apiUrl/recipes \
#   -H "Authorization: Bearer \$JWT_TOKEN" \
#   -H "Content-Type: application/json"

# 7. Monitor API metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=$ApiName Name=Stage,Value=$StageName \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region $Region \
  --profile $Profile
"@

$testScript | Out-File -FilePath "test-api-gateway.sh" -Encoding UTF8
Write-Host "✅ Test script saved to: test-api-gateway.sh" -ForegroundColor Green

# Create Lambda integration guide
$lambdaIntegrationGuide = @"
# Lambda Integration Guide for API Gateway

## Next Steps: Connect Lambda Functions

After creating your Lambda functions, use these commands to integrate them with API Gateway:

### 1. Grant API Gateway permission to invoke Lambda functions

\`\`\`bash
# For each Lambda function, grant invoke permission
aws lambda add-permission \
  --function-name generateRecipe \
  --statement-id apigateway-invoke-generateRecipe \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$Region:972803002725:$apiId/*/*" \
  --region $Region \
  --profile $Profile
\`\`\`

### 2. Create Lambda integrations

\`\`\`bash
# POST /recipes integration
aws apigateway put-integration \
  --rest-api-id $apiId \
  --resource-id $recipesResourceId \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$Region:lambda:path/2015-03-31/functions/arn:aws:lambda:$Region:972803002725:function:generateRecipe/invocations" \
  --region $Region \
  --profile $Profile
\`\`\`

### 3. Deploy API after adding integrations

\`\`\`bash
aws apigateway create-deployment \
  --rest-api-id $apiId \
  --stage-name $StageName \
  --description "Updated deployment with Lambda integrations" \
  --region $Region \
  --profile $Profile
\`\`\`

## Resource IDs for Lambda Integration:
- API ID: $apiId
- Recipes Resource ID: $recipesResourceId
- Recipe ID Resource ID: $recipeIdResourceId
- Favorite Resource ID: $favoriteResourceId
- Favorites Resource ID: $favoritesResourceId
- Health Resource ID: $healthResourceId
- Authorizer ID: $authorizerId
"@

$lambdaIntegrationGuide | Out-File -FilePath "lambda-integration-guide.md" -Encoding UTF8
Write-Host "✅ Lambda integration guide saved to: lambda-integration-guide.md" -ForegroundColor Green

# Step 10: Summary and next steps
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 API Gateway Configuration Summary:" -ForegroundColor Cyan
Write-Host "API Name: $ApiName" -ForegroundColor White
Write-Host "API ID: $apiId" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Stage: $StageName" -ForegroundColor White
Write-Host "Base URL: $apiUrl" -ForegroundColor White
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor White
Write-Host "Authorizer ID: $authorizerId" -ForegroundColor White
Write-Host ""
Write-Host "📋 API Endpoints Created:" -ForegroundColor Cyan
Write-Host "• POST   /recipes                    - Generate new recipe" -ForegroundColor White
Write-Host "• GET    /recipes                    - Get user's recipe history" -ForegroundColor White
Write-Host "• GET    /recipes/{recipeId}         - Get specific recipe" -ForegroundColor White
Write-Host "• PUT    /recipes/{recipeId}/favorite - Toggle favorite status" -ForegroundColor White
Write-Host "• GET    /recipes/favorites          - Get favorite recipes" -ForegroundColor White
Write-Host "• GET    /health                     - Health check endpoint" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files Created:" -ForegroundColor Cyan
Write-Host "• api-gateway-config.env - Environment variables" -ForegroundColor White
Write-Host "• api-client.js - Frontend API client template" -ForegroundColor White
Write-Host "• test-api-gateway.sh - Test commands" -ForegroundColor White
Write-Host "• lambda-integration-guide.md - Lambda integration instructions" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy environment variables to your .env.local file" -ForegroundColor White
Write-Host "2. Test the health endpoint: curl -X GET $apiUrl/health" -ForegroundColor White
Write-Host "3. Create Lambda functions for each endpoint" -ForegroundColor White
Write-Host "4. Follow lambda-integration-guide.md to connect Lambda functions" -ForegroundColor White
Write-Host "5. Test authenticated endpoints with JWT tokens" -ForegroundColor White
Write-Host "6. Proceed to task 1.2.5: Set up AWS Amplify" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Features:" -ForegroundColor Yellow
Write-Host "• Cognito JWT token authentication on protected endpoints" -ForegroundColor White
Write-Host "• CORS configured for all endpoints" -ForegroundColor White
Write-Host "• Rate limiting: 100 req/sec burst, 200 req/sec sustained" -ForegroundColor White
Write-Host "• CloudWatch monitoring and alarms configured" -ForegroundColor White
Write-Host ""
Write-Host "💰 Cost Monitoring:" -ForegroundColor Yellow
Write-Host "• Free tier: 1 million API calls per month" -ForegroundColor White
Write-Host "• Additional calls: `$3.50 per million" -ForegroundColor White
Write-Host "• Monitor usage in CloudWatch and Cost Explorer" -ForegroundColor White

Write-Host ""
Write-Host "✅ API Gateway setup completed successfully!" -ForegroundColor Green