import { Component, input, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductData, AnalysisData } from '../../../core/services/scan.service';

export interface ProductCardData {
  product: ProductData;
  analysis: AnalysisData;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  /** Product and analysis data */
  readonly data = input.required<ProductCardData>();

  /** Event emitted when user wants to see details */
  readonly openDetail = output<ProductCardData>();

  /** Border class based on suitability */
  readonly borderClass = computed(() =>
    this.data().analysis.is_suitable ? 'c-product-card--suitable' : 'c-product-card--warning'
  );

  /** Formatted nutri-score (uppercase) */
  readonly nutriScoreFormatted = computed(() =>
    this.data().product.nutri_score?.toUpperCase() || 'N/A'
  );

  /** Score color class based on value */
  readonly scoreColorClass = computed(() => {
    const score = this.data().analysis.custom_health_score;
    if (score >= 70) return 'c-product-card__score--high';
    if (score >= 40) return 'c-product-card__score--mid';
    return 'c-product-card__score--low';
  });

  /** Tracks whether the product image failed to load */
  readonly imageError = signal(false);

  /**
   * Handle "Ver detalles" button click
   */
  onViewDetailsClick(): void {
    this.openDetail.emit(this.data());
  }
}
