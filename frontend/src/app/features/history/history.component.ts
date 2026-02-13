import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../shared/components/product-detail-modal/product-detail-modal.component';
import { ScanService, HistoryScan } from '../../core/services/scan.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, ProductDetailModalComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  // ── State Signals ─────────────────────────
  readonly isLoading = signal(true);
  readonly isEmpty = signal(false);
  readonly historyItems = signal<ProductCardData[]>([]);
  readonly error = signal<string | null>(null);

  /** Modal state */
  readonly showModal = signal(false);
  readonly modalData = signal<ProductCardData | null>(null);

  constructor(
    private readonly scanService: ScanService,
    private readonly userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Load user scan history from backend
   */
  private loadHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Use hardcoded userId 2 (same as scanner)
    // TODO: Replace with actual user ID from auth system
    const userId = 2;

    this.scanService.getHistory(userId).subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          // Map backend scans to ProductCardData format
          const items = response.data.map((scan) => this.mapScanToCardData(scan));
          this.historyItems.set(items);
          this.isEmpty.set(false);
        } else {
          this.historyItems.set([]);
          this.isEmpty.set(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.error.set('Error al cargar el historial');
        this.isLoading.set(false);
        this.isEmpty.set(true);
      },
    });
  }

  /**
   * Map backend HistoryScan to ProductCardData
   * Note: Backend doesn't return analysis data in history,
   * so we create a placeholder analysis object
   */
  private mapScanToCardData(scan: HistoryScan): ProductCardData {
    return {
      product: scan.product,
      analysis: {
        is_suitable: true, // Default to suitable (no analysis in history)
        analysis_reason: 'Escaneado anteriormente',
        custom_health_score: this.estimateScoreFromNutriScore(scan.product.nutri_score),
        ai_model: 'history',
        analyzed_at: scan.scanned_at,
      },
    };
  }

  /**
   * Estimate health score from Nutri-Score grade
   */
  private estimateScoreFromNutriScore(nutriScore: string): number {
    const scoreMap: Record<string, number> = {
      'a': 90,
      'b': 75,
      'c': 60,
      'd': 40,
      'e': 20,
    };
    return scoreMap[nutriScore?.toLowerCase()] || 50;
  }

  /**
   * Retry loading history
   */
  retry(): void {
    this.loadHistory();
  }

  /**
   * Handle product card detail request
   */
  handleOpenDetail(data: ProductCardData): void {
    this.modalData.set(data);
    this.showModal.set(true);
  }

  /**
   * Close product detail modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.modalData.set(null);
  }
}
