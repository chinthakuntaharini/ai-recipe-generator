# Implementation Plan: Frontend Redesign V2

## Overview

This implementation plan transforms the AI Recipe Generator into a feature-rich, animated web application with comprehensive user profile management, first-time onboarding, and enhanced recipe generation controls. The implementation uses React/Next.js with TypeScript, CSS animations, and integrates with existing AWS backend services (Cognito, Lambda, DynamoDB, Bedrock).

## Tasks

- [ ] 1. Set up project structure and dependencies
  - Create Next.js project with TypeScript configuration
  - Install required dependencies: React, Next.js, AWS SDK, date-fns, uuid
  - Configure environment variables for API endpoints
  - Set up CSS modules and global styles
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 2. Implement core type definitions and interfaces
  - [ ] 2.1 Create type definitions for user profiles
    - Define UserProfile, DietType, SpiceLevel, CookingGoal, Appliance types
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13_
  
  - [ ] 2.2 Create type definitions for recipes
    - Define Recipe, RecipeRequest, Ingredient, NutritionInfo, MealType, CookingStyle types
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13_
  
  - [ ] 2.3 Create type definitions for onboarding
    - Define OnboardingState, OnboardingResponses, OnboardingStep types
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [ ] 2.4 Create type definitions for recipe form state
    - Define RecipeFormState, RecipeFormManager interface
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

- [ ] 3. Implement API client and error handling
  - [ ] 3.1 Create API client class with authentication
    - Implement request method with JWT token handling
    - Add methods for profile, recipe, and history endpoints
    - _Requirements: 10.4, 11.5, 16.5, 16.6_
  
  - [ ] 3.2 Implement error handling classes
    - Create APIError, ValidationError, AuthenticationError classes
    - Implement global error handler with toast notifications
    - _Requirements: 10.6, 16.2, 16.7_
  
  - [ ]* 3.3 Write unit tests for API client
    - Test request method with various scenarios
    - Test error handling for different error types
    - _Requirements: 10.6, 16.2_

- [ ] 4. Implement CSS animations and visual effects
  - [ ] 4.1 Create floating elements animation
    - Implement @keyframes float animation with transform and rotation
    - Create floating-element class with CSS variables for duration, delay, rotation
    - Generate 10-15 food-related SVG icons (carrot, tomato, pot, knife, spoon, fork, pepper, onion, pan, bowl)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 15.1, 15.5_
  
  - [ ] 4.2 Implement hover effects for cards and buttons
    - Create CSS transitions for recipe cards with translateY, scale, box-shadow
    - Create button hover effects with transform and gradient background
    - Create input focus effects with border-color and box-shadow
    - _Requirements: 1.8, 15.2_
  
  - [ ] 4.3 Implement custom cursor
    - Create base64-encoded frying pan SVG cursor (28x28px)
    - Implement custom-cursor-area class with cursor: url()
    - Create animated cursor for interactive elements with sizzle effect
    - Add media query to disable custom cursor on touch devices
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.8, 15.3_

- [ ] 5. Create FloatingBackground component
  - Implement generateFloatingElements function with random positioning
  - Create FloatingBackground component rendering 12 floating elements
  - Apply CSS animations with varied timing (8-20s duration, 0-5s delay)
  - Set opacity between 0.06-0.12 and rotation between -15 to +15 degrees
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 12.7_

- [ ] 6. Implement onboarding state machine
  - [ ] 6.1 Create OnboardingMachine class
    - Implement state management with currentStep and responses
    - Implement canGoNext, canGoBack, goNext, goBack methods
    - Implement updateResponse method for storing user selections
    - Implement submit method to call profile creation API
    - _Requirements: 5.10, 5.11_
  
  - [ ] 6.2 Create onboarding step components
    - Implement Step1DietPreference with 4 diet options
    - Implement Step2SpiceLevel with 4 spice level options
    - Implement Step3CookingGoal with 4 cooking goal options
    - Implement Step4FavoriteCuisines with multi-select chips
    - Implement Step5Appliances with icon-based multi-select
    - Implement Step6Restrictions with multi-select input
    - Implement Step7CookTime with 4 time range options
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [ ] 6.3 Create OnboardingModal component
    - Implement modal with progress bar showing current step
    - Render appropriate step component based on currentStep
    - Implement Back and Next button navigation
    - Implement Complete Setup button on final step
    - Prevent modal dismissal until completion
    - _Requirements: 5.1, 5.2, 5.10, 5.11, 12.1_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement recipe form state management
  - [ ] 8.1 Create RecipeFormState class
    - Implement getDefaultState with sensible defaults
    - Implement initialize method to pre-populate from user profile
    - Implement setter methods for all form fields
    - Implement isValid method to check ingredient input
    - _Requirements: 6.14, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_
  
  - [ ] 8.2 Implement generateRecipe method
    - Construct RecipeRequest from form state
    - Call API client to generate recipe
    - Handle loading state during generation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11_

