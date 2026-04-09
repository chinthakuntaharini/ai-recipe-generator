import { Auth } from 'aws-amplify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

class ApiClient {
  async getAuthHeaders() {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      throw new Error('Authentication required');
    }
  }

  async generateRecipe(ingredients, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ingredients,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getRecipes(limit = 20, lastEvaluatedKey = null) {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (lastEvaluatedKey) params.append('lastEvaluatedKey', encodeURIComponent(JSON.stringify(lastEvaluatedKey)));

    const response = await fetch(`${API_BASE_URL}/recipes?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getRecipe(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async toggleFavorite(recipeId) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/favorite`, {
      method: 'PUT',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getFavorites() {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/recipes/favorites`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

export default new ApiClient();