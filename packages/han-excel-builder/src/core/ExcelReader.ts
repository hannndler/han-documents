/**
 * ExcelReader - Class for reading Excel files and converting them to JSON
 */

import ExcelJS from 'exceljs';
import { Result, success, error, ErrorType as CoreErrorType } from '@han/core';
import {
  IExcelReaderOptions,
  IJsonWorkbook,
  IJsonSheet,
  IJsonRow,
  IJsonCell,
  OutputFormat,
  IDetailedFormat,
  IDetailedCell,
  IFlatFormat,
  IFlatFormatMultiSheet,
  ExcelReaderResult
} from '../types/reader.types';
import { ErrorType, IErrorResult } from '../types/compat.types';

/**
 * ExcelReader class for reading Excel files and converting to JSON
 */
export class ExcelReader {
  /**
   * Read Excel file from ArrayBuffer
   */
  static async fromBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    buffer: ArrayBuffer,
    options: IExcelReaderOptions = {}
  ): Promise<ExcelReaderResult<T>> {
    const startTime = Date.now();

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const outputFormat = (options.outputFormat || OutputFormat.WORKSHEET) as OutputFormat;
      const processingTime = Date.now() - startTime;

      let result: unknown;

      switch (outputFormat) {
        case OutputFormat.DETAILED:
          result = this.convertToDetailedFormat(workbook, options);
          break;
        case OutputFormat.FLAT:
          result = this.convertToFlatFormat(workbook, options);
          break;
        case OutputFormat.WORKSHEET:
        default:
          result = this.convertWorkbookToJson(workbook, options);
          break;
      }

      // Apply mapper function if provided
      if (options.mapper) {
        try {
          // Apply mapper based on output format
          switch (outputFormat) {
            case OutputFormat.DETAILED:
              result = (options.mapper as (data: IDetailedFormat) => unknown)(result as IDetailedFormat);
              break;
            case OutputFormat.FLAT:
              result = (options.mapper as (data: IFlatFormat | IFlatFormatMultiSheet) => unknown)(result as IFlatFormat | IFlatFormatMultiSheet);
              break;
            case OutputFormat.WORKSHEET:
            default:
              result = (options.mapper as (data: IJsonWorkbook) => unknown)(result as IJsonWorkbook);
              break;
          }
        } catch (mapperError) {
          const errorResult = error(
            CoreErrorType.VALIDATION_ERROR,
            mapperError instanceof Error 
              ? `Mapper function error: ${mapperError.message}` 
              : 'Error in mapper function',
            'MAPPER_ERROR',
            { originalError: mapperError }
          );
          return {
            ...errorResult,
            processingTime: Date.now() - startTime
          } as ExcelReaderResult<T>;
        }
      }

      const successResult = success(result as T);
      return {
        ...successResult,
        processingTime
      } as unknown as ExcelReaderResult<T>;
    } catch (err: any) {
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        err.message || 'Failed to read Excel file',
        'READ_FAILED',
        { originalError: err }
      );
      return {
        ...errorResult,
        processingTime: Date.now() - startTime
      } as ExcelReaderResult<T>;
    }
  }

  /**
   * Read Excel file from Blob
   */
  static async fromBlob<T extends OutputFormat = OutputFormat.WORKSHEET>(
    blob: Blob,
    options: IExcelReaderOptions = {}
  ): Promise<ExcelReaderResult<T>> {
    const arrayBuffer = await blob.arrayBuffer();
    return this.fromBuffer<T>(arrayBuffer, options);
  }

  /**
   * Read Excel file from File (browser)
   */
  static async fromFile<T extends OutputFormat = OutputFormat.WORKSHEET>(
    file: File,
    options: IExcelReaderOptions = {}
  ): Promise<ExcelReaderResult<T>> {
    return this.fromBlob<T>(file, options);
  }

  /**
   * Read Excel file from path (Node.js only)
   * Note: This method only works in Node.js environment
   */
  static async fromPath<T extends OutputFormat = OutputFormat.WORKSHEET>(
    filePath: string,
    options: IExcelReaderOptions = {}
  ): Promise<ExcelReaderResult<T>> {
    try {
      // Dynamic import - only loads fs in Node.js environment
      // This allows the code to work in both browser and Node.js
      // @ts-expect-error - fs/promises is a Node.js module, not available in browser
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      return this.fromBuffer(arrayBuffer, options);
    } catch (err: any) {
      // Check if error is because fs is not available (browser environment)
      const isBrowserError = err instanceof Error && 
        (err.message.includes('Cannot find module') || 
         err.message.includes('fs') ||
         (typeof window !== 'undefined'));
      
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        isBrowserError 
          ? 'fromPath() method requires Node.js environment. Use fromFile() or fromBlob() in browser.'
          : (err.message || 'Error reading file from path'),
        'PATH_READ_FAILED',
        { originalError: err }
      );
      return {
        ...errorResult,
        processingTime: 0
      } as ExcelReaderResult<T>;
    }
  }

  /**
   * Convert ExcelJS Workbook to JSON
   */
  private static convertWorkbookToJson(
    workbook: ExcelJS.Workbook,
    options: IExcelReaderOptions
  ): IJsonWorkbook {
    const {
      includeEmptyRows = false,
      useFirstRowAsHeaders = false,
      headers,
      sheetName,
      startRow = 1,
      endRow,
      startColumn = 1,
      endColumn,
      includeFormatting = false,
      includeFormulas = false,
      datesAsISO = true
    } = options;

    // Get metadata
    const metadata = {
      title: workbook.title,
      author: workbook.creator,
      company: workbook.company,
      created: workbook.created,
      modified: workbook.modified,
      description: workbook.description
    };

    // Filter sheets
    let sheetsToProcess: ExcelJS.Worksheet[] = [];
    
    if (sheetName !== undefined) {
      if (typeof sheetName === 'number') {
        const sheet = workbook.worksheets[sheetName];
        if (sheet) sheetsToProcess.push(sheet);
      } else {
        const sheet = workbook.getWorksheet(sheetName);
        if (sheet) sheetsToProcess.push(sheet);
      }
    } else {
      sheetsToProcess = workbook.worksheets;
    }

    // Convert each sheet
    const sheets: IJsonSheet[] = sheetsToProcess.map((worksheet) => {
      const sheetOptions: {
        includeEmptyRows: boolean;
        useFirstRowAsHeaders: boolean;
        headers?: string[] | Record<number, string>;
        startRow: number;
        endRow?: number;
        startColumn: number;
        endColumn?: number;
        includeFormatting: boolean;
        includeFormulas: boolean;
        datesAsISO: boolean;
      } = {
        includeEmptyRows: includeEmptyRows ?? false,
        useFirstRowAsHeaders: useFirstRowAsHeaders ?? false,
        startRow: startRow ?? 1,
        startColumn: startColumn ?? 1,
        includeFormatting: includeFormatting ?? false,
        includeFormulas: includeFormulas ?? false,
        datesAsISO: datesAsISO ?? true
      };

      if (headers !== undefined) {
        sheetOptions.headers = headers;
      }
      if (endRow !== undefined) {
        sheetOptions.endRow = endRow;
      }
      if (endColumn !== undefined) {
        sheetOptions.endColumn = endColumn;
      }

      return this.convertSheetToJson(worksheet, sheetOptions);
    });

    const workbookResult: IJsonWorkbook = {
      sheets,
      totalSheets: sheets.length
    };

    // Only add metadata if it has at least one property
    const hasMetadata = Object.values(metadata).some(val => val !== undefined && val !== null);
    if (hasMetadata) {
      workbookResult.metadata = metadata;
    }

    return workbookResult;
  }

  /**
   * Convert ExcelJS Worksheet to JSON
   */
  private static convertSheetToJson(
    worksheet: ExcelJS.Worksheet,
    options: {
      includeEmptyRows: boolean;
      useFirstRowAsHeaders: boolean;
      headers?: string[] | Record<number, string>;
      startRow: number;
      endRow?: number;
      startColumn: number;
      endColumn?: number;
      includeFormatting: boolean;
      includeFormulas: boolean;
      datesAsISO: boolean;
    }
  ): IJsonSheet {
    const {
      includeEmptyRows,
      useFirstRowAsHeaders,
      headers,
      startRow,
      endRow,
      startColumn,
      endColumn,
      includeFormatting,
      includeFormulas,
      datesAsISO
    } = options;

    const rows: IJsonRow[] = [];
    let headerRow: string[] | undefined;
    let maxColumns = 0;

    // Determine row range
    const actualStartRow = Math.max(startRow, 1);
    const actualEndRow = endRow || worksheet.rowCount || worksheet.lastRow?.number || 1;
    const actualStartCol = Math.max(startColumn, 1);
    const actualEndCol = endColumn || worksheet.columnCount || worksheet.lastColumn?.number || 1;

    // Process rows
    for (let rowNum = actualStartRow; rowNum <= actualEndRow; rowNum++) {
      const excelRow = worksheet.getRow(rowNum);
      const cells: IJsonCell[] = [];
      let hasData = false;

      // Process cells in row
      for (let colNum = actualStartCol; colNum <= actualEndCol; colNum++) {
        const cell = excelRow.getCell(colNum);
        
        // Skip if cell is empty and we're not including empty rows
        if (!cell.value && !includeEmptyRows) {
          continue;
        }

        const jsonCell = this.convertCellToJson(cell, {
          includeFormatting,
          includeFormulas,
          datesAsISO
        });

        cells.push(jsonCell);
        hasData = true;
      }

      // Track max columns
      if (cells.length > maxColumns) {
        maxColumns = cells.length;
      }

      // Skip empty rows if configured
      if (!hasData && !includeEmptyRows) {
        continue;
      }

      // Handle headers
      if (useFirstRowAsHeaders && rowNum === actualStartRow) {
        headerRow = cells.map(cell => {
          if (headers && Array.isArray(headers)) {
            return headers[cells.indexOf(cell)] || String(cell.value || '');
          } else if (headers && typeof headers === 'object') {
            return headers[actualStartCol + cells.indexOf(cell)] || String(cell.value || '');
          }
          return String(cell.value || '');
        });
        continue; // Skip header row in data
      }

      // Create row data object if headers are used
      let rowData: Record<string, unknown> | undefined;
      if (useFirstRowAsHeaders && headerRow) {
        rowData = {};
        cells.forEach((cell, index) => {
          const header = headerRow![index] || `column_${index + 1}`;
          rowData![header] = cell.value;
        });
      }

      const jsonRow: IJsonRow = {
        rowNumber: rowNum,
        cells
      };

      if (rowData) {
        jsonRow.data = rowData;
      }

      rows.push(jsonRow);
    }

    const sheet: IJsonSheet = {
      name: worksheet.name,
      index: worksheet.id || 0,
      rows,
      totalRows: rows.length,
      totalColumns: maxColumns
    };

    if (headerRow) {
      sheet.headers = headerRow;
    }

    return sheet;
  }

  /**
   * Convert ExcelJS Cell to JSON
   */
  private static convertCellToJson(
    cell: ExcelJS.Cell,
    options: {
      includeFormatting: boolean;
      includeFormulas: boolean;
      datesAsISO: boolean;
    }
  ): IJsonCell {
    const { includeFormatting, includeFormulas, datesAsISO } = options;

    let value: unknown = cell.value;
    let type: string | undefined;

    // Determine type and convert value
    if (cell.type === ExcelJS.ValueType.Null || cell.value === null || cell.value === undefined) {
      value = null;
      type = 'null';
    } else if (cell.type === ExcelJS.ValueType.Number) {
      value = cell.value as number;
      type = 'number';
    } else if (cell.type === ExcelJS.ValueType.String) {
      value = cell.value as string;
      type = 'string';
    } else if (cell.type === ExcelJS.ValueType.Date) {
      const dateValue = cell.value as Date;
      value = datesAsISO ? dateValue.toISOString() : dateValue;
      type = 'date';
    } else if (cell.type === ExcelJS.ValueType.Boolean) {
      value = cell.value as boolean;
      type = 'boolean';
    } else if (cell.type === ExcelJS.ValueType.Formula) {
      if (includeFormulas && cell.formula) {
        value = cell.result || cell.value;
        type = 'formula';
      } else {
        value = cell.result || cell.value;
        type = typeof cell.result === 'number' ? 'number' : typeof cell.result === 'string' ? 'string' : 'unknown';
      }
    } else if (cell.type === ExcelJS.ValueType.Hyperlink) {
      // Handle hyperlink - ExcelJS stores hyperlinks as objects with text and hyperlink properties
      const hyperlinkValue = cell.value as { text?: string; hyperlink?: string } | string;
      if (typeof hyperlinkValue === 'object' && hyperlinkValue !== null) {
        value = hyperlinkValue.text || hyperlinkValue.hyperlink || cell.value;
      } else {
        value = hyperlinkValue;
      }
      type = 'hyperlink';
    } else {
      value = cell.value;
      type = 'unknown';
    }

    const jsonCell: IJsonCell = {
      value,
      type,
      reference: cell.address
    };

    // Add formatted value if requested
    if (includeFormatting && cell.numFmt) {
      // Try to get formatted value (ExcelJS doesn't always provide this easily)
      jsonCell.formattedValue = String(value);
    }

    // Add formula if requested
    if (includeFormulas && cell.formula) {
      jsonCell.formula = cell.formula;
    }

    // Add comment if exists
    if (cell.note) {
      // ExcelJS stores comments as Note objects or strings
      const note = cell.note;
      if (typeof note === 'string') {
        jsonCell.comment = note;
      } else if (note && typeof note === 'object' && 'texts' in note) {
        // Note object with texts array
        const texts = (note as any).texts;
        if (Array.isArray(texts) && texts.length > 0) {
          jsonCell.comment = texts.map((t: any) => t.text || '').join('');
        }
      } else if (note && typeof note === 'object' && 'text' in note) {
        jsonCell.comment = String((note as any).text);
      }
    }

    return jsonCell;
  }

  /**
   * Convert workbook to detailed format (with position information)
   */
  private static convertToDetailedFormat(
    workbook: ExcelJS.Workbook,
    options: IExcelReaderOptions
  ): IDetailedFormat {
    const {
      includeEmptyRows = false,
      includeFormatting = false,
      includeFormulas = false,
      datesAsISO = true,
      sheetName,
      startRow = 1,
      endRow,
      startColumn = 1,
      endColumn
    } = options;

    const cells: IDetailedCell[] = [];

    // Get metadata
    const metadata = {
      title: workbook.title,
      author: workbook.creator,
      company: workbook.company,
      created: workbook.created,
      modified: workbook.modified,
      description: workbook.description
    };

    // Filter sheets
    let sheetsToProcess: ExcelJS.Worksheet[] = [];
    
    if (sheetName !== undefined) {
      if (typeof sheetName === 'number') {
        const sheet = workbook.worksheets[sheetName];
        if (sheet) sheetsToProcess.push(sheet);
      } else {
        const sheet = workbook.getWorksheet(sheetName);
        if (sheet) sheetsToProcess.push(sheet);
      }
    } else {
      sheetsToProcess = workbook.worksheets;
    }

    // Process each sheet
    for (const worksheet of sheetsToProcess) {
      const actualStartRow = Math.max(startRow, 1);
      const actualEndRow = endRow || worksheet.rowCount || worksheet.lastRow?.number || 1;
      const actualStartCol = Math.max(startColumn, 1);
      const actualEndCol = endColumn || worksheet.columnCount || worksheet.lastColumn?.number || 1;

      for (let rowNum = actualStartRow; rowNum <= actualEndRow; rowNum++) {
        const excelRow = worksheet.getRow(rowNum);

        for (let colNum = actualStartCol; colNum <= actualEndCol; colNum++) {
          const cell = excelRow.getCell(colNum);

          // Skip empty cells if configured
          if (!cell.value && !includeEmptyRows) {
            continue;
          }

          // Convert column number to letter (1 = A, 2 = B, etc.)
          const columnLetter = this.numberToColumnLetter(colNum);
          const cellValue = this.getCellValue(cell, { includeFormatting, includeFormulas, datesAsISO });

          const detailedCell: IDetailedCell = {
            value: cellValue.value,
            text: String(cellValue.value ?? ''),
            column: colNum,
            columnLetter,
            row: rowNum,
            reference: cell.address || `${columnLetter}${rowNum}`,
            sheet: worksheet.name
          };

          if (cellValue.type) {
            detailedCell.type = cellValue.type;
          }
          if (cellValue.formattedValue) {
            detailedCell.formattedValue = cellValue.formattedValue;
          }
          if (cellValue.formula) {
            detailedCell.formula = cellValue.formula;
          }

          // Add comment if exists
          if (cell.note) {
            const note = cell.note;
            if (typeof note === 'string') {
              detailedCell.comment = note;
            } else if (note && typeof note === 'object' && 'texts' in note) {
              // Note object with texts array
              const texts = (note as any).texts;
              if (Array.isArray(texts) && texts.length > 0) {
                detailedCell.comment = texts.map((t: any) => t.text || '').join('');
              }
            } else if (note && typeof note === 'object' && 'text' in note) {
              detailedCell.comment = String((note as any).text);
            }
          }

          cells.push(detailedCell);
        }
      }
    }

    const result: IDetailedFormat = {
      cells,
      totalCells: cells.length
    };

    const hasMetadata = Object.values(metadata).some(val => val !== undefined && val !== null);
    if (hasMetadata) {
      result.metadata = metadata;
    }

    return result;
  }

  /**
   * Convert workbook to flat format (just data)
   */
  private static convertToFlatFormat(
    workbook: ExcelJS.Workbook,
    options: IExcelReaderOptions
  ): IFlatFormat | IFlatFormatMultiSheet {
    const {
      useFirstRowAsHeaders = false,
      includeEmptyRows = false,
      sheetName,
      startRow = 1,
      endRow,
      startColumn = 1,
      endColumn
    } = options;

    // Get metadata
    const metadata = {
      title: workbook.title,
      author: workbook.creator,
      company: workbook.company,
      created: workbook.created,
      modified: workbook.modified,
      description: workbook.description
    };

    // Filter sheets
    let sheetsToProcess: ExcelJS.Worksheet[] = [];
    
    if (sheetName !== undefined) {
      if (typeof sheetName === 'number') {
        const sheet = workbook.worksheets[sheetName];
        if (sheet) sheetsToProcess.push(sheet);
      } else {
        const sheet = workbook.getWorksheet(sheetName);
        if (sheet) sheetsToProcess.push(sheet);
      }
    } else {
      sheetsToProcess = workbook.worksheets;
    }

    // If single sheet, return single format
    if (sheetsToProcess.length === 1) {
      const worksheet = sheetsToProcess[0]!;
      const flatOptions: {
        useFirstRowAsHeaders: boolean;
        includeEmptyRows: boolean;
        startRow: number;
        endRow?: number;
        startColumn?: number;
        endColumn?: number;
      } = {
        useFirstRowAsHeaders,
        includeEmptyRows,
        startRow
      };

      if (endRow !== undefined) {
        flatOptions.endRow = endRow;
      }
      if (startColumn !== undefined) {
        flatOptions.startColumn = startColumn;
      }
      if (endColumn !== undefined) {
        flatOptions.endColumn = endColumn;
      }

      const flatData = this.convertSheetToFlat(worksheet, flatOptions);
      return flatData;
    }

    // Multiple sheets - return multi-sheet format
    const sheets: Record<string, IFlatFormat> = {};
    
    for (const worksheet of sheetsToProcess) {
      const flatOptions: {
        useFirstRowAsHeaders: boolean;
        includeEmptyRows: boolean;
        startRow: number;
        endRow?: number;
        startColumn?: number;
        endColumn?: number;
      } = {
        useFirstRowAsHeaders,
        includeEmptyRows,
        startRow
      };

      if (endRow !== undefined) {
        flatOptions.endRow = endRow;
      }
      if (startColumn !== undefined) {
        flatOptions.startColumn = startColumn;
      }
      if (endColumn !== undefined) {
        flatOptions.endColumn = endColumn;
      }

      const flatData = this.convertSheetToFlat(worksheet, flatOptions);
      sheets[worksheet.name] = flatData;
    }

    const result: IFlatFormatMultiSheet = {
      sheets,
      totalSheets: Object.keys(sheets).length
    };

    const hasMetadata = Object.values(metadata).some(val => val !== undefined && val !== null);
    if (hasMetadata) {
      result.metadata = metadata;
    }

    return result;
  }

  /**
   * Convert a single sheet to flat format
   */
  private static convertSheetToFlat(
    worksheet: ExcelJS.Worksheet,
    options: {
      useFirstRowAsHeaders: boolean;
      includeEmptyRows: boolean;
      startRow: number;
      endRow?: number;
      startColumn?: number;
      endColumn?: number;
    }
  ): IFlatFormat {
    const {
      useFirstRowAsHeaders,
      includeEmptyRows,
      startRow,
      endRow,
      startColumn,
      endColumn
    } = options;

    const actualStartRow = Math.max(startRow, 1);
    const actualEndRow = endRow || worksheet.rowCount || worksheet.lastRow?.number || 1;
    const actualStartCol = Math.max(startColumn || 1, 1);
    const actualEndCol = endColumn || worksheet.columnCount || worksheet.lastColumn?.number || 1;

    const data: Array<Record<string, unknown> | unknown[]> = [];
    let headers: string[] | undefined;

    // Get headers if needed
    if (useFirstRowAsHeaders) {
      const headerRow = worksheet.getRow(actualStartRow);
      headers = [];
      for (let colNum = actualStartCol; colNum <= actualEndCol; colNum++) {
        const cell = headerRow.getCell(colNum);
        headers.push(String(cell.value || `Column${colNum}`));
      }
    }

    // Process data rows
    const dataStartRow = useFirstRowAsHeaders ? actualStartRow + 1 : actualStartRow;
    
    for (let rowNum = dataStartRow; rowNum <= actualEndRow; rowNum++) {
      const excelRow = worksheet.getRow(rowNum);
      const rowValues: unknown[] = [];
      let hasData = false;

      for (let colNum = actualStartCol; colNum <= actualEndCol; colNum++) {
        const cell = excelRow.getCell(colNum);
        const cellValue = this.getCellValue(cell, { includeFormatting: false, includeFormulas: false, datesAsISO: true });
        rowValues.push(cellValue.value);
        if (cellValue.value !== null && cellValue.value !== undefined && cellValue.value !== '') {
          hasData = true;
        }
      }

      if (!hasData && !includeEmptyRows) {
        continue;
      }

      if (useFirstRowAsHeaders && headers) {
        // Convert to object
        const rowObject: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          rowObject[header] = rowValues[index];
        });
        data.push(rowObject);
      } else {
        // Keep as array
        data.push(rowValues);
      }
    }

    const result: IFlatFormat = {
      data,
      totalRows: data.length,
      sheet: worksheet.name
    };

    if (headers) {
      result.headers = headers;
    }

    return result;
  }

  /**
   * Get cell value with type information
   */
  private static getCellValue(
    cell: ExcelJS.Cell,
    options: {
      includeFormatting: boolean;
      includeFormulas: boolean;
      datesAsISO: boolean;
    }
  ): {
    value: unknown;
    type?: string;
    formattedValue?: string;
    formula?: string;
  } {
    const { includeFormatting, includeFormulas, datesAsISO } = options;

    let value: unknown = cell.value;
    let type: string | undefined;
    let formattedValue: string | undefined;
    let formula: string | undefined;

    if (cell.type === ExcelJS.ValueType.Null || cell.value === null || cell.value === undefined) {
      value = null;
      type = 'null';
    } else if (cell.type === ExcelJS.ValueType.Number) {
      value = cell.value as number;
      type = 'number';
    } else if (cell.type === ExcelJS.ValueType.String) {
      value = cell.value as string;
      type = 'string';
    } else if (cell.type === ExcelJS.ValueType.Date) {
      const dateValue = cell.value as Date;
      value = datesAsISO ? dateValue.toISOString() : dateValue;
      type = 'date';
    } else if (cell.type === ExcelJS.ValueType.Boolean) {
      value = cell.value as boolean;
      type = 'boolean';
    } else if (cell.type === ExcelJS.ValueType.Formula) {
      if (includeFormulas && cell.formula) {
        formula = cell.formula;
        value = cell.result || cell.value;
        type = 'formula';
      } else {
        value = cell.result || cell.value;
        type = typeof cell.result === 'number' ? 'number' : typeof cell.result === 'string' ? 'string' : 'unknown';
      }
    } else if (cell.type === ExcelJS.ValueType.Hyperlink) {
      const hyperlinkValue = cell.value as { text?: string; hyperlink?: string } | string;
      if (typeof hyperlinkValue === 'object' && hyperlinkValue !== null) {
        value = hyperlinkValue.text || hyperlinkValue.hyperlink || cell.value;
      } else {
        value = hyperlinkValue;
      }
      type = 'hyperlink';
    } else {
      value = cell.value;
      type = 'unknown';
    }

    if (includeFormatting && cell.numFmt) {
      formattedValue = String(value);
    }

    return {
      value,
      type,
      ...(formattedValue && { formattedValue }),
      ...(formula && { formula })
    };
  }

  /**
   * Convert column number to letter (1 = A, 2 = B, 27 = AA, etc.)
   */
  private static numberToColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }
}
