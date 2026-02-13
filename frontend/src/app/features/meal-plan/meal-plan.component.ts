import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-meal-plan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="c-meal-plan">
      <header class="c-meal-plan__header">
        <h2 class="c-meal-plan__title">
          <i class="fa-solid fa-utensils"></i>
          Plan de Comidas de Hoy
        </h2>
        <button class="c-btn c-btn--outline" 
                (click)="regenerate()" 
                [disabled]="userService.loadingMealPlan()">
          <i class="fa-solid fa-rotate-right" [class.fa-spin]="userService.loadingMealPlan()"></i>
          {{ userService.loadingMealPlan() ? 'Generando...' : 'Regenerar Plan' }}
        </button>
      </header>

      @if (userService.mealPlanError()) {
        <div class="c-meal-plan__error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>{{ userService.mealPlanError() }}</p>
          <button class="c-btn c-btn--primary" (click)="regenerate()">Intentar de nuevo</button>
        </div>
      }

      @if (userService.loadingMealPlan() && userService.mealPlan().length === 0) {
        <div class="c-meal-plan__loading">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <p>La IA está diseñando tu menú personalizado...</p>
        </div>
      }

      @if (userService.mealPlan().length > 0) {
        <div class="c-meal-plan__grid" [class.is-loading]="userService.loadingMealPlan()">
          @for (meal of userService.mealPlan(); track meal.type) {
            <article class="c-meal-card">
              <header class="c-meal-card__header">
                <div class="c-meal-card__icon" [ngClass]="getIconClass(meal.type)">
                    <i [class]="getIcon(meal.type)"></i>
                </div>
                <div class="c-meal-card__meta">
                    <h3 class="c-meal-card__type">{{ meal.type }}</h3>
                    <span class="c-meal-card__calories">{{ meal.calories }} kcal</span>
                </div>
              </header>
              
              <div class="c-meal-card__body">
                <h4 class="c-meal-card__name">{{ meal.name }}</h4>
                
                <div class="c-meal-card__ingredients">
                  @for (ing of meal.ingredients; track ing) {
                    <span class="c-chip">{{ ing }}</span>
                  }
                </div>

                <div class="c-meal-card__insight">
                  <i class="fa-solid fa-check"></i>
                  <p>{{ meal.reason }}</p>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../styles/utilities/variables' as *;
    @use '../../../styles/utilities/mixins' as *;

    .c-meal-plan {
      padding: $spacing-lg;
      max-width: 1200px;
      margin: 0 auto;

      // ── Header ────────────────────────────────
      &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $spacing-xl;
        flex-wrap: wrap;
        gap: $spacing-md;

        @include media-down(sm) {
            flex-direction: column;
            align-items: flex-start;
        }
      }

      &__title {
        font-size: $font-size-2xl;
        font-weight: $font-weight-bold;
        color: $color-text;
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i { color: $color-primary; }
      }

      // ── States ────────────────────────────────
      &__loading, &__error {
        @include card;
        padding: $spacing-2xl;
        text-align: center;
        color: $color-text-light;
        
        i { font-size: 2.5rem; margin-bottom: $spacing-md; display: block; color: $color-primary-light; }
      }
      
      &__error {
        color: $color-danger;
        i { color: $color-danger; }
        button { margin-top: $spacing-md; }
      }

      // ── Grid ──────────────────────────────────
      &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        transition: opacity 0.3s;
        
        &.is-loading { opacity: 0.6; pointer-events: none; }
      }
    }

    // ── Meal Card Component ─────────────────────
    .c-meal-card {
      @include card(0); // Reset padding from mixin
      display: flex;
      flex-direction: column;
      border: 1px solid transparent;
      transition: transform $transition-base, box-shadow $transition-base;
      overflow: hidden;

      &:hover {
        transform: translateY(-5px);
        box-shadow: $shadow-card-hover;
      }

      // ── Card Header ───────────────────────────
      &__header {
        padding: $spacing-lg;
        display: flex;
        align-items: center;
        gap: $spacing-md;
        border-bottom: 1px solid $color-border-light;
      }

      &__icon {
        width: 48px;
        height: 48px;
        border-radius: $radius-full;
        @include flex-center;
        font-size: 1.5rem;
        flex-shrink: 0;

        &--breakfast { background: hsla(35, 95%, 55%, 0.15); color: hsl(35, 95%, 45%); }
        &--lunch { background: hsla(145, 63%, 42%, 0.15); color: $color-primary; }
        &--dinner { background: hsla(250, 60%, 60%, 0.15); color: hsl(250, 60%, 50%); }
      }

      &__meta {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &__type {
        font-size: $font-size-sm;
        font-weight: $font-weight-bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: $color-text-light;
        margin: 0;
      }

      &__calories {
        background: hsla(220, 20%, 50%, 0.1);
        color: $color-text;
        font-size: $font-size-xs;
        font-weight: $font-weight-bold;
        padding: 4px 12px;
        border-radius: 999px;
      }

      // ── Card Body ─────────────────────────────
      &__body {
        padding: $spacing-lg;
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
        flex: 1;
      }

      &__name {
        font-size: 1.25rem;
        font-weight: $font-weight-bold;
        color: $color-text;
        margin: 0;
        line-height: $line-height-tight;
      }

      &__ingredients {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-xs;
      }

      // ── AI Insight ────────────────────────────
      &__insight {
        margin-top: auto;
        padding: $spacing-md;
        background: hsla(145, 63%, 42%, 0.08);
        border-radius: $radius-md;
        border-left: 3px solid $color-primary;
        display: flex;
        gap: $spacing-sm;
        font-size: $font-size-sm;
        line-height: $line-height-base;
        color: hsla(220, 20%, 20%, 0.9);
        
        i { 
            color: $color-primary; 
            margin-top: 3px; 
            flex-shrink: 0;
        }
        p { margin: 0; }
      }
    }

    // ── Chips ──────────────────────────────────
    .c-chip {
        display: inline-flex;
        padding: 4px 10px;
        background: $color-bg;
        color: $color-text-light;
        font-size: $font-size-xs;
        border-radius: $radius-md;
        font-weight: $font-weight-medium;
    }

    // ── Buttons ────────────────────────────────
    .c-btn {
        @include button-base;
        
        &--primary {
            @include button-primary;
        }

        &--outline {
            @include button-secondary;
            border-color: $color-border;
            
            &:hover:not(:disabled) {
                border-color: $color-primary;
                color: $color-primary;
                background: hsla(145, 63%, 42%, 0.05);
            }
        }
    }
  `]
})
export class MealPlanComponent implements OnInit {
  userService = inject(UserService);

  ngOnInit() {
    if (this.userService.mealPlan().length === 0) {
      this.userService.generateMealPlan();
    }
  }

  regenerate() {
    this.userService.generateMealPlan();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'Desayuno': return 'fa-solid fa-sun';
      case 'Comida': return 'fa-solid fa-cloud-sun';
      case 'Cena': return 'fa-solid fa-moon';
      default: return 'fa-solid fa-utensils';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'Desayuno': return 'c-meal-card__icon--breakfast';
      case 'Comida': return 'c-meal-card__icon--lunch';
      case 'Cena': return 'c-meal-card__icon--dinner';
      default: return '';
    }
  }
}
