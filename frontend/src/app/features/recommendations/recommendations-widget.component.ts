import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
    selector: 'app-recommendations-widget',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <aside class="c-recommendations">
            <h3 class="c-recommendations__title">
                <i class="fa-solid fa-utensils"></i>
                Tu Menú de Hoy
            </h3>

            @if (featuredMeal()) {
                <div class="c-recommendations__card">
                    <div class="c-recommendations__header">
                        <span class="c-recommendations__icon">{{ getIcon(featuredMeal()!.type) }}</span>
                        <div class="c-recommendations__info">
                            <span class="c-recommendations__type">{{ featuredMeal()!.type }}</span>
                            <span class="c-recommendations__name">{{ featuredMeal()!.name }}</span>
                        </div>
                    </div>
                    <div class="c-recommendations__calories">
                        {{ featuredMeal()!.calories }} kcal
                    </div>
                </div>
            } @else {
                <div class="c-recommendations__empty">
                    <i class="fa-solid fa-carrot"></i>
                    <p>Descubre tu plan personalizado</p>
                </div>
            }

            <a routerLink="/meal-plan" class="c-recommendations__link">
                {{ featuredMeal() ? 'Ver Plan Completo' : 'Generar Plan' }}
                <i class="fa-solid fa-arrow-right"></i>
            </a>
        </aside>
    `,
    styles: [`
        @use '../../../styles/utilities/variables' as *;
        @use '../../../styles/utilities/mixins' as *;

        .c-recommendations {
            @include card;
            padding: $spacing-md;
            background: linear-gradient(135deg, hsla(145, 90%, 50%, 0.02) 0%, hsla(145, 90%, 50%, 0.05) 100%);
            border: 2px solid $color-border;
            display: flex;
            flex-direction: column;
            gap: $spacing-md;

            &__title {
                display: flex;
                align-items: center;
                gap: $spacing-xs;
                font-size: $font-size-sm;
                font-weight: $font-weight-semibold;
                color: $color-text;
                margin: 0;

                i { color: $color-accent; }
            }

            &__card {
                background: $color-bg;
                border-radius: $radius-md;
                padding: $spacing-sm;
                border: 1px solid $color-border;
            }

            &__header {
                display: flex;
                gap: $spacing-sm;
                margin-bottom: $spacing-xs;
            }

            &__icon { font-size: 1.5rem; }

            &__info {
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            &__type {
                font-size: $font-size-xs;
                color: $color-text-light;
                text-transform: uppercase;
                font-weight: $font-weight-bold;
            }

            &__name {
                font-size: $font-size-sm;
                font-weight: $font-weight-medium;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            &__calories {
                font-size: $font-size-xs;
                color: $color-success;
                font-weight: $font-weight-bold;
                text-align: right;
            }

            &__empty {
                text-align: center;
                color: $color-text-light;
                font-size: $font-size-sm;
                padding: $spacing-sm;
                
                i { font-size: 1.5rem; margin-bottom: $spacing-xs; display: block; }
                p { margin: 0; }
            }

            &__link {
                @include button-text;
                justify-content: center;
                width: 100%;
                font-size: $font-size-xs;
                gap: $spacing-xs;
            }
        }
    `]
})
export class RecommendationsWidgetComponent {
    userService = inject(UserService);

    readonly featuredMeal = computed(() => {
        const plan = this.userService.mealPlan();
        if (plan.length === 0) return null;
        // Return Lunch (index 1) or Breakfast (index 0)
        return plan.find(m => m.type === 'Comida') || plan[0];
    });

    getIcon(type: string): string {
        switch (type) {
            case 'Desayuno': return '☀️';
            case 'Comida': return '🌤️';
            case 'Cena': return '🌙';
            default: return '🍽️';
        }
    }
}
