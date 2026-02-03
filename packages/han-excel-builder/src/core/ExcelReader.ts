/**
 * ExcelReader - Class for reading Excel files and converting them to JSON
 */

import * as ExcelJS from "exceljs";
import {
  Result,
  success,
  error,
  ErrorType as CoreErrorType,
} from "@hannndler/core";
import {
  IExcelReaderOptions,
  IExcelReaderDetailedOptions,
  IExcelReaderFlatOptions,
  IExcelReaderWorksheetOptions,
  IJsonWorkbook,
  IJsonSheet,
  IJsonRow,
  IJsonCell,
  OutputFormat,
  IDetailedFormat,
  IUnifiedFormat,
  IDetailedCell,
  IFlatFormat,
  IFlatFormatMultiSheet,
  ExcelReaderResult,
  ExcelReaderUnifiedResult,
  ExcelReaderDetailedResult,
  ExcelReaderFlatResult,
  ExcelReaderWorksheetResult,
} from "../types/reader.types";
import { ErrorType, IErrorResult } from "../types/compat.types";

/**
 * ExcelReader class for reading Excel files and converting to JSON
 *
 * @example
 * ```typescript
 * // Using instance methods
 * const reader = new ExcelReader({
 *   outputFormat: OutputFormat.FLAT,
 *   useFirstRowAsHeaders: true
 * });
 *
 * const result = await reader.fromBuffer(arrayBuffer);
 *
 * // Using static methods (convenience)
 * const result2 = await ExcelReader.fromBuffer(arrayBuffer, { outputFormat: OutputFormat.DETAILED });
 * ```
 */
export class ExcelReader {
  private defaultOptions: IExcelReaderOptions;

  /**
   * Creates a new ExcelReader instance with default options
   *
   * @param defaultOptions - Default options to use for all read operations
   */
  constructor(defaultOptions: IExcelReaderOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Helper to create error result with correct typing
   */
  private createErrorResult<T extends OutputFormat>(
    errorType: CoreErrorType,
    message: string,
    code: string,
    details?: Record<string, unknown>,
    processingTime: number = 0,
  ): ExcelReaderResult<T> {
    const errorResult = error(errorType, message, code, details);
    return {
      ...errorResult,
      processingTime,
    } as ExcelReaderResult<T>;
  }

  /**
   * Read Excel file from Node.js Buffer or ArrayBuffer
   *
   * @param buffer - Node.js Buffer (preferred) or ArrayBuffer
   * @param options - Reading options
   * @returns Promise with the read result
   *
   * @example
   * ```typescript
   * // With detailed format - TypeScript knows the result type
   * const result = await reader.fromBuffer(buffer, {
   *   outputFormat: OutputFormat.DETAILED
   * });
   * if (result.success) {
   *   result.data.cells; // TypeScript knows this is IDetailedFormat
   * }
   *
   * // With Node.js Buffer (from multer, fs, etc.)
   * const result = await reader.fromBuffer(req.file.buffer);
   * ```
   */
  async fromBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderDetailedResult>;
  async fromBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderFlatResult>;
  async fromBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderWorksheetResult>;
  async fromBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any, // Node.js Buffer (preferred) or ArrayBuffer
    options?: IExcelReaderOptions,
  ): Promise<ExcelReaderResult<T>>;

