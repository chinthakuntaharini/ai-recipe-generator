'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '../../types';
import { apiClient } from '../../lib/api-client';

export default function RecipeHistoryPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState<string>('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recipes, cuisineFilter, mealTypeFilter]);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getRecipes();
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    if (cuisineFilter) {
      filtered = filtered.filter(r => r.cuisine === cuisineFilter);
    }

    if (mealTypeFilter) {
      filtered = filtered.filter(r => r.mealType === mealTypeFilter);
    }

    setFilteredRecipes(filtered);
  };

  const handleToggleFavorite = async (recipeId: string, currentStatus: boolean) => {
    try {
      await apiClient.toggleFavorite(recipeId, !currentStatus);
      setRecipes(recipes.map(r => 
        r.id === recipeId ? { ...r, isFavorite: !currentStatus } : r
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  };

  const handleDelete = async (recipeId: string) => {
    try {
      await apiClient.deleteRecipe(recipeId);
      setRecipes(recipes.filter(r => r.id !== recipeId));
      setDeleteConfirm(null);
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
    }
  };

  const getUniqueCuisines = (): string[] => {
    const cuisines = recipes.map(r => r.cuisine).filter((c): c is string => !!c);
    return Array.from(new Set(cuisines)).sort();
  };

  const getUniqueMealTypes = (): string[] => {
    const mealTypes = recipes.map(r => r.mealType).filter((m): m is string => !!m);
    return Array.from(new Set(mealTypes)).sort();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="history-page">
        <div className="history-container">
          <div className="loading">Loading recipes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        <h1>My Recipe History</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="filter-bar">
          <div className="filter-group">
            <label>Cuisine</label>
            <select 
              value={cuisineFilter} 
              onChange={(e) => setCuisineFilter(e.target.value)}
            >
              <option value="">All Cuisines</option>
              {getUniqueCuisines().map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Meal Type</label>
            <select 
              value={mealTypeFilter} 
              onChange={(e) => setMealTypeFilter(e.target.value)}
            >
              <option value="">All Meal Types</option>
              {getUniqueMealTypes().map(mealType => (
                <option key={mealType} value={mealType}>{mealType}</option>
              ))}
            </select>
          </div>

          {(cuisineFilter || mealTypeFilter) && (
            <button 
              className="clear-filters"
              onClick={() => {
                setCuisineFilter('');
                setMealTypeFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <p>No recipes found</p>
            {(cuisineFilter || mealTypeFilter) && (
              <p className="hint">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div className="recipe-grid">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-card-header">
                  <h3>{recipe.title}</h3>
                  <button
                    className={`favorite-button ${recipe.isFavorite ? 'active' : ''}`}
                    onClick={() => handleToggleFavorite(recipe.id, recipe.isFavorite || false)}
                    title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    ★
                  </button>
                </div>

                <div className="recipe-card-meta">
                  <span className="date">{formatDate(recipe.createdAt)}</span>
                  {recipe.cuisine && <span className="cuisine">{recipe.cuisine}</span>}
                  {recipe.mealType && <span className="meal-type">{recipe.mealType}</span>}
                </div>

                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}

                <div className="recipe-card-footer">
                  <button
                    className="view-button"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    View Recipe
                  </button>
                  
                  {deleteConfirm === recipe.id ? (
                    <div className="delete-confirm">
                      <span>Delete?</span>
                      <button
                        className="confirm-yes"
                        onClick={() => handleDelete(recipe.id)}
                      >
                        Yes
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="delete-button"
                      onClick={() => setDeleteConfirm(recipe.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRecipe && (
          <div className="recipe-modal" onClick={() => setSelectedRecipe(null)}>
            <div className="recipe-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="close-button"
                onClick={() => setSelectedRecipe(null)}
              >
                ×
              </button>

              <h2>{selectedRecipe.title}</h2>
              
              {selectedRecipe.description && (
                <p className="description">{selectedRecipe.description}</p>
              )}

              <div className="recipe-meta">
                {selectedRecipe.prepTime && (
                  <span>Prep: {selectedRecipe.prepTime} min</span>
                )}
                {selectedRecipe.cookTime && (
                  <span>Cook: {selectedRecipe.cookTime} min</span>
                )}
                {selectedRecipe.servings && (
                  <span>Servings: {selectedRecipe.servings}</span>
                )}
                {selectedRecipe.difficulty && (
                  <span>Difficulty: {selectedRecipe.difficulty}</span>
                )}
              </div>

              <div className="recipe-section">
                <h3>Ingredients</h3>
                <ul className="ingredients-list">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx}>
                      {ing.amount && ing.unit 
                        ? `${ing.amount} ${ing.unit} ${ing.name}`
                        : ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="recipe-section">
                <h3>Instructions</h3>
                <ol className="instructions-list">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {selectedRecipe.nutritionInfo && (
                <div className="recipe-section">
                  <h3>Nutrition (per serving)</h3>
                  <div className="nutrition-grid">
                    {selectedRecipe.nutritionInfo.calories && (
                      <div className="nutrition-item">
                        <span className="label">Calories</span>
                        <span className="value">{selectedRecipe.nutritionInfo.calories}</span>
                      </div>
                    )}
                    {selectedRecipe.nutritionInfo.protein && (
                      <div className="nutrition-item">
                        <span className="label">Protein</span>
                        <span className="value">{selectedRecipe.nutritionInfo.protein}</span>
                      </div>
                    )}
                    {selectedRecipe.nutritionInfo.carbs && (
                      <div className="nutrition-item">
                        <span className="label">Carbs</span>
                        <span className="value">{selectedRecipe.nutritionInfo.carbs}</span>
                      </div>
                    )}
                    {selectedRecipe.nutritionInfo.fat && (
                      <div className="nutrition-item">
                        <span className="label">Fat</span>
                        <span className="value">{selectedRecipe.nutritionInfo.fat}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecipe.variationTips && selectedRecipe.variationTips.length > 0 && (
                <div className="recipe-section">
                  <h3>Variation Tips</h3>
                  <ul className="tips-list">
                    {selectedRecipe.variationTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
