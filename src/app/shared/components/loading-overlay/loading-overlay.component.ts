import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    <div class="loading-overlay" [class.active]="isLoading()" aria-hidden="true">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(5, 13, 26, 0.82);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 0.3s;
    }
    .loading-overlay.active { opacity: 1; pointer-events: all; }
    .spinner {
      width: 38px; height: 38px;
      border: 3px solid rgba(40, 120, 220, 0.14);
      border-top-color: #3b96ff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingOverlayComponent {
  isLoading = input<boolean>(false);
}
