import { Component, output, input, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  filterIa     = input<boolean>(false);
  filterChange = output<boolean>();

  theme = inject(ThemeService);

  onFilterChange(event: Event): void {
    this.filterChange.emit((event.target as HTMLInputElement).checked);
  }

  onThemeToggle(): void {
    this.theme.toggle();
  }
}
