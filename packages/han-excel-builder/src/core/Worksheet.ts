/**
 * Worksheet - Representa una hoja de cálculo dentro del builder
 * Adaptado para usar tipos compartidos de han-documents-core
 */

import * as ExcelJS from 'exceljs';
import { Result, success, error, ErrorType as CoreErrorType } from '@hannndler/core';
import {
  IWorksheet,
  IWorksheetConfig,
  ITable,
  IWorksheetImage,
  IExcelTable,
  IPivotTable,
  ISlicer,
  IWatermark,
  IDataConnection
} from '../types/worksheet.types';
import {
  IDataCell,
  IHeaderCell,
  IFooterCell,
  ICellRange,
  IRichTextRun
} from '../types/cell.types';
import { IBuildOptions } from '../types/builder.types';
import { ErrorType } from '../types/compat.types';
import { CellType, IDataValidation } from '../types/core.types';
import { IConditionalFormat } from '../types/style.types';

/**
 * Worksheet - Representa una hoja de cálculo dentro del builder
 *
2 * Soporta headers, subheaders anidados, rows, footers, children y estilos por celda.
 */
export class Worksheet implements IWorksheet {
  public config: IWorksheetConfig;
  public tables: ITable[] = [];
  public currentRow = 1;
  public currentCol = 1;
  public headerPointers: Map<string, any> = new Map();
  public isBuilt = false;

  // Estructuras temporales para la tabla actual
  private headers: IHeaderCell[] = [];
  private subHeaders: IHeaderCell[] = [];
  private body: IDataCell[] = [];
  private footers: IFooterCell[] = [];
  
  // Features adicionales
  private images: IWorksheetImage[] = [];
  private rowGroups: Array<{ start: number; end: number; collapsed?: boolean }> = [];
  private columnGroups: Array<{ start: number; end: number; collapsed?: boolean }> = [];
  private namedRanges: Array<{ name: string; range: string; scope?: string }> = [];
  private excelTables: IExcelTable[] = [];
  private hiddenRows: Set<number> = new Set();
  private hiddenColumns: Set<number> = new Set();
  private pivotTables: IPivotTable[] = [];
  private slicers: ISlicer[] = [];
  private watermarks: IWatermark[] = [];
  private dataConnections: IDataConnection[] = [];
  
  // Estilos y tema del workbook (no se guardan en el objeto de ExcelJS)
  private customStyles?: Record<string, import('../types/style.types').IStyle>;
  private theme?: import('../types/builder.types').IWorkbookTheme;

  constructor(config: IWorksheetConfig) {
    this.config = config;
  }

  /**
   * Agrega un header principal
   */
  addHeader(header: IHeaderCell): this {
    this.headers.push(header);
    return this;
  }

  /**
   * Agrega subheaders (ahora soporta anidación)
   */
  addSubHeaders(subHeaders: IHeaderCell[]): this {
    this.subHeaders.push(...subHeaders);
    return this;
  }

  /**
   * Agrega una fila de datos (puede ser jerárquica con childrens)
   */
  addRow(row: IDataCell[] | IDataCell): this {
    if (Array.isArray(row)) {
      this.body.push(...row);
    } else {
      this.body.push(row);
    }
    return this;
  }

  /**
   * Agrega un footer o varios
   */
  addFooter(footer: IFooterCell[] | IFooterCell): this {
    if (Array.isArray(footer)) {
      this.footers.push(...footer);
    } else {
      this.footers.push(footer);
    }
    return this;
  }

  /**
   * Crea una nueva tabla y la agrega al worksheet
   */
  addTable(tableConfig: Partial<ITable> = {}): this {
    const table: ITable = {
      name: tableConfig.name || `Table_${this.tables.length + 1}`,
      headers: tableConfig.headers || [],
      subHeaders: tableConfig.subHeaders || [],
      body: tableConfig.body || [],
      footers: tableConfig.footers || [],
      showBorders: tableConfig.showBorders !== false,
      showStripes: tableConfig.showStripes !== false,
      style: tableConfig.style || 'TableStyleLight1',
      ...tableConfig
    };
    
    this.tables.push(table);
    return this;
  }

  /**
   * Finaliza la tabla actual agregando todos los elementos temporales a la última tabla
   */
  finalizeTable(): this {
    if (this.tables.length === 0) {
      // Si no hay tablas, crear una nueva con los datos temporales
      this.addTable();
    }
    
    const currentTable = this.tables[this.tables.length - 1];
    if (!currentTable) {
      throw new Error('No se pudo obtener la tabla actual');
    }
    
    // Agregar headers, subheaders, body y footers a la tabla actual
    if (this.headers.length > 0) {
      currentTable.headers = [...(currentTable.headers || []), ...this.headers];
    }
    
    if (this.subHeaders.length > 0) {
      currentTable.subHeaders = [...(currentTable.subHeaders || []), ...this.subHeaders];
    }
    
    if (this.body.length > 0) {
      currentTable.body = [...(currentTable.body || []), ...this.body];
    }
    
    if (this.footers.length > 0) {
      currentTable.footers = [...(currentTable.footers || []), ...this.footers];
    }
    
    // Limpiar las estructuras temporales
    this.headers = [];
    this.subHeaders = [];
    this.body = [];
    this.footers = [];
    
    return this;
  }

  /**
   * Obtiene una tabla por nombre
   */
  getTable(name: string): ITable | undefined {
    return this.tables.find(table => table.name === name);
  }

  /**
   * Agrega una imagen al worksheet
   */
  addImage(image: IWorksheetImage): this {
    this.images.push(image);
    return this;
  }

  /**
   * Agrupa filas (crea esquema colapsable)
   */
  groupRows(startRow: number, endRow: number, collapsed: boolean = false): this {
    this.rowGroups.push({ start: startRow, end: endRow, collapsed });
    return this;
  }

  /**
   * Agrupa columnas (crea esquema colapsable)
   */
  groupColumns(startCol: number, endCol: number, collapsed: boolean = false): this {
    this.columnGroups.push({ start: startCol, end: endCol, collapsed });
    return this;
  }

  /**
   * Agrega un rango con nombre
   */
  addNamedRange(name: string, range: string | ICellRange, scope?: string): this {
    let rangeString: string;
    
    if (typeof range === 'string') {
      rangeString = range;
    } else {
      // Convertir ICellRange a string (e.g., "A1:B10")
      const startRef = range.start.reference || `${this.numberToColumnLetter(range.start.col)}${range.start.row}`;
      const endRef = range.end.reference || `${this.numberToColumnLetter(range.end.col)}${range.end.row}`;
      rangeString = `${startRef}:${endRef}`;
    }
    
    const namedRange: { name: string; range: string; scope?: string } = { name, range: rangeString };
    if (scope !== undefined) {
      namedRange.scope = scope;
    }
    this.namedRanges.push(namedRange);
    return this;
  }

  /**
   * Agrega una tabla estructurada de Excel
   */
  addExcelTable(table: IExcelTable): this {
    this.excelTables.push(table);
    return this;
  }

  /**
   * Oculta filas
   */
  hideRows(rows: number | number[]): this {
    const rowsArray = Array.isArray(rows) ? rows : [rows];
    rowsArray.forEach(row => this.hiddenRows.add(row));
    return this;
  }

  /**
   * Muestra filas
   */
  showRows(rows: number | number[]): this {
    const rowsArray = Array.isArray(rows) ? rows : [rows];
    rowsArray.forEach(row => this.hiddenRows.delete(row));
    return this;
  }

  /**
   * Oculta columnas
   */
  hideColumns(columns: number | string | (number | string)[]): this {
    const columnsArray = Array.isArray(columns) ? columns : [columns];
    columnsArray.forEach(col => {
      const colNum = typeof col === 'string' ? this.columnLetterToNumber(col) : col;
      this.hiddenColumns.add(colNum);
    });
    return this;
  }

  /**
   * Muestra columnas
   */
  showColumns(columns: number | string | (number | string)[]): this {
    const columnsArray = Array.isArray(columns) ? columns : [columns];
    columnsArray.forEach(col => {
      const colNum = typeof col === 'string' ? this.columnLetterToNumber(col) : col;
      this.hiddenColumns.delete(colNum);
    });
    return this;
  }

  /**
   * Agrega una tabla dinámica (pivot table)
   */
  addPivotTable(pivotTable: IPivotTable): this {
    this.pivotTables.push(pivotTable);
    return this;
  }

  /**
   * Agrega un slicer a una tabla o tabla dinámica
   */
  addSlicer(slicer: ISlicer): this {
    this.slicers.push(slicer);
    return this;
  }

  /**
   * Agrega una marca de agua al worksheet
   */
  addWatermark(watermark: IWatermark): this {
    this.watermarks.push(watermark);
    return this;
  }

  /**
   * Agrega una conexión de datos
   */
  addDataConnection(connection: IDataConnection): this {
    this.dataConnections.push(connection);
    return this;
  }

