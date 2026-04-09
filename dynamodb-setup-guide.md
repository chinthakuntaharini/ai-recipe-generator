# DynamoDB Setup Guide for AI Recipe Generator

## Task 1.2.3: Create DynamoDB Table for Recipe Storage

### Overview
DynamoDB will store user recipe history, favorites, and generated recipes for the AI Recipe Generator. The design follows NoSQL best practices with efficient access patterns and stays within AWS free tier limits.

**Target Account:** 972803002725 (Vedanth Raj)  
**Region:** us-east-1  
**Free Tier Limits:** 25 GB storage, 25 RCU/WCU per month

## Table Design

### Primary Table: RecipeHistory

#### Access Patterns
1. **Get user's recipe history** - Query by userId
2. **Get specific recipe** - Get item by userId + recipeId
3. **Get user's favorite recipes** - Query by userId with filter
4. **Get recipes by creation date** - Query with sort key range
5. **Search recipes by ingredients** - GSI query

#### Table Schema
```json
{
  "TableName": "ai-recipe-generator-recipes",
  "KeySchema": [
    {
      "AttributeName": "userId",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "recipeId", 
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "userId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "recipeId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "createdAt",
      "AttributeType": "S"
    },
    {
      "AttributeName": "ingredientHash",
      "AttributeType": "S"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "CreatedAtIndex",
      "KeySchema": [
        {
          "AttributeName": "userId",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "createdAt",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    },
    {
      "IndexName": "IngredientSearchIndex",
      "KeySchema": [
        {
          "AttributeName": "ingredientHash",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "createdAt",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "INCLUDE",
        "NonKeyAttributes": ["userId", "recipeId", "title", "ingredients", "isFavorite"]
      }
    }
  ]
}
```

#### Item Structure
```json
{
  "userId": "cognito-user-id",
  "recipeId": "recipe-uuid-v4",
  "title": "Chicken and Rice Pilaf",
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": "2",
      "unit": "pieces"
    },
    {
      "name": "basmati rice",
      "amount": "1",
      "unit": "cup"
    }
  ],
  "instructions": [
    "Season chicken with salt and pepper",
    "Heat oil in a large pan over medium-high heat",
    "Cook chicken until golden brown, about 6-7 minutes per side"
  ],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "nutritionInfo": {
    "calories": 450,
    "protein": 35,
    "carbs": 45,
    "fat": 12
  },
  "dietaryRestrictions": ["gluten-free"],
  "cuisine": "Mediterranean",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "isFavorite": false,
  "ingredientHash": "chicken-rice-onion",
  "generationMetadata": {
    "modelUsed": "claude-3-sonnet",
    "tokensUsed": 1250,
    "generationTime": 3.2,
    "promptVersion": "v1.0"
  }
}
```

## Step 1: Create DynamoDB Table

### Using AWS Management Console

#### 1.1 Navigate to DynamoDB
1. Log into AWS Console (Account: 972803002725)
2. Go to Services → Database → DynamoDB
3. Click "Create table"

#### 1.2 Configure Table Settings
1. **Table name**: `ai-recipe-generator-recipes`
2. **Partition key**: `userId` (String)
3. **Sort key**: `recipeId` (String)
4. **Table settings**: Use default settings
5. Click "Create table"

#### 1.3 Create Global Secondary Indexes
After table creation:

**Index 1: CreatedAtIndex**
1. Go to table → "Indexes" tab
2. Click "Create index"
3. **Partition key**: `userId` (String)
4. **Sort key**: `createdAt` (String)
5. **Index name**: `CreatedAtIndex`
6. **Projected attributes**: All attributes
7. Click "Create index"

**Index 2: IngredientSearchIndex**
1. Click "Create index"
2. **Partition key**: `ingredientHash` (String)
3. **Sort key**: `createdAt` (String)
4. **Index name**: `IngredientSearchIndex`
5. **Projected attributes**: Include specific attributes
6. **Attributes to project**: `userId`, `recipeId`, `title`, `ingredients`, `isFavorite`
7. Click "Create index"

### Using AWS CLI

