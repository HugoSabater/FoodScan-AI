import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';

/**
 * Product data returned from the backend
 */
export interface ProductData {
    id: number;
    barcode: string;
    name: string;
    brand: string;
    nutri_score: string;
    image_url: string;
    ingredients_text: string;
    source: string;
}

/**
 * AI analysis result
 */
export interface AnalysisData {
    is_suitable: boolean;
    analysis_reason: string;
    custom_health_score: number;
    ai_model: string;
    analyzed_at: string;
    diet?: string;
    allergies?: string;
}

/**
 * Full scan response from the backend
 */
export interface ScanResponse {
    success: boolean;
    message: string;
    data: {
        scan: { id: number; scanned_at: string };
        product: ProductData;
        analysis: AnalysisData;
    };
}

/**
 * Custom profile sent to backend for personalized analysis
 */
export interface CustomProfile {
    dietary_preference: string;
    allergies: string[];
}

@Injectable({ providedIn: 'root' })
export class ScanService {

    // ── State Signals ─────────────────────────
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _currentProduct = signal<ProductData | null>(null);
    private readonly _analysis = signal<AnalysisData | null>(null);

    // ── Public Read-Only Signals ──────────────
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly currentProduct = this._currentProduct.asReadonly();
    readonly analysis = this._analysis.asReadonly();

    /** True when we have a scanned product to display */
    readonly hasResult = computed(() => this._currentProduct() !== null);

    constructor(
        private readonly http: HttpClient,
        private readonly userService: UserService
    ) { }

    /**
     * Scan a product by barcode
     * POST /api/scan with barcode, userId, and customProfile
     */
    scanProduct(barcode: string): void {
        this._loading.set(true);
        this._error.set(null);
        this._currentProduct.set(null);
        this._analysis.set(null);

        // Get current user profile
        const profile = this.userService.profile();

        // Build custom profile for backend
        const customProfile: CustomProfile = {
            dietary_preference: profile.diet,
            allergies: profile.allergies,
        };

        this.http
            .post<ScanResponse>('/api/scan', {
                barcode,
                userId: profile.id || 1, // Use dynamic ID, fallback to 1 if not yet sync'd
                customProfile, // Send user preferences
            })
            .subscribe({
                next: (res) => {
                    this._currentProduct.set(res.data.product);
                    this._analysis.set(res.data.analysis);
                    this._loading.set(false);
                },
                error: (err) => {
                    console.error('ScanService error:', err);
                    this._error.set(
                        err.error?.message || 'Error al escanear el producto'
                    );
                    this._loading.set(false);
                },
            });
    }

    /**
     * Reset state to initial values
     */
    reset(): void {
        this._loading.set(false);
        this._error.set(null);
        this._currentProduct.set(null);
        this._analysis.set(null);
    }

    /**
     * Get trending products for Quick Scan
     * @returns Observable of trending products
     */
    getTrending() {
        return this.http.get<TrendingResponse>('/api/products/trending');
    }

    /**
     * Get user scan history
     * @param userId User ID to fetch history for
     * @returns Observable of scan history items
     */
    getHistory(userId: number) {
        return this.http.get<HistoryResponse>(`/api/users/${userId}/history`);
    }
}

/**
 * Trending product from OpenFoodFacts
 */
export interface TrendingProduct {
    barcode: string;
    name: string;
    brand: string;
    image_url: string | null;
}

export interface TrendingResponse {
    success: boolean;
    count: number;
    data: TrendingProduct[];
}

/**
 * Backend response for scan history
 */
export interface HistoryScan {
    id: number;
    user_id: number;
    product_id: number;
    scanned_at: string;
    product: ProductData;
    analysis_result?: AnalysisData;
}

export interface HistoryResponse {
    success: boolean;
    count: number;
    data: HistoryScan[];
}