  /**
   * Construye la hoja en el workbook de ExcelJS
   */
  async build(workbook: ExcelJS.Workbook, _options: IBuildOptions = {}): Promise<void> {
    const ws = workbook.addWorksheet(this.config.name, {
      properties: {
        defaultRowHeight: this.config.defaultRowHeight || 20,
        tabColor: this.config.tabColor as any
      },
      pageSetup: this.config.pageSetup as any
    });

    // Guardar estilos predefinidos y tema en la instancia de Worksheet (no en el objeto de ExcelJS)
    this.customStyles = (workbook as any).__customStyles;
    this.theme = (workbook as any).__theme;

    let rowPointer = 1;
    
    // Si hay tablas definidas, construir cada tabla
    if (this.tables.length > 0) {
      let tableStartRow = rowPointer;
      for (let i = 0; i < this.tables.length; i++) {
        const table = this.tables[i];
        if (table) {
          tableStartRow = rowPointer;
          rowPointer = await this.buildTable(ws, table, rowPointer, i > 0);
          
          // Aplicar filtro automático a la tabla si está configurado
          if (table.autoFilter && rowPointer > tableStartRow) {
            this.applyAutoFilter(ws, table, tableStartRow, rowPointer - 1);
          }
        }
      }
    } else {
      // Construcción tradicional para compatibilidad hacia atrás
      rowPointer = await this.buildLegacyContent(ws, rowPointer);
    }
    
    // Aplicar filtro automático a nivel de worksheet si está configurado
    if (this.config.autoFilter?.enabled) {
      this.applyWorksheetAutoFilter(ws, rowPointer);
    }
    
    // Aplicar views (freeze panes, split panes, sheet views)
    this.applyViews(ws);
    
    // Aplicar protección si está configurada
    if (this.config.protected) {
      ws.protect(this.config.protectionPassword || '', {
        selectLockedCells: false,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });
    }
    
    // Aplicar imágenes
    for (const image of this.images) {
      await this.applyImage(ws, image);
    }
    
    // Aplicar agrupación de filas
    for (const group of this.rowGroups) {
      this.applyRowGrouping(ws, group.start, group.end, group.collapsed);
    }
    
    // Aplicar agrupación de columnas
    for (const group of this.columnGroups) {
      this.applyColumnGrouping(ws, group.start, group.end, group.collapsed);
    }
    
    // Aplicar rangos con nombre
    for (const namedRange of this.namedRanges) {
      // ExcelJS addDefinedName - solo acepta name y range (scope se maneja de otra manera)
      workbook.definedNames.add(namedRange.name, namedRange.range);
    }
    
    // Aplicar tablas estructuradas de Excel
    for (const excelTable of this.excelTables) {
      this.applyExcelTable(ws, excelTable);
    }
    
    // Aplicar configuración de impresión avanzada
    this.applyAdvancedPrintSettings(ws);
    
    // Aplicar filas y columnas ocultas
    this.applyHiddenRowsColumns(ws);
    
    // Aplicar tablas dinámicas
    for (const pivotTable of this.pivotTables) {
      await this.applyPivotTable(ws, pivotTable);
    }
    
    // Aplicar slicers
    for (const slicer of this.slicers) {
      await this.applySlicer(ws, slicer);
    }
    
    // Aplicar marcas de agua
    for (const watermark of this.watermarks) {
      await this.applyWatermark(ws, watermark);
    }
    
    // Aplicar conexiones de datos
    for (const connection of this.dataConnections) {
      await this.applyDataConnection(workbook, connection);
    }
    
    this.isBuilt = true;
  }

  /**
   * Construye una tabla individual en el worksheet
   */
  private async buildTable(ws: ExcelJS.Worksheet, table: ITable, startRow: number, addSpacing: boolean = false): Promise<number> {
    let rowPointer = startRow;
    
    // Agregar espacio entre tablas si no es la primera
    if (addSpacing) {
      rowPointer += 2; // 2 filas de espacio
    }
    
    // Headers principales de la tabla
    if (table.headers && table.headers.length > 0) {
      for (const header of table.headers) {
        const cell = ws.getRow(rowPointer).getCell(1);
        
        // Aplicar rich text si existe
        if ((header as any).richText && (header as any).richText.length > 0) {
          cell.value = {
            richText: (header as any).richText.map((run: IRichTextRun) => ({
              text: run.text,
              font: run.font ? { name: run.font } : undefined,
              size: run.size,
                  color: run.color ? this.convertColorToExcelJS(run.color) : undefined,
              bold: run.bold,
              italic: run.italic,
              underline: run.underline,
              strike: run.strikethrough
            })).filter((run: any) => run.text !== undefined)
          } as any;
        } else {
          cell.value = this.processCellValue(header);
        }
        
        if (header.mergeCell) {
          const maxCols = this.calculateTableMaxColumns(table);
          ws.mergeCells(rowPointer, 1, rowPointer, maxCols);
        }
        if (header.styles) {
          ws.getRow(rowPointer).eachCell((cell: any) => {
            cell.style = this.convertStyle(header.styles);
          });
        }
        
        // Aplicar protección de celda si existe
        if ((header as any).cellProtection) {
          cell.protection = {
            locked: (header as any).cellProtection.locked ?? true,
            hidden: (header as any).cellProtection.hidden ?? false
          };
        } else if (header.protected !== undefined) {
          cell.protection = {
            locked: header.protected,
            hidden: false
          };
        }
        
        // Aplicar dimensiones de celda
        this.applyCellDimensions(ws, rowPointer, 1, header);
        // Aplicar comentario si existe
        if (header.comment) {
          this.applyCellComment(ws, rowPointer, 1, header.comment);
        }
        // Aplicar validación de datos si existe
        if (header.validation) {
          this.applyDataValidation(ws, rowPointer, 1, header.validation);
        }
        // Aplicar formato condicional si existe
        if (header.styles?.conditionalFormats) {
          this.applyConditionalFormatting(ws, rowPointer, 1, header.styles.conditionalFormats);
        }
        rowPointer++;
      }
    }
    
    // SubHeaders con soporte para anidación
    if (table.subHeaders && table.subHeaders.length > 0) {
      rowPointer = this.buildNestedHeaders(ws, rowPointer, table.subHeaders);
    }
    
    // Body (soporta children)
    if (table.body && table.body.length > 0) {
      for (let i = 0; i < table.body.length; i++) {
          const row = table.body[i];
          rowPointer = this.addDataRowRecursive(ws, rowPointer, row, table.body, i, table.subHeaders);
        }
    }
    
    // Footers
    if (table.footers && table.footers.length > 0) {
      for (const footer of table.footers) {
        rowPointer = this.addFooterRow(ws, rowPointer, footer, table.subHeaders);
      }
    }
    
    // Aplicar estilo de tabla si está configurado
    if (table.showBorders || table.showStripes) {
      this.applyTableStyle(ws, table, startRow, rowPointer - 1);
    }
    
    // Nota: El filtro automático se aplica en el método build() después de construir todas las tablas
    // para tener el rowPointer final correcto
    
    return rowPointer;
  }

  /**
   * Construcción tradicional para compatibilidad hacia atrás
   */
  private async buildLegacyContent(ws: ExcelJS.Worksheet, startRow: number): Promise<number> {
    let rowPointer = startRow;
    
    // Headers principales
    if (this.headers.length > 0) {
      this.headers.forEach(header => {
        ws.addRow([this.processCellValue(header)]);
        if (header.mergeCell) {
          ws.mergeCells(rowPointer, 1, rowPointer, (this.getMaxColumns() || 1));
        }
        if (header.styles) {
          ws.getRow(rowPointer).eachCell((cell: any) => {
            cell.style = this.convertStyle(header.styles);
          });
        }
        // Aplicar dimensiones de celda
        this.applyCellDimensions(ws, rowPointer, 1, header);
        // Aplicar comentario si existe
        if (header.comment) {
          this.applyCellComment(ws, rowPointer, 1, header.comment);
        }
        // Aplicar validación de datos si existe
        if (header.validation) {
          this.applyDataValidation(ws, rowPointer, 1, header.validation);
        }
        // Aplicar formato condicional si existe
        if (header.styles?.conditionalFormats) {
          this.applyConditionalFormatting(ws, rowPointer, 1, header.styles.conditionalFormats);
        }
        rowPointer++;
      });
    }
    
    // SubHeaders con soporte para anidación
    if (this.subHeaders.length > 0) {
      rowPointer = this.buildNestedHeaders(ws, rowPointer, this.subHeaders);
    }
    
    // Body (soporta children)
    for (let i = 0; i < this.body.length; i++) {
      const row = this.body[i];
      rowPointer = this.addDataRowRecursive(ws, rowPointer, row, this.body, i, this.subHeaders);
    }
    
    // Footers
    if (this.footers.length > 0) {
      for (const footer of this.footers) {
        rowPointer = this.addFooterRow(ws, rowPointer, footer, this.subHeaders);
      }
    }
    
    return rowPointer;
  }

  /**
   * Calcula el número máximo de columnas para una tabla
   */
  private calculateTableMaxColumns(table: ITable): number {
    let maxCols = 0;
    
    if (table.subHeaders && table.subHeaders.length > 0) {
      for (const header of table.subHeaders) {
        maxCols += this.calculateHeaderColSpan(header);
      }
    }
    
    return maxCols || 1;
  }