```bash
# Create the main table
aws dynamodb create-table \
  --table-name ai-recipe-generator-recipes \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=recipeId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=ingredientHash,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=recipeId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    'IndexName=CreatedAtIndex,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    'IndexName=IngredientSearchIndex,KeySchema=[{AttributeName=ingredientHash,KeyType=HASH},{AttributeName=createdAt,KeyType=RANGE}],Projection={ProjectionType=INCLUDE,NonKeyAttributes=[userId,recipeId,title,ingredients,isFavorite]}' \
  --tags \
    Key=Project,Value=AI-Recipe-Generator \
    Key=Environment,Value=Development \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

## Step 2: Configure Table Settings

### Enable Point-in-Time Recovery
```bash
aws dynamodb put-backup-policy \
  --table-name ai-recipe-generator-recipes \
  --backup-policy BillingMode=PAY_PER_REQUEST \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### Enable Encryption at Rest
```bash
aws dynamodb put-encryption-at-rest \
  --table-name ai-recipe-generator-recipes \
  --sse-specification Enabled=true,SSEType=KMS \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

## Step 3: Create Data Access Layer

### Node.js SDK Integration
```javascript
// lib/dynamodb.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'ai-recipe-generator-recipes';

class RecipeRepository {
  
  // Save a new recipe
  async saveRecipe(userId, recipe) {
    const item = {
      userId,
      recipeId: recipe.id,
      ...recipe,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ingredientHash: this.generateIngredientHash(recipe.ingredients)
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(recipeId)'
    });

    try {
      await docClient.send(command);
      return item;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Recipe already exists');
      }
      throw error;
    }
  }

  // Get a specific recipe
  async getRecipe(userId, recipeId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, recipeId }
    });

    const result = await docClient.send(command);
    return result.Item;
  }

  // Get user's recipe history
  async getUserRecipes(userId, limit = 20, lastEvaluatedKey = null) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    });

    const result = await docClient.send(command);
    return {
      items: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }

  // Get recipes by creation date range
  async getRecipesByDateRange(userId, startDate, endDate) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'CreatedAtIndex',
      KeyConditionExpression: 'userId = :userId AND createdAt BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    const result = await docClient.send(command);
    return result.Items;
  }

  // Get user's favorite recipes
  async getFavoriteRecipes(userId) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isFavorite = :isFavorite',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isFavorite': true
      }
    });

    const result = await docClient.send(command);
    return result.Items;
  }

  // Toggle favorite status
  async toggleFavorite(userId, recipeId) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, recipeId },
      UpdateExpression: 'SET isFavorite = if_not_exists(isFavorite, :false) = :false, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':false': false,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  // Search recipes by ingredients
  async searchByIngredients(ingredients, limit = 10) {
    const ingredientHash = this.generateIngredientHash(ingredients);
    
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'IngredientSearchIndex',
      KeyConditionExpression: 'ingredientHash = :ingredientHash',
      ExpressionAttributeValues: {
        ':ingredientHash': ingredientHash
      },
      Limit: limit
    });

    const result = await docClient.send(command);
    return result.Items;
  }

  // Delete a recipe
  async deleteRecipe(userId, recipeId) {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId, recipeId },
      ConditionExpression: 'attribute_exists(recipeId)'
    });

    try {
      await docClient.send(command);
      return true;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Recipe not found');
      }
      throw error;
    }
  }

  // Helper method to generate ingredient hash for searching
  generateIngredientHash(ingredients) {
    return ingredients
      .map(ing => ing.name.toLowerCase().replace(/\s+/g, '-'))
      .sort()
      .slice(0, 3) // Use top 3 ingredients
      .join('-');
  }
}

module.exports = { RecipeRepository };
```

### Lambda Function Integration
```javascript
// lambda/recipe-storage.js
const { RecipeRepository } = require('./lib/dynamodb');