- [ ] 9. Create recipe form UI components
  - [ ] 9.1 Create form control components
    - Implement ToggleGroup for diet type selection
    - Implement Select component for meal type and cooking style
    - Implement CuisineChips with scrollable chip interface
    - Implement ApplianceIconGrid with icon-based multi-select
    - Implement PantryToggles with default staples pre-selected
    - Implement Slider for spice level
    - Implement TimeSlider for cook time (10-120 minutes, 5-min increments)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 12.5, 12.6_
  
  - [ ] 9.2 Implement voice input functionality
    - Add microphone button next to ingredient input
    - Implement Web Speech API integration with permission request
    - Capture spoken words and populate ingredient field
    - Handle speech recognition errors gracefully
    - Hide microphone button if Web Speech API not supported
    - _Requirements: 6.11, 6.12, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [ ] 9.3 Create RecipeForm component
    - Render all form sections with appropriate controls
    - Initialize form state from user profile on mount
    - Implement handleGenerate to call recipe generation
    - Implement handleVoiceInput for speech recognition
    - Display generated recipe using RecipeDisplay component
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.13, 6.14, 12.2_

- [ ] 10. Implement enhanced Bedrock prompt builder
  - Create buildEnhancedBedrockPrompt function
  - Include all recipe parameters: ingredients, pantry staples, diet type, meal type, cuisine, cooking style, appliances, spice level, health goal, cook time, dietary restrictions
  - Add JSON output format instructions with recipe structure
  - Add guidelines for ingredient usage, time constraints, spice level, health goals, appliance restrictions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12_

- [ ] 11. Create profile management components
  - [ ] 11.1 Create ProfilePage component
    - Implement profile loading on mount
    - Implement edit mode toggle
    - Implement profile form with all editable fields
    - Implement save functionality with validation
    - Display loading and error states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 12.3_
  
  - [ ] 11.2 Create ProfileHeader component
    - Display user avatar (generated from email)
    - Display display name and email
    - _Requirements: 3.1_
  
  - [ ] 11.3 Create ProfileForm component
    - Render editable fields for display name, diet preference, spice level, cooking goal, favorite cuisines, appliances, dietary restrictions, usual cooking time
    - Implement onChange handlers for all fields
    - Implement Save and Cancel buttons
    - _Requirements: 3.2, 3.3, 3.4, 12.3_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement recipe history components
  - [ ] 13.1 Create RecipeHistoryPanel component
    - Load all user recipes on mount
    - Implement filter state management
    - Apply filters to recipe list
    - Implement toggle favorite functionality
    - Implement delete functionality with confirmation dialog
    - Display empty state when no recipes found
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 4.9, 4.10, 12.4_
  
  - [ ] 13.2 Create FilterBar component
    - Implement cuisine filter dropdown
    - Implement meal type filter dropdown
    - Extract unique cuisines from recipe list
    - _Requirements: 4.7, 4.8_
  
  - [ ] 13.3 Create RecipeCard component
    - Display recipe title, date, and thumbnail
    - Display favorite star icon with toggle functionality
    - Display "View recipe" button
    - Display delete button
    - Implement hover effects with card elevation
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.9, 12.4_
  
  - [ ] 13.4 Create RecipeDisplay component
    - Display full recipe details: name, description, ingredients, instructions, nutrition info, difficulty, variation tips
    - Format ingredients with amounts and units
    - Display step-by-step instructions
    - Display nutrition information in structured format
    - _Requirements: 7.12_

- [ ] 14. Implement backend Lambda functions for profile management
  - [ ] 14.1 Create GET /profile Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Query DynamoDB_Users_Table by userId
    - Return user profile data
    - _Requirements: 10.1, 10.4, 10.7_
  
  - [ ] 14.2 Create PUT /profile Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Validate request body fields
    - Update DynamoDB_Users_Table with new values
    - Update updatedAt timestamp
    - Return updated profile
    - _Requirements: 10.2, 10.4, 10.5, 10.7_
  
  - [ ] 14.3 Create POST /profile/onboarding Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Validate onboarding responses
    - Create new profile record in DynamoDB_Users_Table
    - Set hasCompletedOnboarding to true
    - Return created profile
    - _Requirements: 10.3, 10.4, 10.5, 10.7_
  
  - [ ]* 14.4 Write unit tests for profile Lambda functions
    - Test GET /profile with valid and invalid tokens
    - Test PUT /profile with valid and invalid data
    - Test POST /profile/onboarding with complete responses
    - _Requirements: 10.4, 10.6, 10.7_

