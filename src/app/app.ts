import { Component, inject } from '@angular/core';
import { HeaderComponent } from './layout/header/header.component';
import { UploadComponent } from './features/upload/upload.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay.component';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';
import { ReportStoreService } from './core/services/report-store.service';
import { ExportService } from './core/services/export.service';
import { FileParserService } from './core/services/file-parser.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    UploadComponent,
    DashboardComponent,
    LoadingOverlayComponent,
    ErrorToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private store      = inject(ReportStoreService);
  private exporter   = inject(ExportService);
  private fileParser = inject(FileParserService);

  isLoading = this.store.isLoading;
  errorMsg  = this.store.errorMsg;
  filterIa  = this.store.filterIa;
  hasData   = this.store.hasData;

  private readonly SAMPLE_URL = 'assets/sample-data/report-sample.csv';

  async onFileSelected(file: File): Promise<void> {
    this.store.setLoading(true);
    try {
      const [rows, improvements] = await Promise.all([
        this.fileParser.parseFile(file),
        this.fileParser.parseImprovementsFromFile(file),
      ]);
      this.store.setRawRows(rows);
      this.store.setProcessImprovements(improvements);
    } catch (e) {
      this.store.setError('Error al leer el archivo.');
      console.error(e);
    } finally {
      this.store.setLoading(false);
    }
  }

  async onLoadSample(): Promise<void> {
    await this.loadFromSample();
  }

  private async loadFromSample(): Promise<void> {
    this.store.setLoading(true);
    try {
      const [rows, improvements] = await Promise.all([
        this.fileParser.parseUrl(this.SAMPLE_URL),
        this.fileParser.parseImprovementsFromUrl(this.SAMPLE_URL),
      ]);
      this.store.setRawRows(rows);
      this.store.setProcessImprovements(improvements);
    } catch (e) {
      this.store.setError('No se pudo cargar el archivo de ejemplo.');
      console.error(e);
    } finally {
      this.store.setLoading(false);
    }
  }

  onFilterChange(value: boolean): void {
    this.store.setFilterIa(value);
  }

  onExportCsv(): void {
    const rows = this.store.rows();
    if (!rows.length) {
      this.store.setError('No hay datos para exportar.');
      return;
    }
    this.exporter.exportCsv(rows, this.store.aggregates());
  }
}