const recipeRepo = new RecipeRepository();

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body, requestContext } = event;
  const userId = requestContext.authorizer.userId; // From Cognito authorizer

  try {
    switch (httpMethod) {
      case 'POST':
        // Save new recipe
        const recipe = JSON.parse(body);
        const savedRecipe = await recipeRepo.saveRecipe(userId, recipe);
        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(savedRecipe)
        };

      case 'GET':
        if (pathParameters && pathParameters.recipeId) {
          // Get specific recipe
          const recipe = await recipeRepo.getRecipe(userId, pathParameters.recipeId);
          if (!recipe) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'Recipe not found' })
            };
          }
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(recipe)
          };
        } else {
          // Get user's recipe history
          const { limit, lastEvaluatedKey } = event.queryStringParameters || {};
          const result = await recipeRepo.getUserRecipes(
            userId, 
            limit ? parseInt(limit) : 20,
            lastEvaluatedKey ? JSON.parse(decodeURIComponent(lastEvaluatedKey)) : null
          );
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
          };
        }

      case 'PUT':
        // Toggle favorite
        if (pathParameters && pathParameters.recipeId) {
          const updatedRecipe = await recipeRepo.toggleFavorite(userId, pathParameters.recipeId);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(updatedRecipe)
          };
        }
        break;

      case 'DELETE':
        // Delete recipe
        if (pathParameters && pathParameters.recipeId) {
          await recipeRepo.deleteRecipe(userId, pathParameters.recipeId);
          return {
            statusCode: 204,
            headers: {
              'Access-Control-Allow-Origin': '*'
            }
          };
        }
        break;

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

## Step 4: Test Data Operations

### Sample Test Data
```javascript
// test-data.js
const sampleRecipe = {
  id: 'recipe-001',
  title: 'Mediterranean Chicken and Rice',
  ingredients: [
    { name: 'chicken breast', amount: '2', unit: 'pieces' },
    { name: 'basmati rice', amount: '1', unit: 'cup' },
    { name: 'olive oil', amount: '2', unit: 'tbsp' },
    { name: 'onion', amount: '1', unit: 'medium' },
    { name: 'garlic', amount: '3', unit: 'cloves' }
  ],
  instructions: [
    'Season chicken with salt, pepper, and Mediterranean herbs',
    'Heat olive oil in a large skillet over medium-high heat',
    'Cook chicken until golden brown and cooked through, about 6-7 minutes per side',
    'Remove chicken and set aside',
    'In the same pan, sauté onion and garlic until fragrant',
    'Add rice and stir for 2 minutes',
    'Add chicken broth and bring to a boil',
    'Reduce heat, cover, and simmer for 18 minutes',
    'Return chicken to pan and let rest for 5 minutes',
    'Fluff rice with a fork and serve'
  ],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  nutritionInfo: {
    calories: 450,
    protein: 35,
    carbs: 45,
    fat: 12
  },
  dietaryRestrictions: ['gluten-free'],
  cuisine: 'Mediterranean',
  isFavorite: false
};

module.exports = { sampleRecipe };
```

### Test Script
```javascript
// test-dynamodb.js
const { RecipeRepository } = require('./lib/dynamodb');
const { sampleRecipe } = require('./test-data');

async function testDynamoDB() {
  const repo = new RecipeRepository();
  const testUserId = 'test-user-123';

  try {
    console.log('Testing DynamoDB operations...');

    // Test 1: Save recipe
    console.log('1. Saving recipe...');
    const savedRecipe = await repo.saveRecipe(testUserId, sampleRecipe);
    console.log('✅ Recipe saved:', savedRecipe.recipeId);

    // Test 2: Get recipe
    console.log('2. Getting recipe...');
    const retrievedRecipe = await repo.getRecipe(testUserId, sampleRecipe.id);
    console.log('✅ Recipe retrieved:', retrievedRecipe.title);

    // Test 3: Get user recipes
    console.log('3. Getting user recipes...');
    const userRecipes = await repo.getUserRecipes(testUserId);
    console.log('✅ User recipes count:', userRecipes.items.length);

    // Test 4: Toggle favorite
    console.log('4. Toggling favorite...');
    const favoriteRecipe = await repo.toggleFavorite(testUserId, sampleRecipe.id);
    console.log('✅ Favorite status:', favoriteRecipe.isFavorite);

    // Test 5: Get favorites
    console.log('5. Getting favorite recipes...');
    const favorites = await repo.getFavoriteRecipes(testUserId);
    console.log('✅ Favorite recipes count:', favorites.length);

    // Test 6: Search by ingredients
    console.log('6. Searching by ingredients...');
    const searchResults = await repo.searchByIngredients(['chicken', 'rice']);
    console.log('✅ Search results count:', searchResults.length);

    console.log('All tests passed! 🎉');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDynamoDB();
```

