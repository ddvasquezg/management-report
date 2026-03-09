import {
  Component, input, OnChanges, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, OnDestroy,
  inject, effect, computed
} from '@angular/core';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { LeaderAggregate } from '../../../core/models/aggregates.model';
import { ThemeService } from '../../../core/services/theme.service';

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

@Component({
  selector: 'app-leader-chart',
  standalone: true,
  template: `
    <div class="panel">
      <div class="panel-header">
        <h3>Índice por Líder</h3>
        <span class="summary-tag">{{ summaryText() }}</span>
      </div>
      <div class="chart-wrap" [style.height.px]="chartHeight()">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styleUrl: './chart-panel.scss',
})
export class LeaderChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  data = input<LeaderAggregate[]>([]);
  summaryText = input<string>('');

  chartHeight = computed(() => Math.max(210, this.data().length * 38));

  private chart?: Chart;
  private theme = inject(ThemeService);

  constructor() {
    effect(() => {
      this.theme.isDark(); // react to theme changes
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
    const labels = items.map(l => l.lider.split(' ')[0]);
    const values = items.map(l => l.avg !== null ? l.avg * 100 : 0);
    const colors = items.map(l => this.chartColor(l.avg !== null ? l.avg * 100 : null));
    const dark = this.theme.isDark();
    const gridColor = dark ? 'rgba(122,155,181,0.07)' : 'rgba(30,80,180,0.07)';
    const tickColor = dark ? '#7a9bb5' : '#4a6a90';

    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Índice %', data: values,
          backgroundColor: colors, borderRadius: 5, borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${(ctx.parsed.x as number).toFixed(1)}%` } },
        },
        scales: {
          x: {
            beginAtZero: true, max: 100,
            grid: { color: gridColor },
            ticks: { color: tickColor, callback: v => v + '%' },
          },
          y: { grid: { color: gridColor }, ticks: { color: tickColor } },
        },
      },
    });
  }

  private chartColor(pct: number | null): string {
    if (pct === null) return this.theme.isDark() ? 'rgba(35, 75, 140, 0.4)' : 'rgba(59, 130, 200, 0.2)';
    return pct >= 40 ? 'rgba(0, 210, 132, 0.65)' : pct >= 20 ? 'rgba(255, 167, 51, 0.65)' : 'rgba(255, 77, 94, 0.65)';
  }
}