- [ ] 15. Implement backend Lambda functions for recipe history
  - [ ] 15.1 Create GET /recipes Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Query DynamoDB_RecipeHistory_Table by userId
    - Apply cuisine and mealType filters if provided
    - Sort results by createdAt descending
    - Support pagination with lastEvaluatedKey
    - Return recipe list
    - _Requirements: 11.1, 11.5, 11.6, 11.7, 11.8_
  
  - [ ] 15.2 Create GET /recipes/:recipeId Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Query DynamoDB_RecipeHistory_Table by userId and recipeId
    - Return single recipe
    - _Requirements: 11.2, 11.5, 11.8_
  
  - [ ] 15.3 Create PUT /recipes/:recipeId/favorite Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Update isFavorite field in DynamoDB_RecipeHistory_Table
    - Return updated recipe
    - _Requirements: 11.3, 11.5, 11.8_
  
  - [ ] 15.4 Create DELETE /recipes/:recipeId Lambda function
    - Validate JWT token from Authorization header
    - Extract userId from token
    - Delete recipe from DynamoDB_RecipeHistory_Table
    - Return success message
    - _Requirements: 11.4, 11.5, 11.8_
  
  - [ ]* 15.5 Write unit tests for recipe history Lambda functions
    - Test GET /recipes with filters and pagination
    - Test GET /recipes/:recipeId with valid and invalid IDs
    - Test PUT /recipes/:recipeId/favorite
    - Test DELETE /recipes/:recipeId with confirmation
    - _Requirements: 11.5, 11.8_

- [ ] 16. Update recipe generation Lambda function
  - Modify existing Lambda to accept enhanced RecipeRequest parameters
  - Integrate buildEnhancedBedrockPrompt function
  - Send enhanced prompt to Amazon Bedrock Claude 3
  - Parse Bedrock JSON response into Recipe object
  - Store generated recipe in DynamoDB_RecipeHistory_Table with userId
  - Return recipe to frontend
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 16.1, 16.2, 16.3, 16.4_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Create DynamoDB tables
  - [ ] 18.1 Create Users table
    - Set primary key to userId (String)
    - Configure provisioned capacity or on-demand billing
    - _Requirements: 8.1_
  
  - [ ] 18.2 Create RecipeHistory table
    - Set partition key to userId (String)
    - Set sort key to recipeId (String)
    - Configure provisioned capacity or on-demand billing
    - _Requirements: 9.1_

- [ ] 19. Implement layout and routing
  - [ ] 19.1 Create Layout component
    - Render FloatingBackground component
    - Wrap content in CustomCursorProvider
    - Render Header with navigation
    - Render page content
    - _Requirements: 1.1, 2.5, 12.7, 12.8_
  
  - [ ] 19.2 Set up Next.js routing
    - Create home page with RecipeForm
    - Create profile page route
    - Create recipe history page route
    - Implement protected routes with authentication check
    - _Requirements: 14.1, 14.2_
  
  - [ ] 19.3 Implement authentication flow
    - Check for first-time user on login
    - Display OnboardingModal if hasCompletedOnboarding is false
    - Redirect to home page after onboarding completion
    - _Requirements: 5.1, 5.2, 5.11, 5.12_

- [ ] 20. Implement responsive design
  - Create mobile-first CSS with breakpoints at 640px, 768px, 1024px, 1280px
  - Implement vertical stacking for form controls on mobile
  - Implement multi-column layout for form controls on desktop
  - Ensure onboarding modal is responsive across all screen sizes
  - Ensure profile page is responsive across all screen sizes
  - Ensure recipe history panel is responsive across all screen sizes
  - Test touch interactions on mobile devices
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ] 21. Implement recipe data parser and serializer
  - Create parseRecipe function to convert JSON to Recipe object
  - Create serializeRecipe function to convert Recipe object to JSON
  - Implement error handling for malformed recipe data
  - Validate round-trip property: parse -> serialize -> parse produces equivalent object
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

- [ ] 22. Configure environment variables and deployment
  - Create .env.local file with API Gateway endpoints
  - Configure Cognito User Pool ID and Client ID
  - Configure AWS region
  - Document local setup instructions in README
  - _Requirements: 14.2, 14.3, 14.4, 14.5_

- [ ] 23. Final integration and testing
  - Test complete user flow: sign up -> onboarding -> recipe generation -> profile edit -> recipe history
  - Test voice input functionality across browsers
  - Test custom cursor across browsers
  - Test floating animations performance
  - Test responsive design on multiple devices
  - Test error handling for API failures
  - Verify all animations use CSS only without JavaScript libraries
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation focuses on local development first before any deployment
- All animations use pure CSS for optimal performance
- Voice input gracefully degrades if Web Speech API is not supported
- Custom cursor is disabled on touch devices for better UX
