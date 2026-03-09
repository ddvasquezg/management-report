import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { RawRow, ProcessImprovementRow } from '../models/report-row.model';

const PREFERRED_SHEET = 'Medicion';
const IMPROVEMENTS_SHEET = 'Mejoras_Proceso';

@Injectable({ providedIn: 'root' })
export class FileParserService {

  private readWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
    try {
      return XLSX.read(buffer, { type: 'array' });
    } catch {
      const text = new TextDecoder().decode(buffer);
      return XLSX.read(text, { type: 'string' });
    }
  }

  private findSheetByName(wb: XLSX.WorkBook, wanted: string): string | null {
    const match = wb.SheetNames.find(name => name.trim().toLowerCase() === wanted.toLowerCase());
    return match ?? null;
  }

  private parseImprovementRowsFromSheet(wb: XLSX.WorkBook, sheetName: string | null): ProcessImprovementRow[] {
    if (!sheetName) return [];
    const rows = XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[sheetName], { defval: null });

    return rows
      .map(r => {
        const get = (...keys: string[]): string | null => {
          for (const key of keys) {
            const raw = r[key] ?? r[key.toLowerCase()] ?? r[key.toUpperCase()];
            if (raw === null || raw === undefined) continue;
            const text = String(raw).trim();
            if (text) return text;
          }
          return null;
        };

        return {
          item: get('item a mejorar', 'item_a_mejorar', 'Item a mejorar') ?? '',
          description: get('Descripción breve', 'Descripcion breve', 'descripcion breve'),
          problemType: get('Tipo de problema', 'tipo de problema'),
          impact: get('Impacto', 'impacto'),
          responsible: get('Responsable', 'responsable'),
        };
      })
      .filter(x => x.item.length > 0);
  }

  async parseFile(file: File): Promise<RawRow[]> {
    const buffer = await file.arrayBuffer();
    return this.parseBuffer(buffer);
  }

  async parseImprovementsFromFile(file: File): Promise<ProcessImprovementRow[]> {
    const buffer = await file.arrayBuffer();
    const wb = this.readWorkbook(buffer);
    const sheet = this.findSheetByName(wb, IMPROVEMENTS_SHEET);
    return this.parseImprovementRowsFromSheet(wb, sheet);
  }

  parseBuffer(buffer: ArrayBuffer): RawRow[] {
    const wb = this.readWorkbook(buffer);
    return XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[this.resolveSheet(wb)], { defval: null });
  }

  async parseUrl(url: string): Promise<RawRow[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    return XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[this.resolveSheet(wb)], { defval: null });
  }

  async parseImprovementsFromUrl(url: string): Promise<ProcessImprovementRow[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    const sheet = this.findSheetByName(wb, IMPROVEMENTS_SHEET);
    return this.parseImprovementRowsFromSheet(wb, sheet);
  }

  private resolveSheet(wb: XLSX.WorkBook): string {
    const match = wb.SheetNames.find(
      name => name.trim().toLowerCase() === PREFERRED_SHEET.toLowerCase()
    );
    return match ?? wb.SheetNames[0];
  }
}
