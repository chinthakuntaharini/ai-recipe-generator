import { UserProfile, Recipe, RecipeRequest, OnboardingResponses } from '@/types';

class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || '';
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new APIError(
        response.status,
        errorData.error || errorData.message || 'Request failed'
      );
    }

    return response.json();
  }

  // Profile endpoints
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/profile');
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async createProfileFromOnboarding(
    responses: OnboardingResponses
  ): Promise<UserProfile> {
    return this.request<UserProfile>('/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(responses),
    });
  }

  // Recipe endpoints
  async getRecipes(filters?: {
    cuisine?: string;
    mealType?: string;
  }): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (filters?.cuisine) params.append('cuisine', filters.cuisine);
    if (filters?.mealType) params.append('mealType', filters.mealType);
    
    const query = params.toString();
    return this.request<Recipe[]>(`/recipes${query ? `?${query}` : ''}`);
  }

  async getRecipe(recipeId: string): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${recipeId}`);
  }

  async toggleFavorite(recipeId: string, isFavorite: boolean): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${recipeId}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    });
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    return this.request<void>(`/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  }

  // Recipe generation
  async generateRecipe(request: RecipeRequest): Promise<Recipe> {
    return this.request<Recipe>('/generate-recipe', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const apiClient = new APIClient();
export { APIError };
