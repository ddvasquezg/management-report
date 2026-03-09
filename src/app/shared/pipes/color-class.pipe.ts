import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'colorClass', standalone: true })
export class ColorClassPipe implements PipeTransform {
  transform(pct: number | null): string {
    if (pct === null) return '';
    return pct >= 40 ? 'positive' : pct >= 20 ? 'neutral' : 'negative';
  }
}
