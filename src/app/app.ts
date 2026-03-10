import { Component, inject } from '@angular/core';
import { HeaderComponent } from './layout/header/header.component';
import { UploadComponent } from './features/upload/upload.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay.component';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';
import { ReportStoreService } from './core/services/report-store.service';
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
      const isFormatError = e instanceof Error &&
        /CFB|ZIP|parse|Invalid/i.test(e.message);
      this.store.setError(
        isFormatError
          ? 'Formato no válido. Use un archivo .xlsx, .xls o .csv.'
          : `Error al leer "${file.name}". Verifique que el archivo no esté dañado.`
      );
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
      const isNetwork = e instanceof TypeError;
      this.store.setError(
        isNetwork
          ? 'No se pudo conectar. Verifique su conexión a internet.'
          : 'No se pudo cargar el archivo de ejemplo.'
      );
      console.error(e);
    } finally {
      this.store.setLoading(false);
    }
  }

  onFilterChange(value: boolean): void {
    this.store.setFilterIa(value);
  }
}
