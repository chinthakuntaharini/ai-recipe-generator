import { parseRecipe, serializeRecipe, validateRoundTrip, parseRecipes, RecipeParseError } from '../recipe-parser';
import { Recipe } from '@/types';

describe('Recipe Parser', () => {
  const mockRecipe: Recipe = {
    id: 'test-123',
    userId: 'user-456',
    title: 'Test Recipe',
    description: 'A test recipe description',
    ingredients: [
      { name: 'flour', amount: '2', unit: 'cups' },
      { name: 'sugar', amount: '1', unit: 'cup' },
    ],
    instructions: [
      'Mix ingredients',
      'Bake at 350F',
    ],
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    nutritionInfo: {
      calories: 250,
      protein: '5g',
      carbohydrates: '45g',
      fat: '8g',
    },
    difficulty: 'Easy',
    variationTips: ['Add chocolate chips', 'Try whole wheat flour'],
    cuisine: 'American',
    mealType: 'Dessert',
    isFavorite: false,
    createdAt: '2024-01-01T00:00:00Z',
    tags: ['quick', 'easy'],
  };

  describe('parseRecipe', () => {
    it('should parse a valid recipe', () => {
      const result = parseRecipe(mockRecipe);
      expect(result.id).toBe('test-123');
      expect(result.title).toBe('Test Recipe');
      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toHaveLength(2);
    });

    it('should throw error for null data', () => {
      expect(() => parseRecipe(null)).toThrow(RecipeParseError);
    });

    it('should throw error for missing id', () => {
      const invalid = { ...mockRecipe, id: undefined };
      expect(() => parseRecipe(invalid)).toThrow('Recipe ID is missing');
    });

    it('should throw error for missing title', () => {
      const invalid = { ...mockRecipe, title: undefined };
      expect(() => parseRecipe(invalid)).toThrow('Recipe title is missing');
    });

    it('should handle string ingredients', () => {
      const data = {
        ...mockRecipe,
        ingredients: ['flour', 'sugar', 'eggs'],
      };
      const result = parseRecipe(data);
      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients[0]).toEqual({ name: 'flour', amount: '', unit: '' });
    });

    it('should handle missing optional fields', () => {
      const minimal = {
        id: 'test-123',
        title: 'Minimal Recipe',
        ingredients: [],
        instructions: [],
        createdAt: '2024-01-01T00:00:00Z',
      };
      const result = parseRecipe(minimal);
      expect(result.id).toBe('test-123');
      expect(result.title).toBe('Minimal Recipe');
      expect(result.description).toBeUndefined();
      expect(result.nutritionInfo).toBeUndefined();
    });
  });

  describe('serializeRecipe', () => {
    it('should serialize a recipe to JSON', () => {
      const result = serializeRecipe(mockRecipe);
      expect(result.id).toBe('test-123');
      expect(result.title).toBe('Test Recipe');
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0]).toEqual({ name: 'flour', amount: '2', unit: 'cups' });
    });

    it('should include all fields', () => {
      const result = serializeRecipe(mockRecipe);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('ingredients');
      expect(result).toHaveProperty('instructions');
      expect(result).toHaveProperty('nutritionInfo');
      expect(result).toHaveProperty('difficulty');
      expect(result).toHaveProperty('variationTips');
      expect(result).toHaveProperty('cuisine');
      expect(result).toHaveProperty('mealType');
      expect(result).toHaveProperty('isFavorite');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('tags');
    });
  });

  describe('validateRoundTrip', () => {
    it('should validate successful round-trip', () => {
      const result = validateRoundTrip(mockRecipe);
      expect(result).toBe(true);
    });

    it('should return true for recipe with all fields', () => {
      const result = validateRoundTrip(mockRecipe);
      expect(result).toBe(true);
    });

    it('should handle recipe with minimal fields', () => {
      const minimal: Recipe = {
        id: 'test-123',
        title: 'Minimal Recipe',
        ingredients: [],
        instructions: [],
        createdAt: '2024-01-01T00:00:00Z',
      };
      const result = validateRoundTrip(minimal);
      expect(result).toBe(true);
    });
  });

  describe('parseRecipes', () => {
    it('should parse array of recipes', () => {
      const recipes = [mockRecipe, { ...mockRecipe, id: 'test-456', title: 'Recipe 2' }];
      const result = parseRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-123');
      expect(result[1].id).toBe('test-456');
    });

    it('should throw error for non-array input', () => {
      expect(() => parseRecipes({} as any)).toThrow('Expected array of recipes');
    });

    it('should skip invalid recipes but parse valid ones', () => {
      const recipes = [
        mockRecipe,
        { id: 'invalid' }, // Missing title
        { ...mockRecipe, id: 'test-789', title: 'Recipe 3' },
      ];
      const result = parseRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-123');
      expect(result[1].id).toBe('test-789');
    });

    it('should throw error if more than 50% fail', () => {
      const recipes = [
        { id: 'invalid-1' },
        { id: 'invalid-2' },
        mockRecipe,
      ];
      expect(() => parseRecipes(recipes)).toThrow('Failed to parse 2 out of 3 recipes');
    });
  });
});
