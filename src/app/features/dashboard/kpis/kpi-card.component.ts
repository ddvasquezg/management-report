import { Component, input, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="kpi-card" [class.kpi-accent]="accent()">
      <div class="kpi-icon">{{ icon() }}</div>
      <div class="kpi-body">
        <div class="kpi-label">{{ label() }}</div>
        <div class="kpi-value" [class]="valueClass()" #valueEl>{{ displayValue() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: rgba(10, 14, 26, 0.70);
      border: 1px solid rgba(24, 119, 196, 0.18);
      border-radius: 10px;
      padding: 18px 20px;
      display: flex; align-items: center; gap: 16px;
      backdrop-filter: blur(16px);
      transition: border-color 0.17s ease, box-shadow 0.17s ease, transform 0.17s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .kpi-card:hover {
      border-color: rgba(24, 119, 196, 0.48);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(24,119,196,0.14);
      transform: translateY(-1px);
    }
    .kpi-card.kpi-accent {
      border-color: rgba(24, 119, 196, 0.35);
      background: rgba(24, 119, 196, 0.13);
    }
    .kpi-icon   { font-size: 1.35rem; flex-shrink: 0; }
    .kpi-body   { display: flex; flex-direction: column; gap: 2px; }
    .kpi-label  { font-size: 0.68rem; color: #7B9AB8; text-transform: uppercase; letter-spacing: 0.07em; }
    .kpi-value  { font-family: 'Reddit Sans', sans-serif; font-weight: 800; font-size: 1.6rem; color: #EDF2FB; line-height: 1.1; letter-spacing: -0.02em; }
    .kpi-value.positive { color: #00C97A; }
    .kpi-value.neutral  { color: #F5A52A; }
    .kpi-value.negative { color: #E8394A; }
  `]
})
export class KpiCardComponent implements OnChanges {
  icon       = input<string>('📊');
  label      = input<string>('');
  value      = input<number | null>(null);
  accent     = input<boolean>(false);
  decimals   = input<number>(0);
  suffix     = input<string>('');
  colorize   = input<boolean>(false);

  displayValue = input<string>('—');
  valueClass   = input<string>('kpi-value');

  // Computed via OnChanges for animation
  ngOnChanges(_: SimpleChanges): void {}
}
