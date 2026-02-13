import { Injectable, signal } from '@angular/core';

export interface UserProfile {
    name: string;
    diet: 'omnivoro' | 'vegano' | 'keto' | 'paleo';
    allergies: string[];
}

const DEFAULT_PROFILE: UserProfile = {
    name: '',
    diet: 'omnivoro',
    allergies: [],
};

@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly STORAGE_KEY = 'foodscan_user_profile';

    /** Current user profile */
    readonly profile = signal<UserProfile>(this.loadProfile());

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
    }
}
