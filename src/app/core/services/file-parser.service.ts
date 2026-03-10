import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { RawRow, ProcessImprovementRow } from '../models/report-row.model';

const PREFERRED_SHEET = 'Medicion';
const IMPROVEMENTS_SHEET = 'Mejoras_Proceso';

@Injectable({ providedIn: 'root' })
export class FileParserService {

  /**
   * Lee un archivo Excel desde un ArrayBuffer.
   * Si falla el parseo binario, intenta decodificar como texto.
   * Retorna el objeto WorkBook de XLSX.
   */
  private readWorkbook(buffer: ArrayBuffer): XLSX.WorkBook {
    try {
      return XLSX.read(buffer, { type: 'array' });
    } catch {
      const text = new TextDecoder().decode(buffer);
      return XLSX.read(text, { type: 'string' });
    }
  }

  /**
   * Busca una hoja por nombre en el WorkBook, ignorando mayúsculas/minúsculas y espacios.
   * Retorna el nombre exacto de la hoja si existe, o null.
   */
  private findSheetByName(wb: XLSX.WorkBook, wanted: string): string | null {
    const match = wb.SheetNames.find(name => name.trim().toLowerCase() === wanted.toLowerCase());
    return match ?? null;
  }

  /**
   * Parsea las filas de mejoras de proceso desde una hoja específica.
   * Utiliza variantes de nombre de columna para extraer los campos.
   * Retorna un array tipado de ProcessImprovementRow.
   */
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

  /**
   * Parsea un archivo Excel o CSV a filas crudas.
   * Retorna un array de RawRow.
   */
  async parseFile(file: File): Promise<RawRow[]> {
    const buffer = await file.arrayBuffer();
    return this.parseBuffer(buffer);
  }

  /**
   * Parsea las mejoras de proceso desde un archivo Excel o CSV.
   * Retorna un array de ProcessImprovementRow.
   */
  async parseImprovementsFromFile(file: File): Promise<ProcessImprovementRow[]> {
    const buffer = await file.arrayBuffer();
    const wb = this.readWorkbook(buffer);
    const sheet = this.findSheetByName(wb, IMPROVEMENTS_SHEET);
    return this.parseImprovementRowsFromSheet(wb, sheet);
  }

  /**
   * Parsea un ArrayBuffer a filas crudas usando XLSX.
   * Retorna un array de RawRow.
   */
  parseBuffer(buffer: ArrayBuffer): RawRow[] {
    const wb = this.readWorkbook(buffer);
    return XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[this.resolveSheet(wb)], { defval: null });
  }

  /**
   * Parsea un archivo remoto (URL) a filas crudas.
   * Retorna un array de RawRow.
   */
  async parseUrl(url: string): Promise<RawRow[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    return XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[this.resolveSheet(wb)], { defval: null });
  }

  /**
   * Parsea las mejoras de proceso desde un archivo remoto (URL).
   * Retorna un array de ProcessImprovementRow.
   */
  async parseImprovementsFromUrl(url: string): Promise<ProcessImprovementRow[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const wb = XLSX.read(text, { type: 'string' });
    const sheet = this.findSheetByName(wb, IMPROVEMENTS_SHEET);
    return this.parseImprovementRowsFromSheet(wb, sheet);
  }

  /**
   * Resuelve el nombre de la hoja preferida en el WorkBook.
   * Si no existe, retorna la primera hoja disponible.
   */
  private resolveSheet(wb: XLSX.WorkBook): string {
    const match = wb.SheetNames.find(
      name => name.trim().toLowerCase() === PREFERRED_SHEET.toLowerCase()
    );
    return match ?? wb.SheetNames[0];
  }
}
