import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { UserService, UserStats } from '../../core/services/user.service';

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
    private userService = inject(UserService);

    loading = signal<boolean>(true);
    error = signal<string | null>(null);
    stats = signal<UserStats | null>(null);

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

    loadStats(): void {
        this.loading.set(true);
        // TODO: Get real userId from auth service. Hardcoded to 1 for MVP.
        const userId = 1;

        this.userService.getStats(userId).subscribe({
            next: (data) => {
                this.stats.set(data);
                this.updateCharts(data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading stats:', err);
                this.error.set('No se pudieron cargar las estadísticas.');
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
