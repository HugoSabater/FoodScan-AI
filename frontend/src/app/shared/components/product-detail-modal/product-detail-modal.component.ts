import { Component, input, output } from '@angular/core';
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
    };
}

@Component({
    selector: 'app-product-detail-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-detail-modal.component.html',
    styleUrl: './product-detail-modal.component.scss',
})
export class ProductDetailModalComponent {
    /** Product and analysis data */
    readonly data = input.required<ProductDetailModalData>();

    /** Close event */
    readonly close = output<void>();

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
