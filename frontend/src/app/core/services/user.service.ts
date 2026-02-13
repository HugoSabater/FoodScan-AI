import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UserProfile {
    name: string;
    diet: 'omnivoro' | 'vegano' | 'keto' | 'paleo';
    allergies: string[];
}

export interface MealPlanItem {
    type: 'Desayuno' | 'Comida' | 'Cena';
    name: string;
    calories: number;
    ingredients: string[];
    reason: string;
}

const DEFAULT_PROFILE: UserProfile = {
    name: '',
    diet: 'omnivoro',
    allergies: [],
};

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly STORAGE_KEY = 'foodscan_user_profile';

    /** Current user profile */
    readonly profile = signal<UserProfile>(this.loadProfile());

    /** Meal Plan State */
    readonly mealPlan = signal<MealPlanItem[]>([]);
    readonly loadingMealPlan = signal<boolean>(false);
    readonly mealPlanError = signal<string | null>(null);

    /**
     * Load profile from localStorage
     */
    private loadProfile(): UserProfile {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
        return { ...DEFAULT_PROFILE };
    }

    /**
     * Save profile to localStorage and update signal
     */
    saveProfile(profile: UserProfile): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
            this.profile.set(profile);
            // Clear existing meal plan when profile changes to force regeneration
            this.mealPlan.set([]);
        } catch (error) {
            console.error('Error saving profile:', error);
            throw new Error('No se pudo guardar el perfil');
        }
    }

    /**
     * Reset profile to defaults
     */
    resetProfile(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.profile.set({ ...DEFAULT_PROFILE });
        this.mealPlan.set([]);
    }

    /**
     * Generate AI Meal Plan
     */
    generateMealPlan(): void {
        if (this.loadingMealPlan()) return;

        this.loadingMealPlan.set(true);
        this.mealPlanError.set(null);

        const profile = this.profile();

        this.http.post<{ success: boolean, data: MealPlanItem[] }>('/api/users/meal-plan', { profile })
            .subscribe({
                next: (res) => {
                    this.mealPlan.set(res.data);
                    this.loadingMealPlan.set(false);
                },
                error: (err) => {
                    console.error('Error generating meal plan:', err);
                    this.mealPlanError.set('No se pudo generar el plan. Inténtalo de nuevo.');
                    this.loadingMealPlan.set(false);
                }
            });
    }
}
