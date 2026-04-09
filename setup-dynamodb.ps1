# PowerShell script to set up DynamoDB table for AI Recipe Generator
# This script creates the table with proper schema and indexes

param(
    [string]$Profile = "ai-recipe-generator-dev",
    [string]$Region = "us-east-1",
    [string]$TableName = "ai-recipe-generator-recipes"
)

Write-Host "🗄️  Setting up DynamoDB for AI Recipe Generator" -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Table Name: $TableName" -ForegroundColor Yellow
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

# Function to wait for table to be active
function Wait-ForTableActive {
    param([string]$TableName, [int]$MaxWaitTime = 300)
    
    Write-Host "Waiting for table to become active..." -ForegroundColor Yellow
    $startTime = Get-Date
    
    do {
        Start-Sleep -Seconds 10
        $status = aws dynamodb describe-table --table-name $TableName --region $Region --profile $Profile --query 'Table.TableStatus' --output text 2>$null
        
        if ($status -eq "ACTIVE") {
            Write-Host "✅ Table is now active" -ForegroundColor Green
            return $true
        }
        
        $elapsed = (Get-Date) - $startTime
        Write-Host "Table status: $status (waiting $([int]$elapsed.TotalSeconds)s)" -ForegroundColor Gray
        
    } while ($elapsed.TotalSeconds -lt $MaxWaitTime)
    
    Write-Host "❌ Timeout waiting for table to become active" -ForegroundColor Red
    return $false
}

# Step 1: Check if table already exists
Write-Host "Step 1: Checking if table exists" -ForegroundColor Cyan

$existingTable = aws dynamodb describe-table --table-name $TableName --region $Region --profile $Profile 2>$null