  /**
   * Aplica el estilo de tabla a un rango específico
   */
  private applyTableStyle(ws: ExcelJS.Worksheet, table: ITable, startRow: number, endRow: number): void {
    const maxCols = this.calculateTableMaxColumns(table);
    
    // Aplicar bordes si está configurado
    if (table.showBorders) {
      for (let row = startRow; row <= endRow; row++) {
        for (let col = 1; col <= maxCols; col++) {
          const cell = ws.getRow(row).getCell(col);
          if (!cell.style) cell.style = {};
          if (!cell.style.border) {
            cell.style.border = {
              top: { style: 'thin', color: { argb: 'FF8EAADB' } },
              left: { style: 'thin', color: { argb: 'FF8EAADB' } },
              bottom: { style: 'thin', color: { argb: 'FF8EAADB' } },
              right: { style: 'thin', color: { argb: 'FF8EAADB' } }
            };
          }
        }
      }
    }
    
    // Aplicar rayas alternadas si está configurado
    if (table.showStripes) {
      for (let row = startRow; row <= endRow; row++) {
        if ((row - startRow) % 2 === 1) { // Filas impares (empezando desde 0)
          for (let col = 1; col <= maxCols; col++) {
            const cell = ws.getRow(row).getCell(col);
            if (!cell.style) cell.style = {};
            if (!cell.style.fill) {
              cell.style.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' }
              };
            }
          }
        }
      }
    }
  }

  /**
   * Construye headers anidados recursivamente
   * @param ws - Worksheet de ExcelJS
   * @param startRow - Fila inicial
   * @param headers - Array de headers a procesar
   * @returns La siguiente fila disponible
   */
    private buildNestedHeaders(ws: ExcelJS.Worksheet, startRow: number, headers: IHeaderCell[]): number {
    let currentRow = startRow;
    const maxDepth = this.getMaxHeaderDepth(headers);
    
    // Crear filas para cada nivel de profundidad
    for (let depth = 0; depth < maxDepth; depth++) {
      // Crear la fila primero
      const row = ws.getRow(currentRow);
      
      // Procesar cada header en este nivel
      let colIndex = 1;
      for (const header of headers) {
        if (depth === 0) {
          // Nivel principal del header
          const headerInfo = this.getHeaderAtDepth(header, depth, colIndex);
          const cell = row.getCell(colIndex);
          cell.value = this.processCellValue(header);
          if (headerInfo.style) {
            cell.style = this.convertStyle(headerInfo.style);
          }
          // Aplicar dimensiones de celda
          this.applyCellDimensions(ws, currentRow, colIndex, header);
          // Aplicar comentario si existe
          if (header.comment) {
            this.applyCellComment(ws, currentRow, colIndex, header.comment);
          }
          // Aplicar validación de datos si existe
          if (header.validation) {
            this.applyDataValidation(ws, currentRow, colIndex, header.validation);
          }
          // Aplicar formato condicional si existe
          if (header.styles?.conditionalFormats) {
            this.applyConditionalFormatting(ws, currentRow, colIndex, header.styles.conditionalFormats);
          }
          colIndex += headerInfo.colSpan;
        } else {
          // Nivel de children - procesar todos los children directos
          if (header.children && header.children.length > 0) {
            for (const child of header.children) {
              const cell = row.getCell(colIndex);
              cell.value = this.processCellValue(child);
              if (child.styles || header.styles) {
                cell.style = this.convertStyle(child.styles || header.styles);
              }
              // Aplicar dimensiones de celda para children
              this.applyCellDimensions(ws, currentRow, colIndex, child);
              // Aplicar comentario si existe
              if (child.comment) {
                this.applyCellComment(ws, currentRow, colIndex, child.comment);
              }
              // Aplicar validación de datos si existe
              if (child.validation) {
                this.applyDataValidation(ws, currentRow, colIndex, child.validation);
              }
              // Aplicar formato condicional si existe
              if (child.styles?.conditionalFormats) {
                this.applyConditionalFormatting(ws, currentRow, colIndex, child.styles.conditionalFormats);
              }
              colIndex += this.calculateHeaderColSpan(child);
            }
          } else {
            // Si no tiene children, agregar celda vacía
            const cell = row.getCell(colIndex);
            cell.value = null;
            colIndex += 1;
          }
        }
      }
      
      currentRow++;
    }
    
    // Aplicar todos los merges después de crear todas las filas
    this.applyAllMerges(ws, startRow, currentRow - 1, headers);
    
    return currentRow;
  }

  /**
   * Obtiene información del header en una profundidad específica
   */
  private getHeaderAtDepth(header: IHeaderCell, depth: number, startCol: number): {
    value: string | null;
    style: any;
    colSpan: number;
    mergeRange?: { start: number; end: number } | null;
  } {
    const colSpan = this.calculateHeaderColSpan(header);
    if (depth === 0) {
      // Nivel principal del header
      const mergeRange = colSpan > 1 ? { start: startCol, end: startCol + colSpan - 1 } : null;
      return {
        value: typeof header.value === 'string' ? header.value : String(header.value || ''),
        style: header.styles,
        colSpan,
        mergeRange: mergeRange
      };
    } else if (header.children && header.children.length > 0) {
      // Nivel de children
      const child = header.children[depth];
      if (child) {
        const childColSpan = this.calculateHeaderColSpan(child);
        // Los children también pueden hacer merge si tienen múltiples childrens
        const mergeRange = childColSpan > 1 ? { start: startCol, end: startCol + childColSpan - 1 } : null;
        
        return {
          value: typeof child.value === 'string' ? child.value : String(child.value || ''),
          style: child.styles || header.styles,
          colSpan: childColSpan,
          mergeRange: mergeRange
        };
      }
    }
    
    // Celda vacía para mantener alineación
    return {
      value: null,
      style: null,
      colSpan: 1
    };
  }




  /**
   * Aplica todos los merges (horizontales y verticales) después de crear todas las filas
   */
  private applyAllMerges(ws: ExcelJS.Worksheet, startRow: number, endRow: number, headers: IHeaderCell[]): void {
    const maxDepth = this.getMaxHeaderDepth(headers);
    
    // Solo aplicar merges si hay más de una fila de headers
    if (maxDepth <= 1) return;
    
    // Aplicar merges inteligentes basados en la estructura
    this.applySmartMerges(ws, startRow, endRow, headers);
  }

  /**
   * Aplica merges inteligentes basados en la estructura de headers
   */
  private applySmartMerges(ws: ExcelJS.Worksheet, startRow: number, endRow: number, headers: IHeaderCell[]): void {
    const maxDepth = this.getMaxHeaderDepth(headers);
    
    // Solo aplicar merges si hay más de una fila de headers
    if (maxDepth <= 1) return;
    
    // Aplicar merges para cada header
    let colIndex = 1;
    for (const header of headers) {
      this.applySmartMergesForHeader(ws, startRow, endRow, header, colIndex);
      colIndex += this.calculateHeaderColSpan(header);
    }
  }

  /**
   * Aplica merges inteligentes para un header específico
   */
  private applySmartMergesForHeader(ws: ExcelJS.Worksheet, startRow: number, endRow: number, header: IHeaderCell, startCol: number): void {
    const headerColSpan = this.calculateHeaderColSpan(header);
    
    if (!header.children || header.children.length === 0) {
      // Si no tiene children, hacer merge vertical desde la primera fila hasta la última
      ws.mergeCells(startRow, startCol, endRow, startCol + headerColSpan - 1);
    } else {
      // Si tiene children, aplicar merge horizontal en la primera fila
      if (headerColSpan > 1) {
        ws.mergeCells(startRow, startCol, startRow, startCol + headerColSpan - 1);
      }
      
      // Procesar children recursivamente
      let childColIndex = startCol;
      for (const child of header.children) {
        this.applySmartMergesForHeader(ws, startRow + 1, endRow, child, childColIndex);
        childColIndex += this.calculateHeaderColSpan(child);
      }
    }
  }


 
  /**
   * Calcula el span de columnas para un header
   */
  private calculateHeaderColSpan(header: IHeaderCell): number {
    if (!header.children || header.children.length === 0) {
      return 1;
    }
    
    return header.children.reduce((total, child) => {
      return total + this.calculateHeaderColSpan(child);
    }, 0);
  }

  /**
   * Obtiene la profundidad máxima de headers anidados
   */
  private getMaxHeaderDepth(headers: IHeaderCell[]): number {
    let maxDepth = 1;
    
    for (const header of headers) {
      if (header.children && header.children.length > 0) {
        const childDepth = this.getMaxHeaderDepth(header.children);
        maxDepth = Math.max(maxDepth, childDepth + 1);
      }
    }
    
    return maxDepth;
  }

  /**
   * Obtiene el número máximo de columnas
   */
  private getMaxColumns(): number {
    let maxCols = 0;
    
    for (const header of this.subHeaders) {
      maxCols += this.calculateHeaderColSpan(header);
    }
    
    return maxCols;
  }

  /**
   * Valida la hoja
   */
  validate(): Result<boolean> {
    if (this.tables.length === 0 && this.headers.length === 0 && this.body.length === 0) {
      return error(CoreErrorType.VALIDATION_ERROR, 'Worksheet is empty', 'EMPTY_WORKSHEET');
    }
    return success(true);
  }

  /**
   * Calcula las posiciones de columnas para los datos basándose en la estructura de subheaders
   */
  private calculateDataColumnPositions(subHeaders?: IHeaderCell[]): { [key: string]: number } {
    const positions: { [key: string]: number } = {};
    let currentCol = 1;

    const headers = subHeaders && subHeaders.length > 0 ? subHeaders : this.subHeaders;
    for (const header of headers) {
      if (header.children && header.children.length > 0) {
        // Si el header tiene children, cada child ocupa una columna
        for (const child of header.children) {
          if (child.key) {
            positions[child.key] = currentCol;
          }
          if (child.value) {
            positions[String(child.value)] = currentCol;
          }
          currentCol++;
        }
      } else {
        // Si el header no tiene children, ocupa una columna
        if (header.key) {
          positions[header.key] = currentCol;
        }
        if (header.value) {
          positions[String(header.value)] = currentCol;
        }
        currentCol++;
      }
    }
    
    return positions;
  }

  /**
   * Agrega una fila de footer
   * @returns el siguiente rowPointer disponible
   */
  private addFooterRow(ws: ExcelJS.Worksheet, rowPointer: number, footer: IFooterCell, contextSubHeaders?: IHeaderCell[]): number {
    // Calcular las columnas basándose en la estructura de subheaders
    const columnPositions = this.calculateDataColumnPositions(contextSubHeaders);
    
    // Buscar la columna correcta para el footer
    let footerColPosition: number | undefined;
    
    // Intentar encontrar por key primero
    if (footer.key && columnPositions[footer.key]) {
      footerColPosition = columnPositions[footer.key];
    }
    // Si no se encuentra por key, intentar por header
    else if (footer.header && columnPositions[footer.header]) {
      footerColPosition = columnPositions[footer.header];
    }
    
    // Si no se encuentra la posición, usar columna 1 por defecto
    if (footerColPosition === undefined) {
      footerColPosition = 1;
    }
    
    // Escribir el footer en la columna correcta
    const excelRow = ws.getRow(rowPointer);
    const footerCell = excelRow.getCell(footerColPosition);
    footerCell.value = this.processCellValue(footer);
    // Aplicar estilo: primero explícito, luego styleName, luego tema
    if (footer.styles) {
      footerCell.style = this.convertStyle(footer.styles);
    } else if (footer.styleName) {
      const style = this.getPredefinedStyle(footer.styleName);
      if (style) {
        footerCell.style = this.convertStyle(style);
      }
    } else {
      // Aplicar estilo del tema si está disponible y auto-apply está habilitado
      const themeStyle = this.getThemeStyle('footer');
      if (themeStyle) {
        footerCell.style = this.convertStyle(themeStyle);
      }
    }
    if (footer.numberFormat) {
      footerCell.numFmt = footer.numberFormat;
    }
    
    // Aplicar dimensiones de celda
    this.applyCellDimensions(ws, rowPointer, footerColPosition, footer);
    // Aplicar comentario si existe
    if (footer.comment) {
      this.applyCellComment(ws, rowPointer, footerColPosition, footer.comment);
    }
    // Aplicar validación de datos si existe
    if (footer.validation) {
      this.applyDataValidation(ws, rowPointer, footerColPosition, footer.validation);
    }
    // Aplicar formato condicional si existe
    if (footer.styles?.conditionalFormats) {
      this.applyConditionalFormatting(ws, rowPointer, footerColPosition, footer.styles.conditionalFormats);
    }
    
    // Aplicar merge si está configurado
    if (footer.mergeCell && footer.mergeTo) {
      ws.mergeCells(rowPointer, footerColPosition, rowPointer, footer.mergeTo);
    }
    
    // Si hay children, escribirlos en las columnas correspondientes
    if (footer.children && footer.children.length > 0) {
      for (const child of footer.children) {
        if (child) {
          // Buscar la columna correcta basándose en el header del child
          let colPosition: number | undefined;
          
          // Intentar encontrar por key primero
          if (child.key && columnPositions[child.key]) {
            colPosition = columnPositions[child.key];
          }
          // Si no se encuentra por key, intentar por header
          else if (child.header && columnPositions[child.header]) {
            colPosition = columnPositions[child.header];
          }
          
          if (colPosition !== undefined) {
            const childCell = excelRow.getCell(colPosition);
            childCell.value = this.processCellValue(child);
            if (child.styles) {
              childCell.style = this.convertStyle(child.styles);
            }
            if (child.numberFormat) {
              childCell.numFmt = child.numberFormat;
            }
            
            // Aplicar dimensiones de celda para children
            this.applyCellDimensions(ws, rowPointer, colPosition, child);
            // Aplicar comentario si existe
            if (child.comment) {
              this.applyCellComment(ws, rowPointer, colPosition, child.comment);
            }
            // Aplicar validación de datos si existe
            if (child.validation) {
              this.applyDataValidation(ws, rowPointer, colPosition, child.validation);
            }
            // Aplicar formato condicional si existe
            if (child.styles?.conditionalFormats) {
              this.applyConditionalFormatting(ws, rowPointer, colPosition, child.styles.conditionalFormats);
            }
          }
        }
      }
    }
    
    // Incrementar rowPointer solo si el footer tiene la propiedad jump
    if (footer.jump) {
      return rowPointer + 1;
    }
    
    return rowPointer;
  }

  /**
   * Aplica width y height a una celda/fila
   */
  private applyCellDimensions(ws: ExcelJS.Worksheet, row: number, col: number, cell: IDataCell | IHeaderCell | IFooterCell): void {
    // Aplicar rowHeight si está definido
    if (cell.rowHeight !== undefined) {
      const excelRow = ws.getRow(row);
      excelRow.height = cell.rowHeight;
    }
    
    // Aplicar colWidth si está definido
    if (cell.colWidth !== undefined) {
      const excelCol = ws.getColumn(col);
      excelCol.width = cell.colWidth;
    }
  }

  /**
   * Aplica comentario a una celda
   */
  private applyCellComment(ws: ExcelJS.Worksheet, row: number, col: number, comment: string): void {
    if (!comment || comment.trim() === '') {
      return;
    }

    const cell = ws.getRow(row).getCell(col);
    
    // ExcelJS usa 'note' para comentarios
    // Puede ser string o objeto con más propiedades
    if (typeof comment === 'string') {
      cell.note = comment;
    }
  }

  /**
   * Aplica validación de datos a una celda
   */
  private applyDataValidation(ws: ExcelJS.Worksheet, row: number, col: number, validation: IDataValidation): void {
    if (!validation) {
      return;
    }

    const cell = ws.getRow(row).getCell(col);
    
    // ExcelJS usa dataValidation para validaciones
    // Nota: ExcelJS no soporta 'time' como tipo, se convierte a 'date'
    const validationType = validation.type === 'time' ? 'date' : validation.type;
    
    const dataValidation: ExcelJS.DataValidation = {
      type: validationType as 'list' | 'whole' | 'decimal' | 'textLength' | 'date' | 'custom',
      allowBlank: validation.allowBlank ?? true,
      formulae: [] // Inicializar como array vacío, se llenará si hay fórmulas
    };

    // Agregar operador si existe
    if (validation.operator) {
      dataValidation.operator = validation.operator;
    }

    // Agregar fórmulas/valores
    if (validation.type === 'list' && validation.values && validation.values.length > 0) {
      // Excel list formula: "A,B,C"
      const escaped = validation.values
        .map(v => String(v).replace(/"/g, '""'))
        .join(',');
      dataValidation.formulae = [`"${escaped}"`];
    } else if (validation.formula1 !== undefined) {
      if (typeof validation.formula1 === 'string') {
        dataValidation.formulae = [validation.formula1];
      } else if (validation.formula1 instanceof Date) {
        dataValidation.formulae = [validation.formula1.toISOString()];
      } else {
        dataValidation.formulae = [validation.formula1];
      }
    }

    if (validation.formula2 !== undefined) {
      if (!dataValidation.formulae) {
        dataValidation.formulae = [];
      }
      if (typeof validation.formula2 === 'string') {
        dataValidation.formulae.push(validation.formula2);
      } else if (validation.formula2 instanceof Date) {
        dataValidation.formulae.push(validation.formula2.toISOString());
      } else {
        dataValidation.formulae.push(validation.formula2);
      }
    }

    // Agregar mensajes de error e input
    if (validation.showErrorMessage) {
      dataValidation.showErrorMessage = true;
      if (validation.errorMessage) {
        dataValidation.error = validation.errorMessage;
      }
    }

    if (validation.showInputMessage) {
      dataValidation.showInputMessage = true;
      if (validation.inputMessage) {
        dataValidation.prompt = validation.inputMessage;
      }
    }

    cell.dataValidation = dataValidation;
  }

  /**
   * Aplica formato condicional a una celda
   */
  private applyConditionalFormatting(ws: ExcelJS.Worksheet, row: number, col: number, conditionalFormats?: IConditionalFormat[]): void {
    if (!conditionalFormats || conditionalFormats.length === 0) {
      return;
    }

    const cell = ws.getRow(row).getCell(col);
    const cellAddress = cell.address;
    
    // ExcelJS usa addConditionalFormatting para agregar formato condicional
    conditionalFormats.forEach((format, index) => {
      const rule: any = {
        type: format.type,
        priority: format.priority ?? (index + 1),
        stopIfTrue: format.stopIfTrue ?? false
      };

      // Agregar operador si existe
      if (format.operator) {
        rule.operator = format.operator;
      }

      // Agregar fórmulas/valores
      if (format.formula) {
        rule.formulae = [format.formula];
      } else if (format.values && format.values.length > 0) {
        rule.formulae = format.values.map(v => {
          if (typeof v === 'string') {
            return v;
          } else if (v instanceof Date) {
            return v.toISOString();
          } else {
            return String(v);
          }
        });
      }

      // Convertir el estilo si existe y aplicarlo a la regla
      if (format.style) {
        const style = this.convertStyle(format.style);
        // ExcelJS aplica el estilo directamente en la regla
        rule.style = style;
      }

      // Agregar la regla de formato condicional usando addConditionalFormatting
      ws.addConditionalFormatting({
        ref: cellAddress,
        rules: [rule]
      });
    });
  }

  /**
   * Aplica filtro automático a una tabla
   */
  private applyAutoFilter(ws: ExcelJS.Worksheet, table: ITable, startRow: number, endRow: number): void {
    if (!table.autoFilter) {
      return;
    }

    // Calcular el rango de columnas
    const maxCols = this.calculateTableMaxColumns(table);
    
    // Aplicar filtro automático al rango de la tabla
    // El filtro se aplica desde la fila de headers hasta la última fila de datos
    const headerRow = startRow;
    const dataEndRow = endRow;
    
    if (maxCols > 0 && dataEndRow >= headerRow) {
      ws.autoFilter = {
        from: {
          row: headerRow,
          column: 1
        },
        to: {
          row: dataEndRow,
          column: maxCols
        }
      };
    }
  }

  /**
   * Aplica filtro automático a nivel de worksheet
   */
  private applyWorksheetAutoFilter(ws: ExcelJS.Worksheet, lastRow: number): void {
    const autoFilterConfig = this.config.autoFilter;
    if (!autoFilterConfig || !autoFilterConfig.enabled) {
      return;
    }

    // Si hay un rango específico, usarlo
    if (autoFilterConfig.range) {
      ws.autoFilter = {
        from: {
          row: autoFilterConfig.range.start?.row || 1,
          column: autoFilterConfig.range.start?.col || 1
        },
        to: {
          row: autoFilterConfig.range.end?.row || lastRow,
          column: autoFilterConfig.range.end?.col || ws.columnCount || 1
        }
      };
      return;
    }

    // Si hay configuración de filas/columnas específicas
    if (autoFilterConfig.startRow !== undefined || autoFilterConfig.endRow !== undefined ||
        autoFilterConfig.startColumn !== undefined || autoFilterConfig.endColumn !== undefined) {
      ws.autoFilter = {
        from: {
          row: autoFilterConfig.startRow || 1,
          column: autoFilterConfig.startColumn || 1
        },
        to: {
          row: autoFilterConfig.endRow || lastRow,
          column: autoFilterConfig.endColumn || ws.columnCount || 1
        }
      };
      return;
    }

    // Por defecto, aplicar a todo el contenido (desde la primera fila hasta la última)
    // Excluyendo headers si existen
    const startRow = this.headers.length > 0 ? this.headers.length + (this.subHeaders.length > 0 ? this.getMaxHeaderDepth(this.subHeaders) : 0) : 1;
    const maxCols = this.getMaxColumns() || ws.columnCount || 1;
    
    if (lastRow >= startRow && maxCols > 0) {
      ws.autoFilter = {
        from: {
          row: startRow,
          column: 1
        },
        to: {
          row: lastRow,
          column: maxCols
        }
      };
    }
  }

  /**
   * Procesa el valor de una celda considerando links y máscaras
   * Si el tipo es LINK o hay un link, crea un hipervínculo en Excel
   */
  private processCellValue(cell: IDataCell | IHeaderCell | IFooterCell): ExcelJS.CellValue {
    // Si hay un link o el tipo es LINK, crear hipervínculo
    if (cell.link || cell.type === CellType.LINK) {
      const linkUrl = cell.link || (typeof cell.value === 'string' ? cell.value : '');
      
      // Si no hay URL válida, retornar el valor normal
      if (!linkUrl || linkUrl.trim() === '') {
        return cell.value;
      }
      
      // Determinar el texto visible: usar máscara si existe, sino usar value, sino usar la URL
      const displayText = cell.mask || cell.value || linkUrl;
      
      // Crear objeto de hipervínculo para ExcelJS
      return {
        text: String(displayText),
        hyperlink: linkUrl
      } as any;
    }
    
    // Si no hay link, retornar el valor normal
    return cell.value;
  }

  /**
   * Agrega una fila de datos y sus children recursivamente
   * @returns el siguiente rowPointer disponible
   */
  private addDataRowRecursive(
    ws: ExcelJS.Worksheet,
    rowPointer: number,
    row: IDataCell,
    contextRows?: IDataCell[],
    contextIndex?: number,
    contextSubHeaders?: IHeaderCell[]
  ): number {
    // Calcular las columnas basándose en la estructura de subheaders
    const columnPositions = this.calculateDataColumnPositions(contextSubHeaders);

    // Buscar la columna correcta para el dato principal
    let mainColPosition: number | undefined;
    
    // Intentar encontrar por key primero
    if (row.key && columnPositions[row.key]) {
      mainColPosition = columnPositions[row.key];
    }
    // Si no se encuentra por key, intentar por header
    else if (row.header && columnPositions[row.header]) {
      mainColPosition = columnPositions[row.header];
    }
    
    // Si no se encuentra la posición, usar columna 1 por defecto
    if (mainColPosition === undefined) {
      mainColPosition = 1;
    }
    
    // Escribir el dato principal en la columna correcta
    const excelRow = ws.getRow(rowPointer);
    const mainCell = excelRow.getCell(mainColPosition);
    
    // Aplicar rich text si existe
    if ((row as any).richText && (row as any).richText.length > 0) {
      mainCell.value = {
            richText: (row as any).richText.map((run: IRichTextRun) => ({
          text: run.text,
          font: run.font ? { name: run.font } : undefined,
          size: run.size,
                  color: run.color ? this.convertColorToExcelJS(run.color) : undefined,
          bold: run.bold,
          italic: run.italic,
          underline: run.underline,
          strike: run.strikethrough
        })).filter((run: any) => run.text !== undefined)
      } as any;
    } else {
      mainCell.value = this.processCellValue(row);
    }
    
    // Aplicar estilo: primero explícito, luego styleName, luego tema
    if (row.styles) {
      mainCell.style = this.convertStyle(row.styles);
    } else if (row.styleName) {
      const style = this.getPredefinedStyle(row.styleName);
      if (style) {
        mainCell.style = this.convertStyle(style);
      }
    } else {
      // Aplicar estilo del tema si está disponible y auto-apply está habilitado
      // Usar el número de fila actual como índice para alternar
      const themeStyle = this.getThemeStyle('body', rowPointer);
      if (themeStyle) {
        mainCell.style = this.convertStyle(themeStyle);
      }
    }
    if (row.numberFormat) {
      mainCell.numFmt = row.numberFormat;
    }

    // Calcular cuántas filas ocuparán esta fila y sus childrens (incluye la fila principal)
    const rowsNeeded = this.calculateRowSpan(row);
    const endRow = rowPointer + Math.max(1, rowsNeeded) - 1;

    // Manejo de mergeAs: copiar la estructura de merge de otra celda (horizontal o vertical)
    if ((row as any).mergeAs && (row as any).mergeAs.fromKey) {
      const explicitRows = Number((row as any).mergeAs?.rows);
      let spanRows: number | undefined;

      if (Number.isFinite(explicitRows) && explicitRows >= 0) {
        // rows = number of additional rows (exclude current row)
        spanRows = explicitRows + 1;
      } else if (contextRows && typeof contextIndex === 'number') {
        // Buscar SOLO la fila siguiente inmediata (evita recorrer otras filas)
        const nextRow = contextRows[contextIndex + 1];
        if (nextRow && (nextRow as any).key === (row as any).mergeAs.fromKey) {
          const nextChildren = (nextRow as any).children as Array<any> | undefined;
          const jumpCount = nextChildren && nextChildren.length > 0
            ? nextChildren.reduce((acc, c) => acc + (c && c.jump ? 1 : 0), 0)
            : 0;
          spanRows = jumpCount || (nextChildren && nextChildren.length > 0 ? nextChildren.length : 1);
        }
      }

      if (spanRows === undefined) {
        // Fallback: usar la propia row
        const children = (row as any).children as Array<any> | undefined;
        const jumpCount = children && children.length > 0
          ? children.reduce((acc, c) => acc + (c && c.jump ? 1 : 0), 0)
          : 0;
        spanRows = jumpCount || (children && children.length > 0 ? children.length : 1);
      }

      const safeSpan = spanRows ?? 1;
      const endRowCopy = rowPointer + Math.max(1, safeSpan) - 1;
      this.safeMerge(ws, rowPointer, mainColPosition, endRowCopy, mainColPosition);
    } else {
      // Si no hay mergeAs, comportamiento legacy: merge si mergeCell está definido
        if ((row as any).mergeCell && (row as any).mergeTo) {
          if (rowsNeeded > 1) this.safeMerge(ws, rowPointer, mainColPosition, endRow, (row as any).mergeTo);
          else this.safeMerge(ws, rowPointer, mainColPosition, rowPointer, (row as any).mergeTo);
        } else if (rowsNeeded > 1) {
          // Merge vertical en la misma columna
          this.safeMerge(ws, rowPointer, mainColPosition, endRow, mainColPosition);
        }
    }
    
    // Aplicar protección de celda si existe
    if ((row as any).cellProtection) {
      mainCell.protection = {
        locked: (row as any).cellProtection.locked ?? true,
        hidden: (row as any).cellProtection.hidden ?? false
      };
    } else if (row.protected !== undefined) {
      // Soporte legacy
      mainCell.protection = {
        locked: row.protected,
        hidden: false
      };
    }
    
    // Aplicar dimensiones de celda
    this.applyCellDimensions(ws, rowPointer, mainColPosition, row);
    // Aplicar comentario si existe
    if (row.comment) {
      this.applyCellComment(ws, rowPointer, mainColPosition, row.comment);
    }
    // Aplicar validación de datos si existe
    if (row.validation) {
      this.applyDataValidation(ws, rowPointer, mainColPosition, row.validation);
    }
    // Aplicar formato condicional si existe
    if (row.styles?.conditionalFormats) {
      this.applyConditionalFormatting(ws, rowPointer, mainColPosition, row.styles.conditionalFormats);
    }
    
    // Si hay children, escribirlos en las columnas correspondientes
    if (row.children && row.children.length > 0) {
      let childRowPointer = rowPointer;
      for (const child of row.children) {
        if (child) {
          // Buscar la columna correcta basándose en el header del child
          let colPosition: number | undefined;
          
          // Intentar encontrar por key primero
          if (child.key && columnPositions[child.key]) {
            colPosition = columnPositions[child.key];
          }
          // Si no se encuentra por key, intentar por header
          else if (child.header && columnPositions[child.header]) {
            colPosition = columnPositions[child.header];
          }
          
          if (colPosition !== undefined) {
            const childExcelRow = ws.getRow(childRowPointer);
            const childCell = childExcelRow.getCell(colPosition);
            childCell.value = this.processCellValue(child);
            if (child.styles) {
              childCell.style = this.convertStyle(child.styles);
            }
            if (child.numberFormat) {
              childCell.numFmt = child.numberFormat;
            }

            // Support mergeAs on child cells (rows only, vertical)
            if ((child as any).mergeAs && (child as any).mergeAs.rows !== undefined) {
              const explicitRows = Number((child as any).mergeAs.rows);
              const spanRows = Number.isFinite(explicitRows) && explicitRows >= 0 ? explicitRows + 1 : 1;
              const endRowCopy = childRowPointer + Math.max(1, spanRows) - 1;
              this.safeMerge(ws, childRowPointer, colPosition, endRowCopy, colPosition);
            }
            
            // Aplicar dimensiones de celda para children
            this.applyCellDimensions(ws, childRowPointer, colPosition, child);
            // Aplicar comentario si existe
            if (child.comment) {
              this.applyCellComment(ws, childRowPointer, colPosition, child.comment);
            }
            // Aplicar validación de datos si existe
            if (child.validation) {
              this.applyDataValidation(ws, childRowPointer, colPosition, child.validation);
            }
            // Aplicar formato condicional si existe
            if (child.styles?.conditionalFormats) {
              this.applyConditionalFormatting(ws, childRowPointer, colPosition, child.styles.conditionalFormats);
            }
          }

          if (child.jump) {
            childRowPointer += 1;
          }
        }
      }
    }
    
    // Incrementar rowPointer solo si la celda tiene la propiedad jump
    if (row.jump) {
      return rowPointer + 1;
    }
    
    return rowPointer;
  }

    /**
     * Merge helper that avoids attempting to merge a range that's already merged.
     */
    private safeMerge(ws: ExcelJS.Worksheet, startRow: number, startCol: number, endRow: number, endCol: number): void {
      try {
        const startColLetter = this.numberToColumnLetter(startCol);
        const endColLetter = this.numberToColumnLetter(endCol);
        const range = `${startColLetter}${startRow}:${endColLetter}${endRow}`;
        // exceljs stores merges in a Map-like structure on the worksheet
        if ((ws as any)._merges && typeof (ws as any)._merges.has === 'function') {
          if ((ws as any)._merges.has(range)) return;
        }
        ws.mergeCells(startRow, startCol, endRow, endCol);
      } catch (e) {
        // Ignore merge errors (e.g., overlapping/duplicate merges)
      }
    }

  /**
   * Convierte un color a formato ExcelJS (ARGB)
   */
  private convertColor(color: any): any {
    if (!color) return undefined;
    
    // Si ya es un objeto con argb, retornarlo
    if (typeof color === 'object' && color.argb) {
      return color;
    }
    
    // Si es un objeto con r, g, b
    if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
      const r = color.r.toString(16).padStart(2, '0');
      const g = color.g.toString(16).padStart(2, '0');
      const b = color.b.toString(16).padStart(2, '0');
      return { argb: `FF${r}${g}${b}`.toUpperCase() };
    }
    
    // Si es un string (hex)
    if (typeof color === 'string') {
      // Remover # si existe
      let hex = color.replace('#', '');
      
      // Si es formato corto (RGB), expandirlo
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      
      // Asegurar que tenga alpha (FF = completamente opaco)
      if (hex.length === 6) {
        hex = 'FF' + hex.toUpperCase();
      }
      
      return { argb: hex };
    }
    
    // Si es un objeto theme
    if (typeof color === 'object' && 'theme' in color) {
      return color;
    }
    
    return undefined;
  }

  /**
   * Calcula cuántas filas ocupará una celda considerando children y jumps.
   */
  private calculateRowSpan(row: IDataCell | IHeaderCell | IFooterCell): number {
    if (!row) return 1;
    let span = 1;
    const children = (row as any).children as Array<any> | undefined;
    if (!children || children.length === 0) return span;

    // Contar filas adicionales introducidas por children con `jump`
    let current = 1;
    for (const c of children) {
      if (!c) continue;
      const childSpan = this.calculateRowSpan(c as IDataCell);
      if (c.jump) {
        current = Math.max(current, 1) + childSpan;
      } else {
        current = Math.max(current, childSpan);
      }
    }
    span = Math.max(span, current);
    return span;
  }

  /**
   * Busca recursivamente una celda (por key) dentro de una definición de fila/header/footer
   */
  private findCellInRow(row: IDataCell | IHeaderCell | IFooterCell, key: string): IDataCell | IHeaderCell | IFooterCell | undefined {
    if (!row) return undefined;
    if ((row as any).key === key) return row as any;
    const children = (row as any).children as Array<any> | undefined;
    if (!children || children.length === 0) return undefined;
    for (const c of children) {
      if (!c) continue;
      if (c.key === key) return c;
      const found = this.findCellInRow(c, key);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Convierte el estilo personalizado a formato compatible con ExcelJS
   */
  private convertStyle(style: any): Partial<ExcelJS.Style> {
    if (!style) return {};
    
    const converted: Partial<ExcelJS.Style> = {};
    
    if (style.font) {
      converted.font = {
        name: style.font.family || style.font.name,
        size: style.font.size,
        bold: style.font.bold,
        italic: style.font.italic,
        underline: style.font.underline,
        color: this.convertColor(style.font.color)
      };
    }
    
    if (style.fill) {
      // En ExcelJS, para patrón sólido, el color de fondo debe ir en fgColor
      // backgroundColor es el color que queremos mostrar como fondo de la celda
      const pattern = style.fill.pattern || 'solid';
      
      // Para patrón sólido: backgroundColor va en fgColor (es el color visible)
      // Para otros patrones: foregroundColor es el color del patrón, backgroundColor es el fondo
      const fgColor = pattern === 'solid' 
        ? (style.fill.backgroundColor || style.fill.foregroundColor)
        : (style.fill.foregroundColor || style.fill.backgroundColor);
      
      // bgColor solo es relevante para patrones no sólidos
      const bgColor = pattern !== 'solid' ? style.fill.backgroundColor : undefined;
      
      converted.fill = {
        type: style.fill.type || 'pattern',
        pattern: pattern,
        fgColor: this.convertColor(fgColor),
        bgColor: bgColor ? this.convertColor(bgColor) : undefined
      };
      
      // Limpiar bgColor si es undefined para evitar problemas
      if (!converted.fill.bgColor) {
        delete converted.fill.bgColor;
      }
    }
    
    if (style.border) {
      converted.border = {};
      
      if (style.border.top) {
        converted.border.top = {
          style: style.border.top.style,
          color: this.convertColor(style.border.top.color)
        };
      }
      
      if (style.border.left) {
        converted.border.left = {
          style: style.border.left.style,
          color: this.convertColor(style.border.left.color)
        };
      }
      
      if (style.border.bottom) {
        converted.border.bottom = {
          style: style.border.bottom.style,
          color: this.convertColor(style.border.bottom.color)
        };
      }
      
      if (style.border.right) {
        converted.border.right = {
          style: style.border.right.style,
          color: this.convertColor(style.border.right.color)
        };
      }
    }
    
    // Conditional formatting se aplica directamente a la celda, no al estilo base
    // Se maneja en applyConditionalFormatting()
    
    if (style.alignment) {
      converted.alignment = {};
      
      // Horizontal alignment - validar valores permitidos
      if (style.alignment.horizontal !== undefined) {
        const validHorizontal = ['left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'];
        if (validHorizontal.includes(style.alignment.horizontal)) {
          converted.alignment.horizontal = style.alignment.horizontal as any;
        }
      }
      
      // Vertical alignment - validar valores permitidos
      if (style.alignment.vertical !== undefined) {
        const validVertical = ['top', 'middle', 'bottom', 'distributed', 'justify'];
        if (validVertical.includes(style.alignment.vertical)) {
          converted.alignment.vertical = style.alignment.vertical as any;
        }
      }
      
      // Wrap text
      if (style.alignment.wrapText !== undefined) {
        converted.alignment.wrapText = Boolean(style.alignment.wrapText);
      }
      
      // Shrink to fit
      if (style.alignment.shrinkToFit !== undefined) {
        converted.alignment.shrinkToFit = Boolean(style.alignment.shrinkToFit);
      }
      
      // Indent
      if (style.alignment.indent !== undefined && typeof style.alignment.indent === 'number') {
        converted.alignment.indent = style.alignment.indent;
      }
      
      // Text rotation (0-180 grados)
      if (style.alignment.textRotation !== undefined && typeof style.alignment.textRotation === 'number') {
        converted.alignment.textRotation = style.alignment.textRotation;
      }
      
      // Reading order
      if (style.alignment.readingOrder !== undefined) {
        const validReadingOrder = ['left-to-right', 'right-to-left', 'context'];
        if (validReadingOrder.includes(style.alignment.readingOrder)) {
          converted.alignment.readingOrder = style.alignment.readingOrder as any;
        }
      }
      
      // Solo agregar alignment si tiene al menos una propiedad
      if (Object.keys(converted.alignment).length === 0) {
        delete converted.alignment;
      }
    }
    
    if (style.numFmt) {
      converted.numFmt = style.numFmt;
    }
    
    return converted;
  }

  /**
   * Convierte un número de columna a letra (1 = A, 2 = B, etc.)
   */
  private numberToColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  /**
   * Convierte letra de columna a número (A = 1, B = 2, etc.)
   */
  private columnLetterToNumber(columnLetter: string): number {
    let result = 0;
    for (let i = 0; i < columnLetter.length; i++) {
      result = result * 26 + (columnLetter.charCodeAt(i) - 64);
    }
    return result;
  }

  /**
   * Aplica una imagen al worksheet
   */
  private async applyImage(ws: ExcelJS.Worksheet, image: IWorksheetImage): Promise<void> {
    try {
      // Convertir posición
      let row: number;
      let col: number;
      
      if (typeof image.position.row === 'string') {
        // Parsear referencia de celda (e.g., "A1" -> row 1)
        const match = image.position.row.match(/([A-Z]+)(\d+)/);
        if (match && match[1] && match[2]) {
          col = this.columnLetterToNumber(match[1]);
          row = parseInt(match[2], 10);
        } else {
          row = parseInt(image.position.row, 10) || 1;
          col = typeof image.position.col === 'string' 
            ? this.columnLetterToNumber(image.position.col)
            : (typeof image.position.col === 'number' ? image.position.col : 1);
        }
      } else {
        row = image.position.row;
        col = typeof image.position.col === 'string' 
          ? this.columnLetterToNumber(image.position.col)
          : (typeof image.position.col === 'number' ? image.position.col : 1);
      }

      // Preparar el buffer de imagen
      let imageBuffer: Uint8Array;
      if (typeof image.buffer === 'string') {
        // Base64 string
        let base64Data: string;
        if (image.buffer.startsWith('data:')) {
          // Data URL - extraer base64
          const parts = image.buffer.split(',');
          base64Data = parts[1] || image.buffer;
        } else {
          // Base64 directo
          base64Data = image.buffer;
        }
        // Convertir base64 a Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageBuffer = bytes;
      } else if (image.buffer instanceof ArrayBuffer) {
        imageBuffer = new Uint8Array(image.buffer);
      } else {
        imageBuffer = image.buffer;
      }

      // Calcular posición y tamaño
      const imagePosition: any = {
        tl: { col: col - 1, row: row - 1 }
      };

      if (image.size) {
        if (image.size.width && image.size.height) {
          imagePosition.ext = {
            width: image.size.width,
            height: image.size.height
          };
        } else if (image.size.scaleX && image.size.scaleY) {
          // Usar escala si no hay dimensiones absolutas
          // Nota: ExcelJS no soporta escala directamente, necesitamos calcular dimensiones
          imagePosition.ext = {
            width: 100 * (image.size.scaleX || 1),
            height: 100 * (image.size.scaleY || 1)
          };
        }
      }

      // ExcelJS addImage - primer parámetro es el objeto con buffer y extension, segundo es la posición
      ws.addImage({
        buffer: imageBuffer,
        extension: image.extension
      } as any, imagePosition as any);

      // Agregar hipervínculo si existe
      if (image.hyperlink) {
        const cell = ws.getRow(row).getCell(col);
        cell.value = {
          text: image.description || '',
          hyperlink: image.hyperlink
        } as any;
      }
    } catch (error) {
      console.warn('Error adding image to worksheet:', error);
    }
  }

  /**
   * Aplica agrupación de filas
   */
  private applyRowGrouping(ws: ExcelJS.Worksheet, startRow: number, endRow: number, collapsed: boolean = false): void {
    for (let row = startRow; row <= endRow; row++) {
      const excelRow = ws.getRow(row);
      if (!excelRow.outlineLevel) {
        excelRow.outlineLevel = 1;
      }
      // Nota: collapsed es read-only en ExcelJS, se maneja a través de outlineLevel
      if (collapsed && row === startRow) {
        try {
          (excelRow as any).collapsed = true;
        } catch {
          // Ignorar si no está disponible
        }
      }
    }
  }

  /**
   * Aplica agrupación de columnas
   */
  private applyColumnGrouping(ws: ExcelJS.Worksheet, startCol: number, endCol: number, collapsed: boolean = false): void {
    for (let col = startCol; col <= endCol; col++) {
      const excelCol = ws.getColumn(col);
      if (!excelCol.outlineLevel) {
        excelCol.outlineLevel = 1;
      }
      // Nota: collapsed es read-only en ExcelJS, se maneja a través de outlineLevel
      if (collapsed && col === startCol) {
        try {
          (excelCol as any).collapsed = true;
        } catch {
          // Ignorar si no está disponible
        }
      }
    }
  }

  /**
   * Aplica una tabla estructurada de Excel
   */
  private applyExcelTable(ws: ExcelJS.Worksheet, table: IExcelTable): void {
    try {
      const range = `${table.range.start}:${table.range.end}`;
      
      const tableConfig: any = {
        name: table.name,
        ref: range,
        headerRow: table.headerRow !== false,
        totalsRow: table.totalRow === true
      };

      if (table.style) {
        tableConfig.style = {
          theme: table.style,
          showFirstColumn: false,
          showLastColumn: false,
          showRowStripes: true,
          showColumnStripes: false
        };
      }

      if (table.columns && table.columns.length > 0) {
        tableConfig.columns = table.columns.map(col => ({
          name: col.name,
          filterButton: col.filterButton !== false,
          totalsRowFunction: col.totalsRowFunction || 'none',
          totalsRowFormula: col.totalsRowFormula
        }));
      }

      ws.addTable(tableConfig);
    } catch (error) {
      console.warn('Error adding Excel table:', error);
    }
  }

  /**
   * Aplica configuración avanzada de impresión
   */
  private applyAdvancedPrintSettings(ws: ExcelJS.Worksheet): void {
    // Headers y footers
    if (this.config.printHeadersFooters) {
      const headerFooter: any = {};
      
      if (this.config.printHeadersFooters.header) {
        const left = this.config.printHeadersFooters.header.left || '';
        const center = this.config.printHeadersFooters.header.center || '';
        const right = this.config.printHeadersFooters.header.right || '';
        headerFooter.oddHeader = `${left}&C${center}&R${right}`;
      }
      
      if (this.config.printHeadersFooters.footer) {
        const left = this.config.printHeadersFooters.footer.left || '';
        const center = this.config.printHeadersFooters.footer.center || '';
        const right = this.config.printHeadersFooters.footer.right || '';
        headerFooter.oddFooter = `${left}&C${center}&R${right}`;
      }
      
      if (Object.keys(headerFooter).length > 0) {
        ws.headerFooter = headerFooter;
      }
    }

    // Repeat rows/columns
    if (this.config.printRepeat) {
      if (this.config.printRepeat.rows) {
        if (Array.isArray(this.config.printRepeat.rows)) {
          const rowsStr = this.config.printRepeat.rows.map(r => r.toString()).join(':');
          ws.pageSetup.printTitlesRow = `$${rowsStr}`;
        } else {
          ws.pageSetup.printTitlesRow = `$${this.config.printRepeat.rows}`;
        }
      }
      
      if (this.config.printRepeat.columns) {
        if (Array.isArray(this.config.printRepeat.columns)) {
          const colsStr = this.config.printRepeat.columns
            .map(c => typeof c === 'number' ? this.numberToColumnLetter(c) : c)
            .join(':');
          ws.pageSetup.printTitlesColumn = `$${colsStr}`;
        } else {
          ws.pageSetup.printTitlesColumn = `$${this.config.printRepeat.columns}`;
        }
      }
    }
  }

  /**
   * Aplica filas y columnas ocultas
   */
  private applyHiddenRowsColumns(ws: ExcelJS.Worksheet): void {
    // Ocultar filas
    for (const rowNum of this.hiddenRows) {
      const row = ws.getRow(rowNum);
      row.hidden = true;
    }

    // Ocultar columnas
    for (const colNum of this.hiddenColumns) {
      const column = ws.getColumn(colNum);
      column.hidden = true;
    }
  }

  /**
   * Aplica una tabla dinámica (pivot table)
   */
  private async applyPivotTable(ws: ExcelJS.Worksheet, pivotTable: IPivotTable): Promise<void> {
    try {
      // Verificar si la hoja de origen existe si es diferente
      if (pivotTable.sourceSheet) {
        const workbook = ws.workbook;
        const sourceSheet = workbook.getWorksheet(pivotTable.sourceSheet);
        if (!sourceSheet) {
          console.warn(`Source sheet "${pivotTable.sourceSheet}" not found for pivot table "${pivotTable.name}"`);
          return;
        }
      }

      // Construir la configuración de la tabla dinámica
      const pivotConfig: any = {
        name: pivotTable.name,
        ref: pivotTable.ref,
        sourceRange: pivotTable.sourceRange,
        fields: {}
      };

      // Configurar campos
      if (pivotTable.fields.rows && pivotTable.fields.rows.length > 0) {
        pivotConfig.fields.rows = pivotTable.fields.rows;
      }

      if (pivotTable.fields.columns && pivotTable.fields.columns.length > 0) {
        pivotConfig.fields.columns = pivotTable.fields.columns;
      }

      if (pivotTable.fields.values && pivotTable.fields.values.length > 0) {
        pivotConfig.fields.values = pivotTable.fields.values.map(v => ({
          name: v.name,
          stat: v.stat
        }));
      }

      if (pivotTable.fields.filters && pivotTable.fields.filters.length > 0) {
        pivotConfig.fields.filters = pivotTable.fields.filters;
      }

      // Opciones
      if (pivotTable.options) {
        pivotConfig.options = pivotTable.options;
      }

      // Agregar la tabla dinámica
      // ExcelJS addPivotTable - verificar si existe el método
      if ((ws as any).addPivotTable) {
        (ws as any).addPivotTable(pivotConfig);
      } else {
        console.warn('Pivot tables require ExcelJS 4.5.0+. Feature may not be fully supported.');
      }
    } catch (error) {
      console.warn('Error adding pivot table:', error);
    }
  }

  /**
   * Convierte un color a formato ExcelJS
   */
  private convertColorToExcelJS(color: string | { r: number; g: number; b: number } | { theme: number }): any {
    if (typeof color === 'string') {
      // Hex color
      if (color.startsWith('#')) {
        const hex = color.substring(1);
        return { argb: `FF${hex.toUpperCase()}` };
      }
      // Named color - intentar convertir
      return { argb: 'FF000000' };
    } else if ('r' in color && 'g' in color && 'b' in color) {
      // RGB object
      const hex = [color.r, color.g, color.b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
      return { argb: `FF${hex}` };
    } else if ('theme' in color) {
      // Theme color
      return { theme: color.theme };
    }
    return { argb: 'FF000000' };
  }

  /**
   * Aplica views (freeze panes, split panes, sheet views)
   */
  private applyViews(ws: ExcelJS.Worksheet): void {
    const views: ExcelJS.WorksheetView[] = [];

    // Freeze panes
    if (this.config.freezePanes) {
      const freezeView: any = {
        state: 'frozen',
        xSplit: this.config.freezePanes.col - 1,
        ySplit: this.config.freezePanes.row - 1,
        topLeftCell: this.config.freezePanes.reference || this.numberToColumnLetter(this.config.freezePanes.col) + String(this.config.freezePanes.row),
        activeCell: this.config.freezePanes.reference || this.numberToColumnLetter(this.config.freezePanes.col) + String(this.config.freezePanes.row)
      };
      views.push(freezeView);
    }
    // Split panes
    else if (this.config.splitPanes) {
      const splitConfig = this.config.splitPanes;
      const splitView: any = {
        state: 'split',
        xSplit: splitConfig.xSplit || 0,
        ySplit: splitConfig.ySplit || 0
      };

      if (splitConfig.topLeftCell) {
        splitView.topLeftCell = splitConfig.topLeftCell;
      }

      if (splitConfig.activePane) {
        const paneMap: Record<string, string> = {
          'topLeft': 'topLeft',
          'topRight': 'topRight',
          'bottomLeft': 'bottomLeft',
          'bottomRight': 'bottomRight'
        };
        splitView.activePane = paneMap[splitConfig.activePane] || 'topLeft';
      }

      views.push(splitView);
    }
    // Sheet views (normal, pageBreakPreview, pageLayout)
    else if (this.config.views) {
      const viewConfig = this.config.views;
      const view: any = {
        state: viewConfig.state === 'pageBreakPreview' || viewConfig.state === 'pageLayout' ? 'normal' : (viewConfig.state || 'normal')
      };

      if (viewConfig.zoomScale !== undefined) {
        view.zoomScale = viewConfig.zoomScale;
      }

      if (viewConfig.zoomScaleNormal !== undefined) {
        view.zoomScaleNormal = viewConfig.zoomScaleNormal;
      }

      if (viewConfig.showGridLines !== undefined) {
        view.showGridLines = viewConfig.showGridLines;
      }

      if (viewConfig.showRowColHeaders !== undefined) {
        view.showRowColHeaders = viewConfig.showRowColHeaders;
      }

      if (viewConfig.showRuler !== undefined) {
        view.showRuler = viewConfig.showRuler;
      }

      if (viewConfig.rightToLeft !== undefined) {
        view.rightToLeft = viewConfig.rightToLeft;
      }

      views.push(view);
    }
    // Default view if zoom is set
    else if (this.config.zoom) {
      views.push({
        state: 'normal',
        zoomScale: this.config.zoom
      } as any);
    }

    // Apply views if any were configured
    if (views.length > 0) {
      ws.views = views;
    }
  }

  /**
   * Obtiene un estilo predefinido del workbook
   */
  private getPredefinedStyle(styleName: string): import('../types/style.types').IStyle | undefined {
    if (this.customStyles && this.customStyles[styleName]) {
      return this.customStyles[styleName];
    }
    return undefined;
  }

  /**
   * Obtiene un estilo del tema para una sección específica
   */
  private getThemeStyle(section: 'header' | 'subHeader' | 'body' | 'footer', rowIndex?: number): import('../types/style.types').IStyle | undefined {
    if (!this.theme || this.theme.autoApplySectionStyles === false) {
      return undefined;
    }

    if (!this.customStyles) {
      return undefined;
    }

    // Mapear sección a nombre de estilo del tema
    let styleName = '';
    if (section === 'header') {
      styleName = '__theme_header';
    } else if (section === 'subHeader') {
      styleName = '__theme_subHeader';
    } else if (section === 'body') {
      // Para body, alternar entre normal y alternativo si está disponible
      if (rowIndex !== undefined && rowIndex % 2 === 1 && this.customStyles['__theme_body_alt']) {
        styleName = '__theme_body_alt';
      } else {
        styleName = '__theme_body';
      }
    } else if (section === 'footer') {
      styleName = '__theme_footer';
    }

    return this.customStyles[styleName];
  }

  /**
   * Aplica un slicer a una tabla o tabla dinámica
   */
  private async applySlicer(ws: ExcelJS.Worksheet, slicer: ISlicer): Promise<void> {
    try {
      // ExcelJS no tiene soporte directo para slicers en la API pública
      // Se puede implementar usando la estructura XML subyacente, pero es complejo
      // Por ahora, documentamos la funcionalidad y dejamos un placeholder
      // Nota: Los slicers requieren manipulación directa del XML de Excel
      console.warn('Slicers require advanced ExcelJS XML manipulation. Feature documented but not fully implemented.');
      
      // Intentar agregar como comentario o nota en la celda de posición
      const colNum = typeof slicer.position.col === 'string' 
        ? this.columnLetterToNumber(slicer.position.col)
        : slicer.position.col;
      
      const cell = ws.getRow(slicer.position.row).getCell(colNum);
      cell.note = `Slicer: ${slicer.name} for table "${slicer.targetTable}" on column "${slicer.column}"`;
    } catch (error) {
      console.warn('Error adding slicer:', error);
    }
  }

  /**
   * Aplica una marca de agua al worksheet
   */
  private async applyWatermark(ws: ExcelJS.Worksheet, watermark: IWatermark): Promise<void> {
    try {
      if (watermark.image) {
        // Usar imagen como marca de agua
        const imageConfig: IWorksheetImage = {
          ...watermark.image,
          position: watermark.position ? {
            row: watermark.position.vertical === 'top' ? 1 : watermark.position.vertical === 'bottom' ? 1000 : 500,
            col: watermark.position.horizontal === 'left' ? 1 : watermark.position.horizontal === 'right' ? 20 : 10
          } : { row: 500, col: 10 },
          size: watermark.image.size || {
            width: 400,
            height: 300,
            scaleX: watermark.opacity || 0.3,
            scaleY: watermark.opacity || 0.3
          }
        };
        await this.applyImage(ws, imageConfig);
      } else if (watermark.text) {
        // Crear marca de agua de texto usando una imagen generada
        // Nota: En un entorno real, necesitarías generar una imagen del texto
        // Por ahora, agregamos el texto como comentario en una celda central
        const centerRow = Math.floor((ws.rowCount || 100) / 2);
        const centerCol = Math.floor((ws.columnCount || 20) / 2);
        const cell = ws.getRow(centerRow).getCell(centerCol);
        cell.value = watermark.text;
        cell.style = {
          font: {
            size: watermark.fontSize || 72,
            color: { argb: this.convertColorToExcelJS(watermark.fontColor || '#CCCCCC').argb },
            italic: true
          },
          alignment: {
            horizontal: 'center',
            vertical: 'middle'
          }
        } as any;
      }
    } catch (error) {
      console.warn('Error adding watermark:', error);
    }
  }

  /**
   * Aplica una conexión de datos
   */
  private async applyDataConnection(workbook: ExcelJS.Workbook, connection: IDataConnection): Promise<void> {
    try {
      // ExcelJS no tiene soporte directo para conexiones de datos
      // Las conexiones de datos requieren manipulación del XML de Excel
      // Por ahora, documentamos la funcionalidad
      console.warn('Data connections require advanced ExcelJS XML manipulation. Feature documented but not fully implemented.');
      
      // Guardar información de la conexión en los metadatos del workbook
      if (!workbook.model) {
        (workbook as any).model = {};
      }
      if (!(workbook as any).model.dataConnections) {
        (workbook as any).model.dataConnections = [];
      }
      (workbook as any).model.dataConnections.push({
        name: connection.name,
        type: connection.type,
        connectionString: connection.connectionString,
        commandText: connection.commandText,
        refresh: connection.refresh,
        credentials: connection.credentials ? {
          username: connection.credentials.username,
          integratedSecurity: connection.credentials.integratedSecurity
          // No guardar password por seguridad
        } : undefined
      });
    } catch (error) {
      console.warn('Error adding data connection:', error);
    }
  }
}