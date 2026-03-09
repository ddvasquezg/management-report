import { Component, input, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportRow } from '../../../core/models/report-row.model';
import { ReportStoreService } from '../../../core/services/report-store.service';

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel panel-narrow">
      <div class="panel-header"><h3>Softers</h3></div>
      @if (selectedCount() > 0) {
        <button class="clear-filter-btn" (click)="clearSelection()">
          Limpiar ({{ selectedCount() }})
        </button>
      }
      <div class="search-wrap">
        <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Buscar..."
          [(ngModel)]="query"
          autocomplete="off"
        />
        @if (query) {
          <button class="search-clear" (click)="query = ''" aria-label="Limpiar búsqueda">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        }
      </div>
      <div class="collab-list">
        @for (name of filtered(); track name; let i = $index) {
          <button
            type="button"
            class="collab-item"
            [class.is-selected]="isSelected(name)"
            [style.animation-delay]="i * 30 + 'ms'"
            (click)="toggleSelection(name)"
          >
            <span class="collab-avatar">{{ name.charAt(0).toUpperCase() }}</span>
            <span class="collab-name">{{ name }}</span>
          </button>
        }
        @if (filtered().length === 0) {
          <p class="no-results">Sin resultados</p>
        }
      </div>
    </div>
  `,
  styleUrl: './collaborators.component.scss',
})
export class CollaboratorsComponent {
  rows = input<ReportRow[]>([]);
  query = '';
  private store = inject(ReportStoreService);

  selectedCount = computed(() => this.store.selectedSofters().size);

  names(): string[] {
    return [...new Set(this.rows().filter(r => r.nombre).map(r => r.nombre as string))].sort();
  }

  filtered(): string[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.names().filter(n => n.toLowerCase().includes(q)) : this.names();
  }

  toggleSelection(name: string): void {
    this.store.toggleSofterSelection(name);
  }

  clearSelection(): void {
    this.store.clearSofterSelection();
  }

  isSelected(name: string): boolean {
    return this.store.isSofterSelected(name);
  }
}
