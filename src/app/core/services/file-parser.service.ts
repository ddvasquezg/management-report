import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { RawRow } from '../models/report-row.model';

const PREFERRED_SHEET = 'Medicion';

@Injectable({ providedIn: 'root' })
export class FileParserService {

  async parseFile(file: File): Promise<RawRow[]> {
    const buffer = await file.arrayBuffer();
    return this.parseBuffer(buffer);
  }

  parseBuffer(buffer: ArrayBuffer): RawRow[] {
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buffer, { type: 'array' });
    } catch {
      const text = new TextDecoder().decode(buffer);
      wb = XLSX.read(text, { type: 'string' });
    }
    return XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[this.resolveSheet(wb)], { defval: null });
  }

  async parseUrl(url: string): Promise<RawRow[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    return XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[this.resolveSheet(wb)], { defval: null });
  }

  private resolveSheet(wb: XLSX.WorkBook): string {
    const match = wb.SheetNames.find(
      name => name.trim().toLowerCase() === PREFERRED_SHEET.toLowerCase()
    );
    return match ?? wb.SheetNames[0];
  }
}
