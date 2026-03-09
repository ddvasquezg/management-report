import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  template: `
    <div class="error-toast" [class.visible]="!!message()" role="alert">
      {{ message() }}
    </div>
  `,
  styles: [`
    .error-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      background: #ff4d5e; color: #fff;
      padding: 10px 18px; border-radius: 10px;
      font-size: 0.875rem; font-weight: 500;
      transform: translateY(16px); opacity: 0;
      transition: transform 0.3s, opacity 0.3s;
      pointer-events: none;
    }
    .error-toast.visible { transform: translateY(0); opacity: 1; pointer-events: auto; }
  `]
})
export class ErrorToastComponent {
  message = input<string | null>(null);
}
