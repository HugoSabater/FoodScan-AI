import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { UserService, UserStats } from '../../core/services/user.service';
import { ScanService, HistoryScan } from '../../core/services/scan.service';

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
    private userService = inject(UserService);
    private scanService = inject(ScanService);

    loading = signal<boolean>(true);
    error = signal<string | null>(null);
    stats = signal<UserStats | null>(null);
    history = signal<HistoryScan[]>([]);
    activeFilter = signal<'all' | 'apt' | 'not-apt' | 'A' | 'B' | 'C' | 'D' | 'E' | null>(null);

    /** Filtered history based on active card */
    filteredHistory = computed(() => {
        const filter = this.activeFilter();
        const fullHistory = this.history();

        if (!filter || filter === 'all') return fullHistory;

        return fullHistory.filter(item => {
            const analysis = item.analysis_result;
            const healthScore = analysis?.custom_health_score ?? 0;

            if (filter === 'apt') return healthScore >= 50;
            if (filter === 'not-apt') return healthScore < 50;

            // NutriScore filtering
            if (['A', 'B', 'C', 'D', 'E'].includes(filter)) {
                return item.product?.nutri_score?.toUpperCase() === filter;
            }

            return true;
        });
    });

    // Doughnut Chart (Suitable vs Unsuitable)
    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Resumen de tu Dieta' }
        }
    };
    public doughnutChartType: ChartType = 'doughnut';
    public doughnutChartData: ChartData<'doughnut'> = {
        labels: ['Aptos', 'No Aptos', 'Desconocido'],
        datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#4ade80', '#ef4444', '#9ca3af'],
            hoverBackgroundColor: ['#22c55e', '#dc2626', '#6b7280'],
            hoverBorderColor: ['#22c55e', '#dc2626', '#6b7280']
        }]
    };

    // Bar Chart (NutriScore Distribution)
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        scales: {
            x: {},
            y: { min: 0, ticks: { stepSize: 1 } }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Calidad Nutricional (NutriScore)' }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: ['A', 'B', 'C', 'D', 'E'],
        datasets: [{
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
                '#166534', // A - Dark Green
                '#22c55e', // B - Green
                '#eab308', // C - Yellow
                '#f97316', // D - Orange
                '#dc2626'  // E - Red
            ]
        }]
    };

    ngOnInit(): void {
        this.loadStats();
    }

    /** Explicit chart click handler for ng2-charts */
    onChartClick(event: any, chartType: 'donut' | 'bar') {
        if (event.active && event.active.length > 0) {
            const index = event.active[0].index;
            if (chartType === 'donut') {
                this.activeFilter.set(index === 0 ? 'apt' : 'not-apt');
            } else if (chartType === 'bar') {
                const scores: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
                this.activeFilter.set(scores[index]);
            }
        }
    }

    loadStats(): void {
        this.loading.set(true);
        // TODO: Get real userId from auth service. Hardcoded to 1 for MVP.
        const userId = 1;

        this.userService.getStats(userId).subscribe({
            next: (data) => {
                this.stats.set(data);
                this.updateCharts(data);
                this.loadHistory(userId);
            },
            error: (err) => {
                console.error('Error loading stats:', err);
                this.error.set('No se pudieron cargar las estadísticas.');
                this.loading.set(false);
            }
        });
    }

    loadHistory(userId: number): void {
        this.scanService.getHistory(userId).subscribe({
            next: (res) => {
                this.history.set(res.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading history:', err);
                // Keep stats but maybe show a subset error?
                // For now just finish loading
                this.loading.set(false);
            }
        });
    }

    updateCharts(data: UserStats): void {
        // Update Doughnut
        this.doughnutChartData = {
            ...this.doughnutChartData,
            datasets: [{
                ...this.doughnutChartData.datasets[0],
                data: [
                    data.suitability.suitable,
                    data.suitability.unsuitable,
                    data.suitability.unknown
                ]
            }]
        };

        // Update Bar
        this.barChartData = {
            ...this.barChartData,
            datasets: [{
                ...this.barChartData.datasets[0],
                data: [
                    data.nutriScoreDistribution.a,
                    data.nutriScoreDistribution.b,
                    data.nutriScoreDistribution.c,
                    data.nutriScoreDistribution.d,
                    data.nutriScoreDistribution.e
                ]
            }]
        };
    }
}
