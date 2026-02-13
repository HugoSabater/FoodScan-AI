import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-logo',
    standalone: true,
    imports: [CommonModule],
    template: `
    <svg 
      [attr.width]="size()" 
      [attr.height]="size()" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      class="c-logo"
    >
      <!-- Leaf shape -->
      <path 
        d="M50 10 C30 10, 15 25, 15 45 C15 65, 30 80, 50 90 C70 80, 85 65, 85 45 C85 25, 70 10, 50 10 Z" 
        [attr.fill]="color()"
        opacity="0.9"
      />
      
      <!-- Leaf vein (center) -->
      <line 
        x1="50" y1="15" 
        x2="50" y2="85" 
        [attr.stroke]="accentColor()"
        stroke-width="2" 
        stroke-linecap="round"
      />
      
      <!-- Leaf veins (left side) -->
      <line x1="50" y1="30" x2="30" y2="40" [attr.stroke]="accentColor()" stroke-width="1.5" opacity="0.7"/>
      <line x1="50" y1="45" x2="25" y2="55" [attr.stroke]="accentColor()" stroke-width="1.5" opacity="0.7"/>
      <line x1="50" y1="60" x2="30" y2="70" [attr.stroke]="accentColor()" stroke-width="1.5" opacity="0.7"/>
      
      <!-- Leaf veins (right side) -->
      <line x1="50" y1="30" x2="70" y2="40" [attr.stroke]="accentColor()" stroke-width="1.5" opacity="0.7"/>
      <line x1="50" y1="45" x2="75" y2="55" [attr.stroke]="accentColor()" stroke-width="1.5" opacity="0.7"/>
      <line x1="50" y1="60" x2="70" y2="70" [attr.stroke]="accentColor()" stroke-width="1.5" opacity="0.7"/>
      
      <!-- Scan lines effect -->
      @if (showScanLines()) {
        <g class="c-logo__scan-lines">
          <line x1="10" y1="25" x2="90" y2="25" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
          <line x1="10" y1="50" x2="90" y2="50" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
          <line x1="10" y1="75" x2="90" y2="75" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
        </g>
      }
    </svg>
  `,
    styles: [`
    .c-logo {
      display: block;
      transition: transform 0.3s ease;
      
      &:hover {
        transform: scale(1.05);
      }
    }

    .c-logo__scan-lines {
      animation: scan 2s ease-in-out infinite;
    }

    @keyframes scan {
      0%, 100% {
        opacity: 0.3;
        transform: translateY(0);
      }
      50% {
        opacity: 0.8;
        transform: translateY(5px);
      }
    }
  `]
})
export class LogoComponent {
    /** Size of the logo in pixels */
    size = input<number>(48);

    /** Main color of the leaf */
    color = input<string>('hsl(145, 63%, 42%)'); // Primary green

    /** Accent color for veins */
    accentColor = input<string>('hsl(145, 63%, 30%)'); // Darker green

    /** Show animated scan lines */
    showScanLines = input<boolean>(true);
}
