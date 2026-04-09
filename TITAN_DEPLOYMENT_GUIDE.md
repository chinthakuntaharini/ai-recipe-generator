# 🚀 Amazon Titan Model Deployment Guide

## Current Status
✅ **Authentication**: Working perfectly  
❌ **Recipe Generation**: Still using Claude model (requires use case form)  
🎯 **Goal**: Switch to Amazon Titan Text Express (no approval needed)

## Files Updated
✅ `ai-recipe-generator-backend/src/utils/bedrock-service.ts` - Updated to use Titan  
✅ `ai-recipe-generator-backend/cloudformation/recipe-generation-stack.yaml` - Added Titan IAM permissions  

## Manual Deployment Steps

### Step 1: Build the Project
```bash
cd ai-recipe-generator-backend
npm install
npm run build
```

### Step 2: Create Deployment Package
```bash
# Create deployment directory
mkdir deployment-package
cd deployment-package

# Copy built files
cp -r ../dist/* .

# Copy node_modules (production only)
cd ..
npm ci --production
cp -r node_modules deployment-package/

# Create ZIP file
cd deployment-package
zip -r ../lambda-deployment.zip .
cd ..

# Restore dev dependencies
npm install
```

### Step 3: Update Lambda Function via AWS Console

1. **Go to AWS Lambda Console**
   - Navigate to: https://console.aws.amazon.com/lambda/
   - Find function: `recipe-generation-dev`

2. **Update Function Code**
   - Click "Upload from" → ".zip file"
   - Upload the `lambda-deployment.zip` file
   - Click "Save"

3. **Verify Handler**
   - Ensure Handler is set to: `handlers/recipe-handler.generateRecipe`

### Step 4: Update IAM Permissions via CloudFormation

1. **Go to CloudFormation Console**
   - Navigate to: https://console.aws.amazon.com/cloudformation/
   - Find stack: `recipe-generation-stack-dev`

2. **Update Stack**
   - Click "Update"
   - Choose "Replace current template"
   - Upload the updated `recipe-generation-stack.yaml`
   - Click through to update

### Step 5: Test the Deployment
```bash
node test-titan-deployment.js
```

## Alternative: Quick Manual Code Update

If you prefer to update just the Bedrock service file:

1. **Go to Lambda Console**
2. **Open the function code editor**
3. **Find**: `utils/bedrock-service.js`
4. **Replace the entire file content with**:

```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.modelId = 'amazon.titan-text-express-v1';
  }

  async generateRecipe(request) {
    const prompt = this.buildRecipePrompt(request);
    
    const input = {
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 2000,
          temperature: 0.7,
          topP: 0.9,
          stopSequences: []
        }
      })
    };

    try {
      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      
      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const recipeText = responseBody.results[0].outputText;
      
      return this.parseRecipeResponse(recipeText);
    } catch (error) {
      console.error('Bedrock API error:', error);
      throw new Error(\`Failed to generate recipe: \${error.message || 'Unknown error'}\`);
    }
  }

  buildRecipePrompt(request) {
    let prompt = \`Generate a detailed recipe using the following ingredients: \${request.ingredients.join(', ')}.\`;
    
    if (request.dietaryRestrictions && request.dietaryRestrictions.length > 0) {
      prompt += \` The recipe must accommodate these dietary restrictions: \${request.dietaryRestrictions.join(', ')}.\`;
    }
    
    if (request.cuisine) {
      prompt += \` The recipe should be in \${request.cuisine} cuisine style.\`;
    }
    
    if (request.servings) {
      prompt += \` The recipe should serve \${request.servings} people.\`;
    }
    
    prompt += \`

Please provide the recipe in the following JSON format:
{
  "title": "Recipe Name",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity",
      "unit": "measurement unit"
    }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "nutritionInfo": {
    "calories": 350,
    "protein": 25,
    "carbohydrates": 30,
    "fat": 15
  }
}

Requirements:
- Use at least 80% of the provided ingredients
- Provide clear, step-by-step instructions
- Include realistic preparation and cooking times
- Ensure the recipe is practical and achievable
- Include nutritional information if possible
- Make sure all measurements are specific and accurate\`;

    return prompt;
  }

  parseRecipeResponse(responseText) {
    try {
      // Extract JSON from the response text
      const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Missing required recipe fields');
      }
      
      // Ensure ingredients have proper structure
      if (!Array.isArray(recipeData.ingredients)) {
        throw new Error('Ingredients must be an array');
      }
      
      recipeData.ingredients.forEach((ingredient, index) => {
        if (!ingredient.name || !ingredient.amount) {
          throw new Error(\`Invalid ingredient at index \${index}\`);
        }
        // Provide default unit if missing
        if (!ingredient.unit) {
          ingredient.unit = 'piece';
        }
      });
      
      // Ensure instructions is an array
      if (!Array.isArray(recipeData.instructions)) {
        throw new Error('Instructions must be an array');
      }
      
      // Provide default values for missing fields
      return {
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTime: recipeData.prepTime || 15,
        cookTime: recipeData.cookTime || 30,
        servings: recipeData.servings || 4,
        nutritionInfo: recipeData.nutritionInfo || undefined
      };
    } catch (error) {
      console.error('Failed to parse recipe response:', error);
      throw new Error(\`Invalid recipe format: \${error.message || 'Unknown parsing error'}\`);
    }
  }
}

module.exports = { BedrockService };
```

5. **Click "Deploy"**

## Expected Results

After deployment, you should see:
- ✅ Recipe generation working without use case form
- ✅ Amazon Titan model responses
- ✅ No more Claude model errors
- ✅ Immediate availability

## Troubleshooting

### If you get "AccessDenied" errors:
1. Update the IAM role via CloudFormation (Step 4 above)
2. Add Titan model permissions manually in IAM console

### If you get "Model not found" errors:
1. Verify the model ID: `amazon.titan-text-express-v1`
2. Check if Titan models are available in your region
3. Try alternative model: `amazon.titan-text-lite-v1`

### If recipes are malformed:
1. Check the response parsing logic
2. Verify Titan response format
3. Add more error handling

## Test Commands

```bash
# Test the deployment
node test-titan-deployment.js

# Test complete flow
node test-complete-flow.js

# Test web application
# Visit: http://ai-recipe-generator-web-app-914877613.s3-website-us-east-1.amazonaws.com
```

## Success Indicators

✅ **Authentication working**  
✅ **No "use case details" errors**  
✅ **Recipe generation successful**  
✅ **Web app working end-to-end**  

Once deployed, your AI Recipe Generator will be fully functional with Amazon Titan!