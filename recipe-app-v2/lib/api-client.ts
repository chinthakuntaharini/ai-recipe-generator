import { UserProfile, Recipe, RecipeRequest, OnboardingResponses } from '@/types';

class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private authBaseURL: string;
  private recipeBaseURL: string;
  private token: string | null = null;

  constructor() {
    this.authBaseURL = process.env.NEXT_PUBLIC_AUTH_API_URL || '';
    this.recipeBaseURL = process.env.NEXT_PUBLIC_RECIPE_API_URL || '';
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useRecipeAPI: boolean = false
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

    const baseURL = useRecipeAPI ? this.recipeBaseURL : this.authBaseURL;
    const response = await fetch(`${baseURL}${endpoint}`, {
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
    return this.request<Recipe[]>(`/recipes${query ? `?${query}` : ''}`, {}, true);
  }

  async getRecipe(recipeId: string): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${recipeId}`, {}, true);
  }

  async toggleFavorite(recipeId: string, isFavorite: boolean): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${recipeId}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    }, true);
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    return this.request<void>(`/recipes/${recipeId}`, {
      method: 'DELETE',
    }, true);
  }

  // Recipe generation
  async generateRecipe(request: RecipeRequest): Promise<Recipe> {
    return this.request<Recipe>('/generate-recipe', {
      method: 'POST',
      body: JSON.stringify(request),
    }, true); // Use recipe API
  }
}

export const apiClient = new APIClient();
export { APIError };