## Step 5: Monitoring and Optimization

### CloudWatch Metrics
```bash
# Create CloudWatch alarm for read capacity
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-DynamoDB-ReadCapacity" \
  --alarm-description "Monitor DynamoDB read capacity usage" \
  --metric-name ConsumedReadCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=ai-recipe-generator-recipes \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1 \
  --profile ai-recipe-generator-dev

# Create CloudWatch alarm for write capacity
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-DynamoDB-WriteCapacity" \
  --alarm-description "Monitor DynamoDB write capacity usage" \
  --metric-name ConsumedWriteCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=ai-recipe-generator-recipes \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1 \
  --profile ai-recipe-generator-dev
```

### Performance Optimization
1. **Use projection in GSIs** to minimize data transfer
2. **Implement pagination** for large result sets
3. **Cache frequently accessed recipes** in application layer
4. **Use batch operations** when possible
5. **Monitor hot partitions** and adjust key design if needed

## Step 6: Security Configuration

### IAM Policy for Lambda Functions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:972803002725:table/ai-recipe-generator-recipes",
        "arn:aws:dynamodb:us-east-1:972803002725:table/ai-recipe-generator-recipes/index/*"
      ]
    }
  ]
}
```

### Data Validation
```javascript
// validation/recipe-schema.js
const Joi = require('joi');

const ingredientSchema = Joi.object({
  name: Joi.string().required().max(100),
  amount: Joi.string().required().max(20),
  unit: Joi.string().required().max(20)
});

const recipeSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required().max(200),
  ingredients: Joi.array().items(ingredientSchema).min(1).max(20),
  instructions: Joi.array().items(Joi.string().max(500)).min(1).max(20),
  prepTime: Joi.number().integer().min(0).max(480),
  cookTime: Joi.number().integer().min(0).max(480),
  servings: Joi.number().integer().min(1).max(20),
  nutritionInfo: Joi.object({
    calories: Joi.number().min(0),
    protein: Joi.number().min(0),
    carbs: Joi.number().min(0),
    fat: Joi.number().min(0)
  }),
  dietaryRestrictions: Joi.array().items(Joi.string().max(50)),
  cuisine: Joi.string().max(50)
});

module.exports = { recipeSchema };
```

## Troubleshooting

### Common Issues

#### 1. "ResourceNotFoundException"
- Verify table name is correct
- Check region configuration
- Ensure table creation completed

#### 2. "ValidationException"
- Check attribute types match schema
- Verify required attributes are provided
- Validate key schema configuration

#### 3. "ConditionalCheckFailedException"
- Item already exists (for PutItem with condition)
- Item doesn't exist (for UpdateItem/DeleteItem with condition)
- Check condition expressions

#### 4. "ProvisionedThroughputExceededException"
- Switch to on-demand billing mode
- Implement exponential backoff
- Optimize query patterns

### Performance Issues
- Use Query instead of Scan operations
- Implement proper pagination
- Consider read replicas for read-heavy workloads
- Monitor hot partitions

## Cost Optimization

### Free Tier Monitoring
- **Storage**: 25 GB free per month
- **Read/Write**: 25 RCU and 25 WCU free per month
- **On-demand pricing**: $0.25 per million read requests, $1.25 per million write requests

### Best Practices
1. Use on-demand billing for unpredictable workloads
2. Implement efficient query patterns
3. Use projection in GSIs to reduce data transfer
4. Archive old recipes to reduce storage costs
5. Monitor usage through CloudWatch

## Next Steps

After completing DynamoDB setup:

1. ✅ **Test table operations** with sample data
2. ✅ **Verify GSI functionality** 
3. ⏭️ **Proceed to task 1.2.4**: Configure API Gateway
4. ⏭️ **Integrate with Lambda functions**
5. ⏭️ **Implement frontend data layer**

---

**Table Configuration Summary:**
- Table: `ai-recipe-generator-recipes`
- Partition Key: `userId` (String)
- Sort Key: `recipeId` (String)
- GSI 1: `CreatedAtIndex` for date-based queries
- GSI 2: `IngredientSearchIndex` for ingredient-based search
- Billing: Pay-per-request (on-demand)
- Encryption: Enabled at rest