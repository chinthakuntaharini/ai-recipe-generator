import { OnboardingState, OnboardingResponses, OnboardingStep } from '@/types';
import { apiClient } from './api-client';

export class OnboardingMachine {
  private state: OnboardingState;

  constructor() {
    this.state = {
      currentStep: 1,
      responses: {},
    };
  }

  getCurrentStep(): OnboardingStep {
    return this.state.currentStep;
  }

  getResponses(): Partial<OnboardingResponses> {
    return this.state.responses;
  }

  canGoNext(): boolean {
    const step = this.state.currentStep;
    const responses = this.state.responses;

    switch (step) {
      case 1:
        return !!responses.dietPreference;
      case 2:
        return !!responses.spiceLevel;
      case 3:
        return !!responses.cookingGoal;
      case 4:
        return !!responses.favoriteCuisines && responses.favoriteCuisines.length > 0;
      case 5:
        return !!responses.availableAppliances && responses.availableAppliances.length > 0;
      case 6:
        return !!responses.dietaryRestrictions;
      case 7:
        return !!responses.usualCookingTime;
      default:
        return false;
    }
  }

  canGoBack(): boolean {
    return this.state.currentStep > 1;
  }

  goNext(): void {
    if (this.canGoNext() && this.state.currentStep < 7) {
      this.state.currentStep = (this.state.currentStep + 1) as OnboardingStep;
    }
  }

  goBack(): void {
    if (this.canGoBack()) {
      this.state.currentStep = (this.state.currentStep - 1) as OnboardingStep;
    }
  }

  updateResponse<K extends keyof OnboardingResponses>(
    key: K,
    value: OnboardingResponses[K]
  ): void {
    this.state.responses[key] = value;
  }

  async submit(): Promise<void> {
    if (!this.isComplete()) {
      throw new Error('Onboarding not complete');
    }

    await apiClient.createProfileFromOnboarding(
      this.state.responses as OnboardingResponses
    );
  }

  private isComplete(): boolean {
    const r = this.state.responses;
    return !!(
      r.dietPreference &&
      r.spiceLevel &&
      r.cookingGoal &&
      r.favoriteCuisines &&
      r.availableAppliances &&
      r.dietaryRestrictions !== undefined &&
      r.usualCookingTime
    );
  }
}
