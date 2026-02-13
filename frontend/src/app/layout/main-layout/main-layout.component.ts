import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RecommendationsWidgetComponent } from '../../features/recommendations/recommendations-widget.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RecommendationsWidgetComponent],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
    /** Navigation menu items */
    readonly menuItems = [
        {
            path: '/scanner',
            icon: 'fa-camera',
            label: 'Escáner',
        },
        {
            path: '/history',
            icon: 'fa-clock-rotate-left',
            label: 'Historial',
        },
        {
            path: '/profile',
            icon: 'fa-user',
            label: 'Perfil',
        },
    ];
}
