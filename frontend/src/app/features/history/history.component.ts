import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
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

  private readonly scanService = inject(ScanService);
  private readonly userService = inject(UserService);

  /** Tracks PDF generation to show spinner on button */
  readonly isGeneratingPdf = signal(false);

  /**
   * Deduplicated history — keeps the most recent scan per product.
   */
  readonly uniqueHistory = computed(() => {
    const items = this.historyItems();
    const seen = new Set<string>();

    return items
      .slice() // Avoid mutating the original signal
      .sort((a, b) =>
        new Date(b.analysis.analyzed_at).getTime() -
        new Date(a.analysis.analyzed_at).getTime()
      )
      .filter(item => {
        const barcode = (item.product as any).barcode;
        if (!barcode) return true; // Keep if no barcode
        if (seen.has(barcode)) return false;
        seen.add(barcode);
        return true;
      });
  });

  constructor() {
    // React to profile changes (e.g., when Guest registration completes or user switches demo)
    effect(() => {
      const id = this.userService.profile().id;
      if (id) {
        this.loadHistory();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Initial load will be handled by the effect once ID is ready
  }

  /**
   * Load user scan history from backend
   */
  private loadHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Use dynamic user ID from profile
    const userId = this.userService.profile().id || 1;

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
   * Generate and download a PDF report of the scan history.
   * Uses jsPDF + jspdf-autotable — loaded dynamically to keep the initial bundle small.
   *
   * Improvements:
   *   1. Deduplicates rows by barcode (keeps the most recent scan per product).
   *   2. Re-evaluates each product against current profile allergies.
   *   3. Colors Nutri-Score A–E and Veredicto column dynamically.
   */
  async downloadPdf(): Promise<void> {
    const items = this.historyItems();
    if (items.length === 0) return;

    this.isGeneratingPdf.set(true);

    try {
      // Dynamic imports — zero bundle cost at startup
      const jsPDFModule = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const { jsPDF } = jsPDFModule;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const profile = this.userService.profile();
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      // ── 1. Deduplicate by barcode — keep the MOST RECENT scan per product ──
      const seenBarcodes = new Set<string>();
      const uniqueItems = items
        .slice()   // avoid mutating the signal array
        .sort((a, b) =>
          new Date(b.analysis.analyzed_at).getTime() -
          new Date(a.analysis.analyzed_at).getTime()
        )
        .filter(item => {
          const key = (item.product as any).barcode ?? item.product.name ?? '';
          if (seenBarcodes.has(key)) return false;
          seenBarcodes.add(key);
          return true;
        });

      // ── 2. Dynamic allergy cross-check ────────────────────────────────────
      // Normalise profile allergies to lowercase tokens for string-matching.
      const profileAllergies: string[] = (profile.allergies ?? [])
        .map((a: string) => a.toLowerCase().trim());

      const evaluateVerdict = (item: ProductCardData): string => {
        if (profileAllergies.length > 0) {
          // allergens_tags (array) or allergens (string) from OFF enriched data
          const allergenSource =
            (item.product as any).allergens_tags ??
            (item.product as any).allergens ??
            '';
          const rawText = Array.isArray(allergenSource)
            ? allergenSource.join(' ')
            : String(allergenSource);
          const normalised = rawText.toLowerCase();

          const triggered = profileAllergies.find(a => normalised.includes(a));
          if (triggered) return `⚠ No Apto (${triggered})`;
        }
        return item.analysis.is_suitable ? '✔ Apto' : '✘ No Apto';
      };

      // ── Header band ───────────────────────────────────────────────────────
      doc.setFillColor(34, 197, 94);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Informe Nutricional \u2014 FoodScan AI', 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el ${dateStr} a las ${timeStr}`, 14, 20);
      doc.text('foodscan-ai.vercel.app', 196, 20, { align: 'right' });

      // ── User profile section ──────────────────────────────────────────────
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Perfil del Usuario', 14, 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const allergiesText = profileAllergies.length
        ? profileAllergies.join(', ')
        : 'Ninguna';
      doc.text(`Dieta: ${profile.diet ?? 'omn\u00edvoro'}`, 14, 46);
      doc.text(`Alergias: ${allergiesText}`, 14, 53);
      doc.text(
        `Productos \u00fanicos: ${uniqueItems.length}` +
        (items.length !== uniqueItems.length
          ? ` (de ${items.length} escaneos totales)`
          : ''),
        14, 60,
      );

      // ── Divider ───────────────────────────────────────────────────────────
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 64, 196, 64);

      // ── Data table ────────────────────────────────────────────────────────
      const rows = uniqueItems.map(item => ([
        new Date(item.analysis.analyzed_at).toLocaleDateString('es-ES'),
        item.product.name ?? '\u2014',
        item.product.brand ?? '\u2014',
        (item.product.nutri_score ?? '?').toUpperCase(),
        evaluateVerdict(item),
      ]));

      // Nutri-Score A→E official colour palette
      const NS_COLORS: Record<string, [number, number, number]> = {
        A: [26, 115, 55],
        B: [86, 160, 45],
        C: [232, 177, 13],
        D: [224, 116, 22],
        E: [224, 36, 27],
      };

      autoTable(doc, {
        startY: 68,
        head: [['Fecha', 'Producto', 'Marca', 'Nutri-Score', 'Veredicto']],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 24, halign: 'center' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 32, halign: 'center' },
        },
        alternateRowStyles: { fillColor: [245, 250, 247] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: (data: import('jspdf-autotable').CellHookData) => {
          if (data.section !== 'body') return;

          // Nutri-Score column (col 3) — A=green → E=red
          if (data.column.index === 3) {
            const score = String(data.cell.raw).toUpperCase();
            if (NS_COLORS[score]) {
              data.cell.styles.textColor = NS_COLORS[score];
              data.cell.styles.fontStyle = 'bold';
            }
          }

          // Veredicto column (col 4) — three tones
          if (data.column.index === 4) {
            const raw = String(data.cell.raw);
            if (raw.startsWith('\u26a0')) {
              // Allergy override → amber
              data.cell.styles.textColor = [180, 80, 0];
            } else if (raw.startsWith('\u2714')) {
              // Suitable → green
              data.cell.styles.textColor = [22, 163, 74];
            } else {
              // Not suitable → red
              data.cell.styles.textColor = [220, 38, 38];
            }
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // ── Footer: page numbers + disclaimer ────────────────────────────────
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(
          'Nota: Los veredictos reflejan el an\u00e1lisis en la fecha de escaneo. ' +
          'Las filas con \u26a0 han sido re-evaluadas seg\u00fan el perfil actual.',
          105, 285,
          { align: 'center', maxWidth: 180 }
        );

        doc.setFontSize(8);
        doc.text(
          `P\u00e1gina ${i} de ${pageCount} \u2014 FoodScan AI \u00a9 ${now.getFullYear()}`,
          105, 291,
          { align: 'center' }
        );
      }

      // ── Save ──────────────────────────────────────────────────────────────
      const fileName = `FoodScan_Informe_${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error('[PDF] Error generating report:', err);
    } finally {
      this.isGeneratingPdf.set(false);
    }
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
