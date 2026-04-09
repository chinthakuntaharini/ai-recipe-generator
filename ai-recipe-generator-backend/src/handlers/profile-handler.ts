import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { withAuth, AuthenticatedEvent } from '../middleware/auth-middleware';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'Users';

interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  dietPreference: string;
  spiceLevel: string;
  cookingGoal: string;
  favoriteCuisines: string[];
  availableAppliances: string[];
  dietaryRestrictions: string[];
  usualCookingTime: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /profile - Get user profile
async function getProfileHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;

  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { userId },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Profile not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to retrieve profile' }),
    };
  }
}

// PUT /profile - Update user profile
async function updateProfileHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;

  try {
    const updates = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!updates.displayName) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Display name is required' }),
      };
    }

    const updatedAt = new Date().toISOString();

    const result = await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET displayName = :displayName, dietPreference = :dietPreference, spiceLevel = :spiceLevel, cookingGoal = :cookingGoal, favoriteCuisines = :favoriteCuisines, availableAppliances = :availableAppliances, dietaryRestrictions = :dietaryRestrictions, usualCookingTime = :usualCookingTime, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':displayName': updates.displayName,
        ':dietPreference': updates.dietPreference,
        ':spiceLevel': updates.spiceLevel,
        ':cookingGoal': updates.cookingGoal,
        ':favoriteCuisines': updates.favoriteCuisines || [],
        ':availableAppliances': updates.availableAppliances || [],
        ':dietaryRestrictions': updates.dietaryRestrictions || [],
        ':usualCookingTime': updates.usualCookingTime,
        ':updatedAt': updatedAt,
      },
      ReturnValues: 'ALL_NEW',
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to update profile' }),
    };
  }
}

// POST /profile/onboarding - Create profile from onboarding
async function createProfileFromOnboardingHandler(
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const userId = event.user.sub;
  const email = event.user.email || '';

  try {
    const responses = JSON.parse(event.body || '{}');

    const profile: UserProfile = {
      userId,
      displayName: email ? email.split('@')[0] : 'User', // Default display name from email
      email,
      dietPreference: responses.dietPreference,
      spiceLevel: responses.spiceLevel,
      cookingGoal: responses.cookingGoal,
      favoriteCuisines: responses.favoriteCuisines || [],
      availableAppliances: responses.availableAppliances || [],
      dietaryRestrictions: responses.dietaryRestrictions || [],
      usualCookingTime: responses.usualCookingTime,
      hasCompletedOnboarding: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: profile,
    }).promise();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(profile),
    };
  } catch (error) {
    console.error('Create profile error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to create profile' }),
    };
  }
}

// Export handlers with authentication middleware
export const getProfile = withAuth(getProfileHandler);
export const updateProfile = withAuth(updateProfileHandler);
export const createProfileFromOnboarding = withAuth(createProfileFromOnboardingHandler);
