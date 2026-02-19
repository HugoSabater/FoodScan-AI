import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', redirectTo: 'scan', pathMatch: 'full' },
            {
                path: 'scan',
                loadComponent: () => import('./features/scanner/scanner.component').then(m => m.ScannerComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'history',
                loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent)
            },
            {
                path: 'meal-plan',
                loadComponent: () => import('./features/meal-plan/meal-plan.component').then(m => m.MealPlanComponent)
            },
            {
                path: 'stats',
                loadComponent: () => import('./features/stats/stats.component').then(m => m.StatsComponent)
            }
        ]
    },
    { path: '**', redirectTo: '' } // Redirigir cualquier 404 al inicio
];