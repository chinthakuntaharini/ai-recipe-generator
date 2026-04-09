const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1'
});

const lambda = new AWS.Lambda();

async function testRecipeGeneration() {
    console.log('Testing recipe generation with fixed ES module imports...');
    
    // Create a test event with proper authentication token
    const testEvent = {
        httpMethod: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-for-debugging'
        },
        body: JSON.stringify({
            ingredients: ['chicken', 'rice', 'vegetables'],
            dietaryRestrictions: ['healthy'],
            servings: 4
        }),
        requestContext: {
            requestId: 'test-request-id'
        }
    };

    try {
        const result = await lambda.invoke({
            FunctionName: 'recipe-generation-dev',
            Payload: JSON.stringify(testEvent)
        }).promise();

        const response = JSON.parse(result.Payload);
        console.log('Lambda Response:', JSON.stringify(response, null, 2));
        
        if (response.errorType) {
            console.log('Error Type:', response.errorType);
            console.log('Error Message:', response.errorMessage);
            if (response.stack) {
                console.log('Stack Trace:', response.stack.join('\n'));
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testRecipeGeneration();