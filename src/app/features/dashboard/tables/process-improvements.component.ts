import { Component, computed, input } from '@angular/core';
import { ProcessImprovementRow } from '../../../core/models/report-row.model';

interface ImprovementItemView {
  item: string;
  impact: string | null;
  score: number;
}

@Component({
  selector: 'app-process-improvements',
  standalone: true,
  templateUrl: './process-improvements.component.html',
  styleUrl: './process-improvements.component.scss',
})
export class ProcessImprovementsComponent {
  data = input<ProcessImprovementRow[]>([]);

  items = computed<ImprovementItemView[]>(() => {
    const grouped = new Map<string, ImprovementItemView>();

    for (const row of this.data()) {
      const key = row.item.trim().toLowerCase();
      const currentScore = this.impactScore(row.impact);
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          item: row.item.trim(),
          impact: row.impact,
          score: currentScore,
        });
        continue;
      }

      if (currentScore > current.score) {
        grouped.set(key, {
          item: row.item.trim(),
          impact: row.impact,
          score: currentScore,
        });
      }
    }

    return [...grouped.values()].sort((a, b) => b.score - a.score || a.item.localeCompare(b.item));
  });

  impactLabel(impact: string | null): string {
    if (!impact) return 'Por definir';
    return impact;
  }

  itemClass(impact: string | null): string {
    const score = this.impactScore(impact);
    if (score >= 3) return 'is-high';
    if (score === 2) return 'is-medium';
    return 'is-low';
  }

  private impactScore(impact: string | null): number {
    if (!impact) return 1;
    const normalized = impact.toLowerCase();
    if (normalized.includes('alta')) return 3;
    if (normalized.includes('media')) return 2;
    return 1;
  }
}
