# Recipe Generation Lambda Function Implementation

## Overview

This document describes the implementation of Task 2.2.1: Create Lambda function for recipe generation. The implementation includes a complete serverless recipe generation service using Amazon Bedrock and Claude 3 Sonnet model.

## Implementation Summary

### ✅ Completed Components

1. **Recipe Generation Lambda Function** (`src/handlers/recipe-handler.ts`)
   - JWT authentication integration
   - Input validation and sanitization
   - Error handling with proper HTTP status codes
   - CORS support for frontend integration

2. **Bedrock Service Integration** (`src/utils/bedrock-service.ts`)
   - Amazon Bedrock Runtime Client integration
   - Claude 3 Sonnet model configuration
   - Intelligent prompt engineering
   - Response parsing and validation

3. **Type Definitions** (`src/types/recipe-types.ts`)
   - Complete TypeScript interfaces for recipes
   - Request/response type safety
   - Error handling types

4. **CloudFormation Infrastructure** (`cloudformation/recipe-generation-stack.yaml`)
   - Lambda function with proper IAM roles
   - API Gateway REST API configuration
   - CORS-enabled endpoints
   - CloudWatch logging setup

5. **Deployment Scripts** (`deploy-recipe-generation.sh`)
   - Automated build and deployment
   - Environment configuration
   - Function code updates

6. **Comprehensive Testing** 
   - Unit tests for all components
   - Integration test scenarios
   - Error handling validation

## Key Features

### Authentication & Security
- JWT token validation using Cognito
- Proper error handling for authentication failures
- Input sanitization and validation
- CORS configuration for secure frontend access

### AI Recipe Generation
- Integration with Amazon Bedrock Claude 3 Sonnet
- Intelligent prompt engineering for recipe generation
- Support for dietary restrictions and cuisine preferences
- Structured JSON response parsing
- Nutritional information inclusion

### Error Handling
- Comprehensive error handling for all failure scenarios
- Proper HTTP status codes (400, 401, 500)
- Detailed error messages for debugging
- Request ID tracking for monitoring

### Scalability & Performance
- Serverless architecture with AWS Lambda
- Optimized for cold start performance
- Efficient memory usage (512MB)
- 30-second timeout for complex recipe generation

## API Specification

### Endpoint
```
POST /generate-recipe
```

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "ingredients": ["chicken", "rice", "vegetables"],
  "dietaryRestrictions": ["gluten-free"],
  "cuisine": "Asian",
  "servings": 4
}
```

### Response (Success - 200)
```json
{
  "id": "uuid-recipe-id",
  "title": "Asian Chicken and Rice Bowl",
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": "2",
      "unit": "pieces"
    }
  ],
  "instructions": [
    "Cook rice according to package instructions",
    "Season and cook chicken breast"
  ],
  "prepTime": 15,
  "cookTime": 25,
  "servings": 4,
  "nutritionInfo": {
    "calories": 350,
    "protein": 30,
    "carbohydrates": 40,
    "fat": 8
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "userId": "cognito-user-id"
}
```

### Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid JWT token
- **500 Internal Server Error**: Bedrock service errors or system failures

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- Cognito User Pool configured (from previous tasks)

### Deploy the Service
```bash
cd ai-recipe-generator-backend
./deploy-recipe-generation.sh dev us-east-1_N0KMxM07E your-client-id
```

### Test the Deployment
```bash
# Get a JWT token from Cognito (from previous auth implementation)
JWT_TOKEN="your-jwt-token-here"

# Test the endpoint
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/generate-recipe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "ingredients": ["chicken", "rice", "vegetables"],
    "servings": 4
  }'
```

## Configuration

### Environment Variables
- `NODE_ENV`: Environment (dev/staging/prod)
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID for JWT validation
- `COGNITO_USER_POOL_CLIENT_ID`: Cognito Client ID
- `AWS_REGION`: AWS region (us-east-1)

### IAM Permissions Required
- `bedrock:InvokeModel` for Claude 3 Sonnet model
- `cognito-idp:GetUser` for JWT validation
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for CloudWatch

## Monitoring & Logging

### CloudWatch Logs
- Function logs: `/aws/lambda/recipe-generation-dev`
- Request/response logging enabled
- Error tracking with request IDs

### Metrics to Monitor
- Function duration and memory usage
- Error rates and types
- Bedrock API call success/failure rates
- Authentication failure rates

## Security Considerations

### Input Validation
- Maximum 20 ingredients per request
- Maximum 100 characters per ingredient
- Maximum 10 dietary restrictions
- Servings limited to 1-20 range

### Rate Limiting
- API Gateway throttling configured
- Lambda concurrency limits
- Bedrock model rate limits respected

### Data Privacy
- No recipe data stored in this function
- User data only used for authentication
- Request logging excludes sensitive information

## Integration Points

### Frontend Integration
- CORS headers configured for web app access
- Consistent error response format
- JWT token handling

### Backend Services
- Cognito User Pool for authentication
- Amazon Bedrock for AI generation
- Future DynamoDB integration for recipe storage

## Performance Characteristics

### Expected Performance
- Cold start: ~2-3 seconds
- Warm execution: ~5-10 seconds (including Bedrock API call)
- Memory usage: ~200-300MB
- Concurrent executions: Up to 1000 (configurable)

### Optimization Opportunities
- Connection pooling for Bedrock client
- Response caching for common ingredient combinations
- Batch processing for multiple recipes

## Future Enhancements

### Planned Features (Subsequent Tasks)
- Recipe storage in DynamoDB (Task 2.3)
- Recipe history and favorites
- Enhanced nutrition analysis
- Recipe image generation
- Meal planning integration

### Technical Improvements
- Response streaming for large recipes
- Multi-language recipe generation
- Recipe difficulty scoring
- Ingredient substitution suggestions

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Verify Cognito configuration and JWT token validity
2. **Bedrock Access Denied**: Check IAM permissions for Bedrock model access
3. **Timeout Errors**: Increase Lambda timeout or optimize Bedrock prompts
4. **CORS Issues**: Verify API Gateway CORS configuration

### Debug Commands
```bash
# View function logs
aws logs tail /aws/lambda/recipe-generation-dev --follow

# Test function directly
aws lambda invoke --function-name recipe-generation-dev \
  --payload file://test-payload.json response.json

# Check function configuration
aws lambda get-function --function-name recipe-generation-dev
```

## Compliance & Best Practices

### AWS Well-Architected Framework
- **Security**: IAM least privilege, input validation, encryption in transit
- **Reliability**: Error handling, retry logic, monitoring
- **Performance**: Optimized memory allocation, efficient code
- **Cost**: Serverless architecture, pay-per-use model
- **Operational Excellence**: Infrastructure as Code, automated deployment

### Code Quality
- TypeScript for type safety
- Comprehensive unit tests
- ESLint for code quality
- Proper error handling and logging

## Conclusion

The recipe generation Lambda function is successfully implemented with:
- ✅ Complete Bedrock integration with Claude 3 Sonnet
- ✅ JWT authentication and authorization
- ✅ Comprehensive input validation and error handling
- ✅ CloudFormation infrastructure deployment
- ✅ CORS-enabled API Gateway integration
- ✅ Production-ready monitoring and logging

The implementation follows AWS best practices and is ready for integration with the frontend application and subsequent backend services.