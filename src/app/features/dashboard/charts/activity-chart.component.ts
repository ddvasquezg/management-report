import {
  Component, input, OnChanges, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, OnDestroy,
  inject, effect, computed
} from '@angular/core';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { ActivityAggregate } from '../../../core/models/aggregates.model';
import { ThemeService } from '../../../core/services/theme.service';

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

@Component({
  selector: 'app-activity-chart',
  standalone: true,
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3>Indice por Actividad</h3>
        <span class="summary-tag">{{ summaryText() }}</span>
      </div>
      <div class="chart-wrap" [style.height.px]="chartHeight()">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styleUrl: './chart-panel.scss',
})
export class ActivityChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  data = input<ActivityAggregate[]>([]);
  summaryText = input<string>('');

  chartHeight = computed(() => Math.max(220, this.data().length * 34));

  private chart?: Chart;
  private theme = inject(ThemeService);

  constructor() {
    effect(() => {
      this.theme.isDark();
      if (this.canvasRef) this.buildChart();
    });
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.canvasRef) {
      this.buildChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private buildChart(): void {
    if (!this.canvasRef) return;
    const items = this.data();
    const labels = items.map(a => a.activity);
    const values = items.map(a => a.avg !== null ? a.avg * 100 : 0);
    const colors = items.map(a => this.chartColor(a.avg !== null ? a.avg * 100 : null));
    const dark = this.theme.isDark();
    const gridColor = dark ? 'rgba(122,155,181,0.07)' : 'rgba(30,80,180,0.07)';
    const tickColor = dark ? '#7a9bb5' : '#4a6a90';
    const bounds = this.computeBounds(values);

    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Indice %', data: values,
          backgroundColor: colors, borderRadius: 5, borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${(ctx.parsed.x as number).toFixed(1)}%`,
              title: items => items.length ? labels[items[0].dataIndex] : '',
              afterLabel: ctx => {
                const count = items[ctx.dataIndex]?.softerCount ?? 0;
                return `Softers considerados: ${count}`;
              },
            },
          },
        },
        scales: {
          x: {
            min: bounds.min,
            max: bounds.max,
            grid: { color: gridColor },
            ticks: { color: tickColor, callback: v => v + '%' },
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: tickColor },
          },
        },
      },
    });
  }

  private computeBounds(values: number[]): { min: number; max: number } {
    if (!values.length) return { min: 0, max: 100 };
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);
    const min = Math.floor(rawMin / 10) * 10;
    let max = Math.ceil(rawMax / 10) * 10;
    if (min === max) max = min + 10;
    return { min, max };
  }

  private chartColor(pct: number | null): string {
    if (pct === null) return this.theme.isDark() ? 'rgba(35, 75, 140, 0.4)' : 'rgba(59, 130, 200, 0.2)';
    return pct >= 40 ? 'rgba(0, 210, 132, 0.65)' : pct >= 20 ? 'rgba(255, 167, 51, 0.65)' : 'rgba(255, 77, 94, 0.65)';
  }
}
