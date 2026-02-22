import { Component, input, output, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProductDetailModalData {
    product: {
        id: number;
        barcode: string;
        name: string;
        brand: string;
        nutri_score: string;
        image_url: string;
        ingredients_text: string;
    };
    analysis: {
        is_suitable: boolean;
        analysis_reason: string;
        custom_health_score: number;
        ai_model: string;
        analyzed_at: string;
        diet?: string;
        allergies?: string;
    };
}

import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-product-detail-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-detail-modal.component.html',
    styleUrl: './product-detail-modal.component.scss',
})
export class ProductDetailModalComponent {
    private readonly userService = inject(UserService);
    /** Product and analysis data */
    readonly data = input.required<ProductDetailModalData>();

    /** Close event */
    readonly close = output<void>();

    /** Tracks whether the product image failed to load at runtime */
    readonly imageError = signal(false);

    /** Detects if the current user profile differs from the one used in the analysis */
    readonly isProfileMismatch = computed(() => {
        const currentProfile = this.userService.profile();
        const analysis = this.data().analysis;

        // 1. If there is no analysis, or it is an old scan that did not save the diet, we hide the notice
        if (!analysis || !analysis.diet) return false;

        // 2. Normalize current allergies: if empty, use 'none' to match the backend
        const currentAllergies = currentProfile.allergies.length > 0
            ? [...currentProfile.allergies].sort().join(',')
            : 'none';

        const historicalAllergies = analysis.allergies || 'none';

        // 3. Compare
        return analysis.diet !== currentProfile.diet || historicalAllergies !== currentAllergies;
    });

    constructor() {
        // Reset image error state every time a new product is loaded in the modal.
        // Without this, opening a second product after one with a broken image
        // would incorrectly keep imageError = true and hide the valid image.
        effect(() => {
            this.data(); // subscribe to input changes
            this.imageError.set(false);
        });
    }

    /**
     * Returns the BEM modifier class for the given Nutri-Score letter.
     * Nutri-Score palette: A=dark-green, B=light-green, C=yellow, D=orange, E=red
     */
    getNutriScoreClass(score: string | null | undefined): string {
        if (!score) return 'c-nutriscore--unknown';
        return `c-nutriscore--${score.toLowerCase()}`;
    }

    /**
     * Returns a BEM modifier class based on the health score.
     * ≥ 50 → green (good), < 50 → red (danger)
     */
    getHealthScoreColor(score: number): string {
        return score >= 50 ? 'c-modal__score-value--good' : 'c-modal__score-value--bad';
    }

    /**
     * Handle backdrop click (close modal)
     */
    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close.emit();
        }
    }

    /**
     * Handle close button click
     */
    onCloseClick(): void {
        this.close.emit();
    }
}