if ($existingTable) {
    $tableInfo = $existingTable | ConvertFrom-Json
    Write-Host "⚠️  Table already exists with status: $($tableInfo.Table.TableStatus)" -ForegroundColor Yellow
    
    if ($tableInfo.Table.TableStatus -eq "ACTIVE") {
        Write-Host "Table is active and ready to use" -ForegroundColor Green
        
        # Display table information
        Write-Host ""
        Write-Host "📊 Existing Table Information:" -ForegroundColor Cyan
        Write-Host "Table Name: $($tableInfo.Table.TableName)" -ForegroundColor White
        Write-Host "Table Status: $($tableInfo.Table.TableStatus)" -ForegroundColor White
        Write-Host "Item Count: $($tableInfo.Table.ItemCount)" -ForegroundColor White
        Write-Host "Table Size: $($tableInfo.Table.TableSizeBytes) bytes" -ForegroundColor White
        Write-Host "Creation Date: $($tableInfo.Table.CreationDateTime)" -ForegroundColor White
        
        # Check indexes
        if ($tableInfo.Table.GlobalSecondaryIndexes) {
            Write-Host ""
            Write-Host "📋 Global Secondary Indexes:" -ForegroundColor Cyan
            foreach ($index in $tableInfo.Table.GlobalSecondaryIndexes) {
                Write-Host "  - $($index.IndexName): $($index.IndexStatus)" -ForegroundColor White
            }
        }
        
        $continue = Read-Host "Do you want to continue with testing the existing table? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Exiting without changes" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "Table exists but is not active. Please wait for it to become active or delete it first." -ForegroundColor Red
        exit 1
    }
} else {
    # Step 2: Create DynamoDB table
    Write-Host "Step 2: Creating DynamoDB table" -ForegroundColor Cyan
    
    $createTableCommand = @"
aws dynamodb create-table \
  --table-name "$TableName" \
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
    Key=CreatedBy,Value=PowerShell-Script \
  --region $Region \
  --profile $Profile \
  --output json
"@

    $createResult = Invoke-AWSCommand -Command $createTableCommand -Description "Create DynamoDB table"
    
    if ($createResult) {
        $tableInfo = $createResult | ConvertFrom-Json
        Write-Host "Table ARN: $($tableInfo.TableDescription.TableArn)" -ForegroundColor Green
        
        # Wait for table to become active
        $isActive = Wait-ForTableActive -TableName $TableName
        if (-not $isActive) {
            Write-Host "Failed to wait for table activation" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Failed to create table. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Step 3: Verify table configuration
Write-Host ""
Write-Host "Step 3: Verifying table configuration" -ForegroundColor Cyan

$verifyCommand = "aws dynamodb describe-table --table-name $TableName --region $Region --profile $Profile --output json"
$verifyResult = Invoke-AWSCommand -Command $verifyCommand -Description "Verify table configuration"

if ($verifyResult) {
    $tableDetails = $verifyResult | ConvertFrom-Json
    
    Write-Host "✅ Table verification successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Table Configuration:" -ForegroundColor Cyan
    Write-Host "Table Name: $($tableDetails.Table.TableName)" -ForegroundColor White
    Write-Host "Table Status: $($tableDetails.Table.TableStatus)" -ForegroundColor White
    Write-Host "Billing Mode: $($tableDetails.Table.BillingModeSummary.BillingMode)" -ForegroundColor White
    
    # Display key schema
    Write-Host ""
    Write-Host "🔑 Key Schema:" -ForegroundColor Cyan
    foreach ($key in $tableDetails.Table.KeySchema) {
        Write-Host "  $($key.KeyType): $($key.AttributeName)" -ForegroundColor White
    }
    
    # Display GSI information
    if ($tableDetails.Table.GlobalSecondaryIndexes) {
        Write-Host ""
        Write-Host "📋 Global Secondary Indexes:" -ForegroundColor Cyan
        foreach ($index in $tableDetails.Table.GlobalSecondaryIndexes) {
            Write-Host "  Index: $($index.IndexName)" -ForegroundColor White
            Write-Host "    Status: $($index.IndexStatus)" -ForegroundColor Gray
            Write-Host "    Keys: $($index.KeySchema.AttributeName -join ', ')" -ForegroundColor Gray
            Write-Host "    Projection: $($index.Projection.ProjectionType)" -ForegroundColor Gray
        }
    }
}

# Step 4: Create sample data for testing
Write-Host ""
Write-Host "Step 4: Creating sample test data" -ForegroundColor Cyan

$sampleRecipe = @{
    userId = "test-user-123"
    recipeId = "recipe-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    title = "Mediterranean Chicken and Rice"
    ingredients = @(
        @{ name = "chicken breast"; amount = "2"; unit = "pieces" }
        @{ name = "basmati rice"; amount = "1"; unit = "cup" }
        @{ name = "olive oil"; amount = "2"; unit = "tbsp" }
        @{ name = "onion"; amount = "1"; unit = "medium" }
        @{ name = "garlic"; amount = "3"; unit = "cloves" }
    )
    instructions = @(
        "Season chicken with salt, pepper, and Mediterranean herbs"
        "Heat olive oil in a large skillet over medium-high heat"
        "Cook chicken until golden brown and cooked through"
        "Remove chicken and set aside"
        "In the same pan, sauté onion and garlic until fragrant"
        "Add rice and stir for 2 minutes"
        "Add chicken broth and bring to a boil"
        "Reduce heat, cover, and simmer for 18 minutes"
        "Return chicken to pan and let rest for 5 minutes"
        "Fluff rice with a fork and serve"
    )
    prepTime = 15
    cookTime = 30
    servings = 4
    nutritionInfo = @{
        calories = 450
        protein = 35
        carbs = 45
        fat = 12
    }
    dietaryRestrictions = @("gluten-free")
    cuisine = "Mediterranean"
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    isFavorite = $false
    ingredientHash = "chicken-rice-olive"
    generationMetadata = @{
        modelUsed = "claude-3-sonnet"
        tokensUsed = 1250
        generationTime = 3.2
        promptVersion = "v1.0"
    }
} | ConvertTo-Json -Depth 5

$sampleRecipe | Out-File -FilePath "sample-recipe.json" -Encoding UTF8

# Insert sample data
$putItemCommand = "aws dynamodb put-item --table-name $TableName --item file://sample-recipe.json --region $Region --profile $Profile"
$putResult = Invoke-AWSCommand -Command $putItemCommand -Description "Insert sample recipe"

if ($putResult) {
    Write-Host "✅ Sample recipe inserted successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to insert sample recipe (table may still be functional)" -ForegroundColor Yellow
}

# Step 5: Test basic operations
Write-Host ""
Write-Host "Step 5: Testing basic operations" -ForegroundColor Cyan

# Test get item
$getItemCommand = "aws dynamodb get-item --table-name $TableName --key '{`"userId`":{`"S`":`"test-user-123`"},`"recipeId`":{`"S`":`"$(($sampleRecipe | ConvertFrom-Json).recipeId)`"}}' --region $Region --profile $Profile --output json"
$getResult = Invoke-AWSCommand -Command $getItemCommand -Description "Test get item operation"

if ($getResult) {
    Write-Host "✅ Get item operation successful" -ForegroundColor Green
}

# Test query operation
$queryCommand = "aws dynamodb query --table-name $TableName --key-condition-expression 'userId = :userId' --expression-attribute-values '{`":userId`":{`"S`":`"test-user-123`"}}' --region $Region --profile $Profile --output json"
$queryResult = Invoke-AWSCommand -Command $queryCommand -Description "Test query operation"

if ($queryResult) {
    $queryData = $queryResult | ConvertFrom-Json
    Write-Host "✅ Query operation successful - found $($queryData.Count) items" -ForegroundColor Green
}

# Step 6: Create monitoring alarms
Write-Host ""
Write-Host "Step 6: Setting up CloudWatch monitoring" -ForegroundColor Cyan

# Read capacity alarm
$readAlarmCommand = @"
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-DynamoDB-ReadCapacity" \
  --alarm-description "Monitor DynamoDB read capacity usage" \
  --metric-name ConsumedReadCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=$TableName \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:$Region`:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region $Region \
  --profile $Profile
"@

$readAlarmResult = Invoke-AWSCommand -Command $readAlarmCommand -Description "Create read capacity alarm"

# Write capacity alarm
$writeAlarmCommand = @"
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-DynamoDB-WriteCapacity" \
  --alarm-description "Monitor DynamoDB write capacity usage" \
  --metric-name ConsumedWriteCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=$TableName \
  --evaluation-periods 2 \
  --alarm-actions "arn:aws:sns:$Region`:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region $Region \
  --profile $Profile
"@

$writeAlarmResult = Invoke-AWSCommand -Command $writeAlarmCommand -Description "Create write capacity alarm"

# Step 7: Generate configuration files
Write-Host ""
Write-Host "Step 7: Generating configuration files" -ForegroundColor Cyan

# Create environment configuration
$envConfig = @"
# DynamoDB Configuration for AI Recipe Generator
# Add these to your .env.local file

AWS_REGION=$Region
DYNAMODB_TABLE_NAME=$TableName
DYNAMODB_CREATED_AT_INDEX=CreatedAtIndex
DYNAMODB_INGREDIENT_SEARCH_INDEX=IngredientSearchIndex

# For local development
DYNAMODB_ENDPOINT=http://localhost:8000  # Only for local DynamoDB
"@

$envConfig | Out-File -FilePath "dynamodb-config.env" -Encoding UTF8
Write-Host "✅ Environment configuration saved to: dynamodb-config.env" -ForegroundColor Green

# Create Node.js repository class
$repositoryClass = @"
// DynamoDB Repository for AI Recipe Generator
// Generated by PowerShell setup script

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || '$Region'
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || '$TableName';

class RecipeRepository {
  
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

  async getRecipe(userId, recipeId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, recipeId }
    });

    const result = await docClient.send(command);
    return result.Item;
  }

  async getUserRecipes(userId, limit = 20, lastEvaluatedKey = null) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    });

    const result = await docClient.send(command);
    return {
      items: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }

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

  generateIngredientHash(ingredients) {
    return ingredients
      .map(ing => ing.name.toLowerCase().replace(/\s+/g, '-'))
      .sort()
      .slice(0, 3)
      .join('-');
  }
}

module.exports = { RecipeRepository };
"@

$repositoryClass | Out-File -FilePath "recipe-repository.js" -Encoding UTF8
Write-Host "✅ Recipe repository class saved to: recipe-repository.js" -ForegroundColor Green

# Create test script
$testScript = @"
# DynamoDB Test Commands
# Run these commands to test your DynamoDB setup

# 1. Describe table
aws dynamodb describe-table --table-name $TableName --region $Region --profile $Profile

# 2. List all items (scan - use carefully in production)
aws dynamodb scan --table-name $TableName --region $Region --profile $Profile --max-items 10

# 3. Query user's recipes
aws dynamodb query --table-name $TableName --key-condition-expression "userId = :userId" --expression-attribute-values '{":userId":{"S":"test-user-123"}}' --region $Region --profile $Profile

# 4. Get specific recipe
aws dynamodb get-item --table-name $TableName --key '{"userId":{"S":"test-user-123"},"recipeId":{"S":"your-recipe-id"}}' --region $Region --profile $Profile

# 5. Query by creation date (using GSI)
aws dynamodb query --table-name $TableName --index-name CreatedAtIndex --key-condition-expression "userId = :userId" --expression-attribute-values '{":userId":{"S":"test-user-123"}}' --region $Region --profile $Profile

# 6. Check table metrics
aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB --metric-name ConsumedReadCapacityUnits --dimensions Name=TableName,Value=$TableName --start-time 2024-01-01T00:00:00Z --end-time 2024-12-31T23:59:59Z --period 3600 --statistics Sum --region $Region --profile $Profile
"@

$testScript | Out-File -FilePath "test-dynamodb.sh" -Encoding UTF8
Write-Host "✅ Test script saved to: test-dynamodb.sh" -ForegroundColor Green

# Clean up temporary files
Remove-Item -Path "sample-recipe.json" -ErrorAction SilentlyContinue

# Step 8: Summary and next steps
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "📊 DynamoDB Configuration Summary:" -ForegroundColor Cyan
Write-Host "Table Name: $TableName" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Billing Mode: Pay-per-request (On-demand)" -ForegroundColor White
Write-Host "Partition Key: userId (String)" -ForegroundColor White
Write-Host "Sort Key: recipeId (String)" -ForegroundColor White
Write-Host ""
Write-Host "📋 Global Secondary Indexes:" -ForegroundColor Cyan
Write-Host "• CreatedAtIndex - for date-based queries" -ForegroundColor White
Write-Host "• IngredientSearchIndex - for ingredient-based search" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files Created:" -ForegroundColor Cyan
Write-Host "• dynamodb-config.env - Environment variables" -ForegroundColor White
Write-Host "• recipe-repository.js - Node.js repository class" -ForegroundColor White
Write-Host "• test-dynamodb.sh - Test commands" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy environment variables to your .env.local file" -ForegroundColor White
Write-Host "2. Install AWS SDK dependencies: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb" -ForegroundColor White
Write-Host "3. Import and use the RecipeRepository class in your Lambda functions" -ForegroundColor White
Write-Host "4. Test the repository with sample data" -ForegroundColor White
Write-Host "5. Proceed to task 1.2.4: Configure API Gateway" -ForegroundColor White
Write-Host ""
Write-Host "💰 Cost Monitoring:" -ForegroundColor Yellow
Write-Host "• Free tier: 25 GB storage, 25 RCU/WCU per month" -ForegroundColor White
Write-Host "• On-demand pricing: `$0.25/million reads, `$1.25/million writes" -ForegroundColor White
Write-Host "• CloudWatch alarms configured for capacity monitoring" -ForegroundColor White
Write-Host "• Monitor usage in AWS Cost Explorer" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Notes:" -ForegroundColor Yellow
Write-Host "• Encryption at rest is enabled by default" -ForegroundColor White
Write-Host "• Use IAM roles for Lambda function access" -ForegroundColor White
Write-Host "• Implement proper data validation in your application" -ForegroundColor White
Write-Host "• Consider enabling point-in-time recovery for production" -ForegroundColor White

Write-Host ""
Write-Host "✅ DynamoDB setup completed successfully!" -ForegroundColor Green