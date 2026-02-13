import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

import { ScanService } from '../../core/services/scan.service';
import { ProductCardComponent, ProductCardData } from '../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../shared/components/product-detail-modal/product-detail-modal.component';

@Component({
    selector: 'app-scanner',
    standalone: true,
    imports: [CommonModule, FormsModule, ZXingScannerModule, ProductCardComponent, ProductDetailModalComponent],
    templateUrl: './scanner.component.html',
    styleUrl: './scanner.component.scss',
})
export class ScannerComponent {

    // ── Scanner Config ────────────────────────
    readonly allowedFormats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
    ];

    /** Controls whether the ZXing scanner is active */
    readonly scannerEnabled = signal(true);

    /** Camera permission status */
    readonly cameraPermission = signal<'granted' | 'denied' | 'pending'>('pending');

    /** Status message shown in the overlay */
    readonly statusMessage = signal('Buscando productos...');

    // ── Dev Simulation ────────────────────────
    readonly DEMO_BARCODES = [
        { label: 'Nutella', code: '80135463' },
        { label: 'Coca-Cola Zero', code: '5449000131805' },
    ];

    /** Modal state */
    readonly showModal = signal(false);
    readonly modalData = signal<ProductCardData | null>(null);

    /** Manual barcode input */
    readonly manualBarcode = signal('');

    constructor(public readonly scanService: ScanService) { }

    // ── Event Handlers ────────────────────────

    /**
     * Called when a barcode is successfully scanned
     */
    onScanSuccess(barcode: string): void {
        // Pause the scanner to avoid multiple requests
        this.scannerEnabled.set(false);
        this.statusMessage.set(`Código detectado: ${barcode}`);

        // Call the backend
        this.scanService.scanProduct(barcode);
    }

    /**
     * Handle camera permission changes
     */
    onCamerasFound(devices: MediaDeviceInfo[]): void {
        if (devices.length > 0) {
            this.cameraPermission.set('granted');
        }
    }

    /**
     * Handle camera permission denied
     */
    onPermissionResponse(hasPermission: boolean): void {
        this.cameraPermission.set(hasPermission ? 'granted' : 'denied');
    }

    /**
     * Simulate a scan for development (no camera needed)
     */
    simulateScan(barcode: string): void {
        this.scannerEnabled.set(false);
        this.statusMessage.set(`Simulando: ${barcode}`);
        this.scanService.scanProduct(barcode);
    }

    /**
     * Search using manually entered barcode
     */
    searchManualBarcode(): void {
        const barcode = this.manualBarcode().trim();
        if (!barcode) return;

        // Use the same logic as camera scan
        this.scannerEnabled.set(false);
        this.statusMessage.set(`Buscando: ${barcode}`);
        this.scanService.scanProduct(barcode);

        // Clear input after search
        this.manualBarcode.set('');
    }

    /**
     * Reset scanner to scan again
     */
    resetScanner(): void {
        this.scanService.reset();
        this.scannerEnabled.set(true);
        this.statusMessage.set('Buscando productos...');
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