  async fromBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any, // Node.js Buffer (preferred) or ArrayBuffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any = {}, // Accept any to work with overloads
  ): Promise<ExcelReaderResult<T>> {
    // Merge options - TypeScript needs help inferring the combined type
    const mergedOptions: IExcelReaderOptions = {
      ...this.defaultOptions,
      ...options,
    } as IExcelReaderOptions;
    const startTime = Date.now();

    try {
      const workbook = new ExcelJS.Workbook();
      // ExcelJS can accept Buffer directly, but we ensure it's in the right format
      // Convert Buffer to ArrayBuffer if needed (for compatibility)
      // If buffer has a .buffer property, it's a Node.js Buffer/Uint8Array
      // Otherwise, assume it's already an ArrayBuffer
      const arrayBuffer = buffer.buffer
        ? buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          )
        : buffer;
      await workbook.xlsx.load(arrayBuffer);

      const outputFormat = (mergedOptions.outputFormat ||
        OutputFormat.WORKSHEET) as OutputFormat;
      const processingTime = Date.now() - startTime;

      let result:
        | IDetailedFormat
        | IFlatFormat
        | IFlatFormatMultiSheet
        | IJsonWorkbook;

      switch (outputFormat) {
        case OutputFormat.DETAILED:
          result = this.convertToDetailedFormat(workbook, mergedOptions);
          break;
        case OutputFormat.FLAT:
          result = this.convertToFlatFormat(workbook, mergedOptions);
          break;
        case OutputFormat.WORKSHEET:
        default:
          result = this.convertWorkbookToJson(workbook, mergedOptions);
          break;
      }

      // Apply mapper function if provided
      if (mergedOptions.mapper) {
        try {
          // Apply mapper based on output format
          switch (outputFormat) {
            case OutputFormat.DETAILED:
              result = (
                mergedOptions.mapper as (data: IDetailedFormat) => unknown
              )(result as IDetailedFormat) as IDetailedFormat;
              break;
            case OutputFormat.FLAT:
              result = (
                mergedOptions.mapper as (
                  data: IFlatFormat | IFlatFormatMultiSheet,
                ) => unknown
              )(result as IFlatFormat | IFlatFormatMultiSheet) as
                | IFlatFormat
                | IFlatFormatMultiSheet;
              break;
            case OutputFormat.WORKSHEET:
            default:
              result = (
                mergedOptions.mapper as (data: IJsonWorkbook) => unknown
              )(result as IJsonWorkbook) as IJsonWorkbook;
              break;
          }
        } catch (mapperError) {
          return this.createErrorResult<T>(
            CoreErrorType.VALIDATION_ERROR,
            mapperError instanceof Error
              ? `Mapper function error: ${mapperError.message}`
              : "Error in mapper function",
            "MAPPER_ERROR",
            { originalError: mapperError },
            Date.now() - startTime,
          );
        }
      }

      // Create success result with correct type based on outputFormat
      // We need to preserve the discriminated union structure for TypeScript
      switch (outputFormat) {
        case OutputFormat.DETAILED: {
          // Wrap in unified payload so declarations expose all formats
          const unified: IUnifiedFormat = {
            detailed: result as IDetailedFormat,
          };
          const successResult = success(unified);
          return {
            ...successResult,
            processingTime,
          } as ExcelReaderResult<T>;
        }
        case OutputFormat.FLAT: {
          const unified: IUnifiedFormat = {
            flat: result as IFlatFormat | IFlatFormatMultiSheet,
          };
          const successResult = success(unified);
          return {
            ...successResult,
            processingTime,
          } as ExcelReaderResult<T>;
        }
        case OutputFormat.WORKSHEET:
        default: {
          const unified: IUnifiedFormat = { workbook: result as IJsonWorkbook };
          const successResult = success(unified);
          return {
            ...successResult,
            processingTime,
          } as ExcelReaderResult<T>;
        }
      }
    } catch (err: any) {
      return this.createErrorResult<T>(
        CoreErrorType.FILE_ERROR,
        err.message || "Failed to read Excel file",
        "READ_FAILED",
        { originalError: err },
        Date.now() - startTime,
      );
    }
  }

  /**
   * Read Excel file from Blob
   */
  async fromBlob(
    blob: Blob,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  async fromBlob(
    blob: Blob,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  async fromBlob(
    blob: Blob,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  async fromBlob<T extends OutputFormat = OutputFormat.WORKSHEET>(
    blob: Blob,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    const arrayBuffer = await blob.arrayBuffer();
    // fromBuffer can handle both Buffer and ArrayBuffer
    // We pass ArrayBuffer directly, and fromBuffer will convert it if needed
    // Use type assertion to help TypeScript with overload resolution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.fromBuffer(arrayBuffer, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Read Excel file from File (browser)
   */
  async fromFile(
    file: File,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  async fromFile(
    file: File,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  async fromFile(
    file: File,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  async fromFile<T extends OutputFormat = OutputFormat.WORKSHEET>(
    file: File,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.fromBlob(file, options as any) as Promise<ExcelReaderResult<T>>;
  }

  /**
   * Read Excel file from Node.js Buffer (Node.js only)
   * Useful when receiving files from multer or other Node.js file upload libraries
   * Note: This method only works in Node.js environment
   * @deprecated Use fromBuffer() directly, as it now accepts Buffer
   */
  async fromNodeBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  async fromNodeBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  async fromNodeBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  async fromNodeBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any, // Node.js Buffer type (available in Node.js runtime)
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    // fromBuffer now accepts Buffer directly, so we just call it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.fromBuffer(buffer, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Convenience static method that always returns the unified payload
   * for Blob input.
   */
  static async fromBlobUnified(
    blob: Blob,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderUnifiedResult> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromBlob(
      blob,
      options as any,
    ) as Promise<ExcelReaderUnifiedResult>;
  }

  /**
   * Read Excel file from path (Node.js only)
   * Note: This method only works in Node.js environment
   */
  async fromPath(
    filePath: string,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  async fromPath(
    filePath: string,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  async fromPath(
    filePath: string,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  async fromPath<T extends OutputFormat = OutputFormat.WORKSHEET>(
    filePath: string,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    try {
      // Dynamic import - only loads fs in Node.js environment
      // This allows the code to work in both browser and Node.js
      const fs = await import("fs/promises");
      const buffer = await fs.readFile(filePath);
      // fromBuffer now accepts Buffer directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.fromBuffer(buffer, options as any) as Promise<
        ExcelReaderResult<T>
      >;
    } catch (err: any) {
      // Check if error is because fs is not available (browser environment)
      const isBrowserError =
        err instanceof Error &&
        (err.message.includes("Cannot find module") ||
          err.message.includes("fs") ||
          typeof window !== "undefined");

      return this.createErrorResult<T>(
        CoreErrorType.FILE_ERROR,
        isBrowserError
          ? "fromPath() method requires Node.js environment. Use fromFile() or fromBlob() in browser."
          : err.message || "Error reading file from path",
        "PATH_READ_FAILED",
        { originalError: err },
        0,
      );
    }
  }

  /**
   * Static method: Read Excel file from Node.js Buffer or ArrayBuffer (convenience method)
   */
  static async fromBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderDetailedResult>;
  static async fromBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderFlatResult>;
  static async fromBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderWorksheetResult>;
  static async fromBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options?: IExcelReaderOptions,
  ): Promise<ExcelReaderResult<T>>;
  static async fromBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any, // Node.js Buffer (preferred) or ArrayBuffer
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromBuffer(buffer, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Convenience static method that always returns the unified payload
   * exposing `workbook`, `detailed` and `flat` optionally.
   */
  static async fromBufferUnified(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderUnifiedResult> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromBuffer(
      buffer,
      options as any,
    ) as Promise<ExcelReaderUnifiedResult>;
  }

  /**
   * Static method: Read Excel file from Blob (convenience method)
   */
  static async fromBlob(
    blob: Blob,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  static async fromBlob(
    blob: Blob,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  static async fromBlob(
    blob: Blob,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  static async fromBlob<T extends OutputFormat = OutputFormat.WORKSHEET>(
    blob: Blob,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromBlob(blob, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Static method: Read Excel file from File (convenience method)
   */
  static async fromFile(
    file: File,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  static async fromFile(
    file: File,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  static async fromFile(
    file: File,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  static async fromFile<T extends OutputFormat = OutputFormat.WORKSHEET>(
    file: File,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromFile(file, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Convenience static method that always returns the unified payload
   * for File input.
   */
  static async fromFileUnified(
    file: File,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderUnifiedResult> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromFile(
      file,
      options as any,
    ) as Promise<ExcelReaderUnifiedResult>;
  }

  /**
   * Static method: Read Excel file from Node.js Buffer (convenience method)
   * @deprecated Use fromBuffer() directly, as it now accepts Buffer
   */
  static async fromNodeBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  static async fromNodeBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  static async fromNodeBuffer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  static async fromNodeBuffer<T extends OutputFormat = OutputFormat.WORKSHEET>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any, // Node.js Buffer type (available in Node.js runtime)
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromBuffer(buffer, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Convenience static method that always returns the unified payload
   * for Node Buffer input.
   */
  static async fromNodeBufferUnified(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderUnifiedResult> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromBuffer(
      buffer,
      options as any,
    ) as Promise<ExcelReaderUnifiedResult>;
  }

  /**
   * Static method: Read Excel file from path (convenience method)
   */
  static async fromPath(
    filePath: string,
    options: IExcelReaderDetailedOptions,
  ): Promise<ExcelReaderResult<OutputFormat.DETAILED>>;
  static async fromPath(
    filePath: string,
    options: IExcelReaderFlatOptions,
  ): Promise<ExcelReaderResult<OutputFormat.FLAT>>;
  static async fromPath(
    filePath: string,
    options?: IExcelReaderWorksheetOptions,
  ): Promise<ExcelReaderResult<OutputFormat.WORKSHEET>>;
  static async fromPath<T extends OutputFormat = OutputFormat.WORKSHEET>(
    filePath: string,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderResult<T>> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromPath(filePath, options as any) as Promise<
      ExcelReaderResult<T>
    >;
  }

  /**
   * Convenience static method that always returns the unified payload
   * for path input.
   */
  static async fromPathUnified(
    filePath: string,
    options: IExcelReaderOptions = {},
  ): Promise<ExcelReaderUnifiedResult> {
    const reader = new ExcelReader();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reader.fromPath(
      filePath,
      options as any,
    ) as Promise<ExcelReaderUnifiedResult>;
  }

  /**
   * Convert ExcelJS Workbook to JSON
   */
  private convertWorkbookToJson(
    workbook: ExcelJS.Workbook,
    options: IExcelReaderOptions,
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
      datesAsISO = true,
    } = options;

    // Get metadata
    const metadata = {
      title: workbook.title,
      author: workbook.creator,
      company: workbook.company,
      created: workbook.created,
      modified: workbook.modified,
      description: workbook.description,
    };

    // Filter sheets
    let sheetsToProcess: ExcelJS.Worksheet[] = [];

    if (sheetName !== undefined) {
      if (typeof sheetName === "number") {
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
        datesAsISO: datesAsISO ?? true,
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
      totalSheets: sheets.length,
    };

    // Only add metadata if it has at least one property
    const hasMetadata = Object.values(metadata).some(
      (val) => val !== undefined && val !== null,
    );
    if (hasMetadata) {
      workbookResult.metadata = metadata;
    }

    return workbookResult;
  }

  /**
   * Convert ExcelJS Worksheet to JSON
   */
  private convertSheetToJson(
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
    },
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
      datesAsISO,
    } = options;

    const rows: IJsonRow[] = [];
    let headerRow: string[] | undefined;
    let maxColumns = 0;

    // Determine row range
    const actualStartRow = Math.max(startRow, 1);
    const actualEndRow =
      endRow || worksheet.rowCount || worksheet.lastRow?.number || 1;
    const actualStartCol = Math.max(startColumn, 1);
    const actualEndCol =
      endColumn || worksheet.columnCount || worksheet.lastColumn?.number || 1;

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
          datesAsISO,
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
        headerRow = cells.map((cell) => {
          if (headers && Array.isArray(headers)) {
            return headers[cells.indexOf(cell)] || String(cell.value || "");
          } else if (headers && typeof headers === "object") {
            return (
              headers[actualStartCol + cells.indexOf(cell)] ||
              String(cell.value || "")
            );
          }
          return String(cell.value || "");
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
        cells,
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
      totalColumns: maxColumns,
    };

    if (headerRow) {
      sheet.headers = headerRow;
    }

    return sheet;
  }

  /**
   * Convert ExcelJS Cell to JSON
   */
  private convertCellToJson(
    cell: ExcelJS.Cell,
    options: {
      includeFormatting: boolean;
      includeFormulas: boolean;
      datesAsISO: boolean;
    },
  ): IJsonCell {
    const { includeFormatting, includeFormulas, datesAsISO } = options;

    let value: unknown = cell.value;
    let type: string | undefined;

    // Determine type and convert value
    if (
      cell.type === ExcelJS.ValueType.Null ||
      cell.value === null ||
      cell.value === undefined
    ) {
      value = null;
      type = "null";
    } else if (cell.type === ExcelJS.ValueType.Number) {
      value = cell.value as number;
      type = "number";
    } else if (cell.type === ExcelJS.ValueType.String) {
      value = cell.value as string;
      type = "string";
    } else if (cell.type === ExcelJS.ValueType.Date) {
      const dateValue = cell.value as Date;
      value = datesAsISO ? dateValue.toISOString() : dateValue;
      type = "date";
    } else if (cell.type === ExcelJS.ValueType.Boolean) {
      value = cell.value as boolean;
      type = "boolean";
    } else if (cell.type === ExcelJS.ValueType.Formula) {
      // Always try to get formula if includeFormulas is true
      if (includeFormulas) {
        value = cell.result || cell.value;
        type = "formula";
      } else {
        value = cell.result || cell.value;
        type =
          typeof cell.result === "number"
            ? "number"
            : typeof cell.result === "string"
              ? "string"
              : "unknown";
      }
    } else if (cell.type === ExcelJS.ValueType.Hyperlink) {
      // Handle hyperlink - ExcelJS stores hyperlinks as objects with text and hyperlink properties
      const hyperlinkValue = cell.value as
        | { text?: string; hyperlink?: string }
        | string;
      if (typeof hyperlinkValue === "object" && hyperlinkValue !== null) {
        value = hyperlinkValue.text || hyperlinkValue.hyperlink || cell.value;
      } else {
        value = hyperlinkValue;
      }
      type = "hyperlink";
    } else {
      value = cell.value;
      type = "unknown";
    }

    const jsonCell: IJsonCell = {
      value: value as string | number | boolean | Date | null,
      type,
      reference: cell.address,
    };

    // Add formatted value if requested - use cell.text which is the actual displayed text
    if (includeFormatting) {
      // cell.text is the formatted text as it appears in Excel
      jsonCell.formattedValue = cell.text || String(value);
    }

    // Add formula if requested
    if (includeFormulas) {
      // Try to get formula from cell
      if (cell.formula) {
        jsonCell.formula = cell.formula;
      } else if (cell.type === ExcelJS.ValueType.Formula) {
        // For formula cells, try to get formula from the cell
        jsonCell.formula = (cell as any).formula || undefined;
      }
    }

    // Add comment if exists
    if (cell.note) {
      // ExcelJS stores comments as Note objects or strings
      const note = cell.note;
      if (typeof note === "string") {
        jsonCell.comment = note;
      } else if (note && typeof note === "object" && "texts" in note) {
        // Note object with texts array
        const texts = (note as any).texts;
        if (Array.isArray(texts) && texts.length > 0) {
          jsonCell.comment = texts.map((t: any) => t.text || "").join("");
        }
      } else if (note && typeof note === "object" && "text" in note) {
        jsonCell.comment = String((note as any).text);
      }
    }

    return jsonCell;
  }

  /**
   * Convert workbook to detailed format (with position information)
   */
  private convertToDetailedFormat(
    workbook: ExcelJS.Workbook,
    options: IExcelReaderOptions,
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
      endColumn,
    } = options;

    const cells: IDetailedCell[] = [];

    // Get metadata
    const metadata = {
      title: workbook.title,
      author: workbook.creator,
      company: workbook.company,
      created: workbook.created,
      modified: workbook.modified,
      description: workbook.description,
    };

    // Filter sheets
    let sheetsToProcess: ExcelJS.Worksheet[] = [];

    if (sheetName !== undefined) {
      if (typeof sheetName === "number") {
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
      const actualEndRow =
        endRow || worksheet.rowCount || worksheet.lastRow?.number || 1;
      const actualStartCol = Math.max(startColumn, 1);
      const actualEndCol =
        endColumn || worksheet.columnCount || worksheet.lastColumn?.number || 1;

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
          const cellValue = this.getCellValue(cell, {
            includeFormatting,
            includeFormulas,
            datesAsISO,
          });

          // Get the formatted text from ExcelJS (this is the actual displayed text)
          const cellText = cell.text || String(cellValue.value ?? "");

          const detailedCell: IDetailedCell = {
            value: cellValue.value as string | number | boolean | Date | null,
            text: cellText,
            column: colNum,
            columnLetter,
            row: rowNum,
            reference: cell.address || `${columnLetter}${rowNum}`,
            sheet: worksheet.name,
          };

          // Always include type if available
          if (cellValue.type !== undefined) {
            detailedCell.type = cellValue.type;
          }
          // Include formattedValue if includeFormatting is true or if it exists
          if (includeFormatting && cellValue.formattedValue !== undefined) {
            detailedCell.formattedValue = cellValue.formattedValue;
          } else if (
            includeFormatting &&
            cellText !== String(cellValue.value ?? "")
          ) {
            // If formatting is requested and text differs from value, use text as formattedValue
            detailedCell.formattedValue = cellText;
          }
          // Include formula if includeFormulas is true and formula exists
          if (includeFormulas && cellValue.formula !== undefined) {
            detailedCell.formula = cellValue.formula;
          }

          // Add comment if exists
          if (cell.note) {
            const note = cell.note;
            if (typeof note === "string") {
              detailedCell.comment = note;
            } else if (note && typeof note === "object" && "texts" in note) {
              // Note object with texts array
              const texts = (note as any).texts;
              if (Array.isArray(texts) && texts.length > 0) {
                detailedCell.comment = texts
                  .map((t: any) => t.text || "")
                  .join("");
              }
            } else if (note && typeof note === "object" && "text" in note) {
              detailedCell.comment = String((note as any).text);
            }
          }

          cells.push(detailedCell);
        }
      }
    }

    const result: IDetailedFormat = {
      cells,
      totalCells: cells.length,
    };

    const hasMetadata = Object.values(metadata).some(
      (val) => val !== undefined && val !== null,
    );
    if (hasMetadata) {
      result.metadata = metadata;
    }

    return result;
  }

  /**
   * Convert workbook to flat format (just data)
   */
  private convertToFlatFormat(
    workbook: ExcelJS.Workbook,
    options: IExcelReaderOptions,
  ): IFlatFormat | IFlatFormatMultiSheet {
    const {
      useFirstRowAsHeaders = false,
      includeEmptyRows = false,
      sheetName,
      startRow = 1,
      endRow,
      startColumn = 1,
      endColumn,
    } = options;

    // Get metadata
    const metadata = {
      title: workbook.title,
      author: workbook.creator,
      company: workbook.company,
      created: workbook.created,
      modified: workbook.modified,
      description: workbook.description,
    };

    // Filter sheets
    let sheetsToProcess: ExcelJS.Worksheet[] = [];

    if (sheetName !== undefined) {
      if (typeof sheetName === "number") {
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
        startRow,
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
        startRow,
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
      totalSheets: Object.keys(sheets).length,
    };

    const hasMetadata = Object.values(metadata).some(
      (val) => val !== undefined && val !== null,
    );
    if (hasMetadata) {
      result.metadata = metadata;
    }

    return result;
  }

  /**
   * Convert a single sheet to flat format
   */
  private convertSheetToFlat(
    worksheet: ExcelJS.Worksheet,
    options: {
      useFirstRowAsHeaders: boolean;
      includeEmptyRows: boolean;
      startRow: number;
      endRow?: number;
      startColumn?: number;
      endColumn?: number;
    },
  ): IFlatFormat {
    const {
      useFirstRowAsHeaders,
      includeEmptyRows,
      startRow,
      endRow,
      startColumn,
      endColumn,
    } = options;

    const actualStartRow = Math.max(startRow, 1);
    const actualEndRow =
      endRow || worksheet.rowCount || worksheet.lastRow?.number || 1;
    const actualStartCol = Math.max(startColumn || 1, 1);
    const actualEndCol =
      endColumn || worksheet.columnCount || worksheet.lastColumn?.number || 1;

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
    const dataStartRow = useFirstRowAsHeaders
      ? actualStartRow + 1
      : actualStartRow;

    for (let rowNum = dataStartRow; rowNum <= actualEndRow; rowNum++) {
      const excelRow = worksheet.getRow(rowNum);
      const rowValues: unknown[] = [];
      let hasData = false;

      for (let colNum = actualStartCol; colNum <= actualEndCol; colNum++) {
        const cell = excelRow.getCell(colNum);
        const cellValue = this.getCellValue(cell, {
          includeFormatting: false,
          includeFormulas: false,
          datesAsISO: true,
        });
        rowValues.push(cellValue.value);
        if (
          cellValue.value !== null &&
          cellValue.value !== undefined &&
          cellValue.value !== ""
        ) {
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
      sheet: worksheet.name,
    };

    if (headers) {
      result.headers = headers;
    }

    return result;
  }

  /**
   * Get cell value with type information
   */
  private getCellValue(
    cell: ExcelJS.Cell,
    options: {
      includeFormatting: boolean;
      includeFormulas: boolean;
      datesAsISO: boolean;
    },
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

    if (
      cell.type === ExcelJS.ValueType.Null ||
      cell.value === null ||
      cell.value === undefined
    ) {
      value = null;
      type = "null";
    } else if (cell.type === ExcelJS.ValueType.Number) {
      value = cell.value as number;
      type = "number";
    } else if (cell.type === ExcelJS.ValueType.String) {
      value = cell.value as string;
      type = "string";
    } else if (cell.type === ExcelJS.ValueType.Date) {
      const dateValue = cell.value as Date;
      value = datesAsISO ? dateValue.toISOString() : dateValue;
      type = "date";
    } else if (cell.type === ExcelJS.ValueType.Boolean) {
      value = cell.value as boolean;
      type = "boolean";
    } else if (cell.type === ExcelJS.ValueType.Formula) {
      // Always try to get formula if includeFormulas is true
      if (includeFormulas) {
        formula = cell.formula || undefined;
        value = cell.result || cell.value;
        type = "formula";
      } else {
        value = cell.result || cell.value;
        type =
          typeof cell.result === "number"
            ? "number"
            : typeof cell.result === "string"
              ? "string"
              : "unknown";
      }
    } else if (includeFormulas && cell.formula) {
      // Some cells might have formulas even if type is not Formula
      formula = cell.formula;
    } else if (cell.type === ExcelJS.ValueType.Hyperlink) {
      const hyperlinkValue = cell.value as
        | { text?: string; hyperlink?: string }
        | string;
      if (typeof hyperlinkValue === "object" && hyperlinkValue !== null) {
        value = hyperlinkValue.text || hyperlinkValue.hyperlink || cell.value;
      } else {
        value = hyperlinkValue;
      }
      type = "hyperlink";
    } else {
      value = cell.value;
      type = "unknown";
    }

    // Get formatted value - use cell.text which is the actual displayed text in Excel
    if (includeFormatting) {
      // cell.text is the formatted text as it appears in Excel
      formattedValue = cell.text || String(value);
    }

    return {
      value,
      type,
      ...(formattedValue !== undefined && { formattedValue }),
      ...(formula !== undefined && { formula }),
    };
  }

  /**
   * Convert column number to letter (1 = A, 2 = B, 27 = AA, etc.)
   */
  private numberToColumnLetter(columnNumber: number): string {
    let result = "";
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }
}
