// Complete Working Recipe Handler
// Replace the ENTIRE recipe-handler.js file with this content

exports.generateRecipe = async (event, context) => {
    console.log('Recipe handler started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Parse the request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('Failed to parse request body:', parseError);
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Invalid JSON in request body'
                })
            };
        }
        
        console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
        
        // Extract ingredients and servings
        const ingredients = requestBody.ingredients || ['chicken', 'rice', 'vegetables'];
        const servings = requestBody.servings || 4;
        const mainIngredient = ingredients[0] || 'chicken';
        
        // Generate a simple recipe
        const recipe = {
            id: `recipe-${Date.now()}`,
            title: `Delicious ${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Recipe`,
            ingredients: ingredients.map((ing, index) => ({
                name: ing.charAt(0).toUpperCase() + ing.slice(1),
                amount: index === 0 ? "1 lb" : index === 1 ? "2 cups" : "1 cup",
                unit: ""
            })),
            instructions: [
                `Prepare the ${mainIngredient} by cleaning and cutting into pieces`,
                "Heat oil in a large pan over medium heat",
                `Cook the ${mainIngredient} until golden brown`,
                "Add remaining ingredients and mix well",
                "Season with salt and pepper to taste",
                "Cook for 15-20 minutes until tender",
                "Serve hot and enjoy!"
            ],
            prepTime: 15,
            cookTime: 25,
            servings: servings,
            nutritionInfo: {
                calories: 350,
                protein: 25,
                carbohydrates: 30,
                fat: 12
            },
            createdAt: new Date().toISOString(),
            userId: event.user?.sub || 'anonymous'
        };
        
        console.log('Generated recipe:', JSON.stringify(recipe, null, 2));
        
        // Return successful response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            body: JSON.stringify(recipe)
        };
        
    } catch (error) {
        console.error('Recipe generation error:', error);
        
        // Return error response
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            body: JSON.stringify({
                error: 'Failed to generate recipe',
                message: error.message,
                requestId: context.awsRequestId
            })
        };
    }
};