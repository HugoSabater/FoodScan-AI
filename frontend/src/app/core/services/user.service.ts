import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserProfile {
    id: number | null;
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
    id: null,
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

    constructor() {
        // If no ID exists, trigger guest registration
        if (this.profile().id === null) {
            this.registerGuest();
        }
    }

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

    private isRegistering = false;

    /**
     * Register a guest user from the backend
     */
    private registerGuest(retryCount = 0): void {
        if (this.isRegistering && retryCount === 0) return;
        this.isRegistering = true;

        this.http.post<{ success: boolean, data: UserProfile }>('/api/auth/register-guest', {})
            .subscribe({
                next: (res) => {
                    const current = this.profile();
                    const newProfile: UserProfile = {
                        ...current,
                        id: res.data.id,
                        name: res.data.name
                    };
                    this.saveProfile(newProfile);
                    console.log('Guest session initialized:', res.data.id);
                    this.isRegistering = false;
                },
                error: (err) => {
                    console.error('Failed to register guest:', err);
                    if (retryCount < 1) {
                        console.warn('Retrying guest registration...');
                        setTimeout(() => this.registerGuest(retryCount + 1), 2000);
                    } else {
                        console.error('Guest registration failed after retries. Falling back to Demo 1.');
                        const current = this.profile();
                        this.saveProfile({
                            ...current,
                            id: 1, // Fallback to Admin Demo
                            name: 'Invitado (Demo 1)'
                        });
                        this.isRegistering = false;
                    }
                }
            });
    }

    /**
     * Reset profile to defaults
     */
    resetProfile(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.profile.set({ ...DEFAULT_PROFILE });
        this.mealPlan.set([]);
        this.registerGuest(); // Get a new guest ID
    }

    /**
     * Generate AI Meal Plan
     */
    /**
     * Generate AI Meal Plan
     */
    generateMealPlan(): void {
        const profile = this.profile();
        if (this.loadingMealPlan()) return;

        this.loadingMealPlan.set(true);
        this.mealPlanError.set(null);

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

    /**
     * Get User Statistics
     */
    getStats(userId: string | number): Observable<UserStats> {
        return this.http.get<{ success: boolean, data: UserStats }>(`/api/users/${userId}/stats`)
            .pipe(map(res => res.data));
    }
}

export interface UserStats {
    totalScans: number;
    nutriScoreDistribution: {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        unknown: number;
    };
    suitability: {
        suitable: number;
        unsuitable: number;
        unknown: number;
    };
}
