'use client';

import React, { useState } from 'react';
import { RecipeFormState, DietType, MealType, CookingStyle, Appliance, SpiceLevel, CookingGoal } from '@/types';
import { apiClient } from '@/lib/api-client';

const RecipeForm: React.FC = () => {
  const [formState, setFormState] = useState<RecipeFormState>({
    dietType: 'Vegetarian',
    mealType: 'Lunch',
    cuisine: 'Indian',
    cookingStyle: 'Curry',
    appliances: ['Gas stove'],
    pantryStaples: {
      'Salt': true,
      'Turmeric': true,
      'Red chilli powder': true,
      'Coriander powder': true,
      'Cumin': true,
      'Garam masala': true,
      'Oil': true,
      'Garlic': true,
      'Ginger': true,
      'Onion': true,
      'Tomato': true,
    },
    spiceLevel: 'Medium',
    healthGoal: 'Balanced',
    cookTime: 30,
    ingredients: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // Check if Web Speech API is supported
  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsVoiceSupported(!!SpeechRecognition);
  }, []);

  const dietTypes: DietType[] = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'];
  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Dessert'];
  const cuisines = ['Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese', 'Thai', 'Korean', 'Middle Eastern', 'Mediterranean', 'Continental', 'French', 'Spanish', 'Greek', 'Vietnamese', 'Fusion'];
  const cookingStyles: CookingStyle[] = ['Curry', 'Dry / Stir-fry', 'Deep fry', 'Semi-curry / Gravy', 'Steamed', 'Baked', 'Grilled', 'Salad / Raw'];
  const appliances: Appliance[] = ['Gas stove', 'Induction', 'Microwave', 'Air fryer', 'Oven/OTG', 'Pressure cooker'];
  const spiceLevels: SpiceLevel[] = ['Mild', 'Medium', 'Spicy', 'Extra spicy'];
  const healthGoals: CookingGoal[] = ['Fitness & Health', 'Taste & Indulgence', 'Balanced'];

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsVoiceActive(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormState({ ...formState, ingredients: transcript });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsVoiceActive(false);
      
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access to use voice input.');
      } else if (event.error === 'no-speech') {
        alert('No speech detected. Please try again.');
      } else {
        alert('Voice input failed. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsVoiceActive(false);
      alert('Failed to start voice input. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (!formState.ingredients.trim()) {
      alert('Please enter at least one ingredient');
      return;
    }

    setIsGenerating(true);
    try {
      const recipe = await apiClient.generateRecipe({
        dietType: formState.dietType,
        mealType: formState.mealType,
        cuisine: formState.cuisine,
        cookingStyle: formState.cookingStyle,
        appliances: formState.appliances,
        pantryStaples: Object.keys(formState.pantryStaples).filter(k => formState.pantryStaples[k]),
        spiceLevel: formState.spiceLevel,
        healthGoal: formState.healthGoal,
        cookTime: formState.cookTime,
        ingredients: formState.ingredients.split(',').map(i => i.trim()),
        restrictions: [],
      });
      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error('Recipe generation failed:', error);
      alert('Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
        Generate Your Perfect Recipe
      </h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        {/* Diet Type */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Diet Type
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {dietTypes.map(type => (
              <button
                key={type}
                onClick={() => setFormState({ ...formState, dietType: type })}
                className={`toggle-pill ${formState.dietType === type ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Type */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Meal Type
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {mealTypes.map(type => (
              <button
                key={type}
                onClick={() => setFormState({ ...formState, mealType: type })}
                className={`toggle-pill ${formState.mealType === type ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Cuisine
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {cuisines.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setFormState({ ...formState, cuisine })}
                className={`toggle-pill ${formState.cuisine === cuisine ? 'active' : ''}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Cooking Style */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Cooking Style
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {cookingStyles.map(style => (
              <button
                key={style}
                onClick={() => setFormState({ ...formState, cookingStyle: style })}
                className={`toggle-pill ${formState.cookingStyle === style ? 'active' : ''}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Cook Time Slider */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Cook Time: ~{formState.cookTime} minutes
          </label>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={formState.cookTime}
            onChange={(e) => setFormState({ ...formState, cookTime: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            What ingredients do you have?
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <textarea
              value={formState.ingredients}
              onChange={(e) => setFormState({ ...formState, ingredients: e.target.value })}
              placeholder="Enter ingredients separated by commas (e.g., chicken, rice, tomatoes)"
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                minHeight: '100px',
                fontSize: '1rem',
              }}
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isVoiceActive}
                className="btn-voice"
                title={isVoiceActive ? 'Listening...' : 'Click to speak ingredients'}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  background: isVoiceActive ? '#ef4444' : '#fff',
                  color: isVoiceActive ? '#fff' : '#333',
                  cursor: isVoiceActive ? 'not-allowed' : 'pointer',
                  minWidth: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}
          </div>
          {isVoiceActive && (
            <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
              🎤 Listening... Speak your ingredients now
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !formState.ingredients.trim()}
          className="btn btn-primary"
          style={{
            width: '100%',
              padding: '1rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate My Recipe'}
          </button>
        </div>

      {/* Generated Recipe Display */}
      {generatedRecipe && (
        <div className="card recipe-card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {generatedRecipe.title}
          </h2>
          {generatedRecipe.description && (
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              {generatedRecipe.description}
            </p>
          )}
          
          <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Ingredients:</h3>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
            {generatedRecipe.ingredients.map((ing: any, i: number) => (
              <li key={i}>
                {ing.amount && ing.unit ? `${ing.amount} ${ing.unit} ` : ''}
                {ing.name}
              </li>
            ))}
          </ul>

          <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Instructions:</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            {generatedRecipe.instructions.map((step: string, i: number) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>{step}</li>
            ))}
          </ol>

          {generatedRecipe.nutritionInfo && (
            <>
              <h3 style={{ fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Nutrition Info:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                {generatedRecipe.nutritionInfo.calories && (
                  <div>
                    <strong>Calories:</strong> {generatedRecipe.nutritionInfo.calories}
                  </div>
                )}
                {generatedRecipe.nutritionInfo.protein && (
                  <div>
                    <strong>Protein:</strong> {generatedRecipe.nutritionInfo.protein}
                  </div>
                )}
                {(generatedRecipe.nutritionInfo.carbs || generatedRecipe.nutritionInfo.carbohydrates) && (
                  <div>
                    <strong>Carbs:</strong> {generatedRecipe.nutritionInfo.carbs || generatedRecipe.nutritionInfo.carbohydrates}
                  </div>
                )}
                {generatedRecipe.nutritionInfo.fat && (
                  <div>
                    <strong>Fat:</strong> {generatedRecipe.nutritionInfo.fat}
                  </div>
                )}
              </div>
            </>
          )}

          {generatedRecipe.variationTips && generatedRecipe.variationTips.length > 0 && (
            <>
              <h3 style={{ fontWeight: '600', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Variation Tips:</h3>
              <ul style={{ paddingLeft: '1.5rem' }}>
                {generatedRecipe.variationTips.map((tip: string, i: number) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{tip}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeForm;
