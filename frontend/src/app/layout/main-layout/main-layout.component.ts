import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
    /** Navigation menu items */
    readonly menuItems = [
        {
            path: '/scan',
            icon: 'fa-camera',
            label: 'Escáner',
        },
        {
            path: '/history',
            icon: 'fa-clock-rotate-left',
            label: 'Historial',
        },
        {
            path: '/stats',
            icon: 'fa-chart-pie',
            label: 'Estadísticas',
        },
        {
            path: '/meal-plan',
            icon: 'fa-utensils',
            label: 'Plan Semanal',
        },
        {
            path: '/profile',
            icon: 'fa-user',
            label: 'Perfil',
        },
    ];
}
