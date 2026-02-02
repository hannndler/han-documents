/**
 * Types for Excel Reader functionality
 */

import { Result, ISuccessResult, IErrorResult } from './core.types';

/**
 * Output format types
 */
export enum OutputFormat {
  /** Format by worksheet (structured with sheets, rows, cells) */
  WORKSHEET = 'worksheet',
  /** Detailed format with text, column, row information */
  DETAILED = 'detailed',
  /** Flat format - just the data without structure */
  FLAT = 'flat'
}

/**
 * Mapper function types for different output formats
 */
export type WorksheetMapper = (data: IJsonWorkbook) => unknown;
export type DetailedMapper = (data: IDetailedFormat) => unknown;
export type FlatMapper = (data: IFlatFormat | IFlatFormatMultiSheet) => unknown;

/**
 * Base options for reading Excel files
 */
interface IBaseExcelReaderOptions {
  /** Whether to include empty rows */
  includeEmptyRows?: boolean;
  /** Whether to use first row as headers */
  useFirstRowAsHeaders?: boolean;
  /** Custom headers mapping (column index -> header name) */
  headers?: string[] | Record<number, string>;
  /** Sheet name or index to read (if not specified, reads all sheets) */
  sheetName?: string | number;
  /** Starting row (1-based, default: 1) */
  startRow?: number;
  /** Ending row (1-based, if not specified, reads until end) */
  endRow?: number;
  /** Starting column (1-based, default: 1) */
  startColumn?: number;
  /** Ending column (1-based, if not specified, reads until end) */
  endColumn?: number;
  /** Whether to include cell formatting information */
  includeFormatting?: boolean;
  /** Whether to include formulas */
  includeFormulas?: boolean;
  /** Date format for date cells */
  dateFormat?: string;
  /** Whether to convert dates to ISO strings */
  datesAsISO?: boolean;
}

/**
 * Options for reading Excel files with worksheet format
 */
export interface IExcelReaderWorksheetOptions extends IBaseExcelReaderOptions {
  /** Output format - worksheet */
  outputFormat?: OutputFormat.WORKSHEET | 'worksheet';
  /** Mapper function to transform the response data */
  mapper?: WorksheetMapper;
}

/**
 * Options for reading Excel files with detailed format
 */
export interface IExcelReaderDetailedOptions extends IBaseExcelReaderOptions {
  /** Output format - detailed */
  outputFormat: OutputFormat.DETAILED | 'detailed';
  /** Mapper function to transform the response data */
  mapper?: DetailedMapper;
}

/**
 * Options for reading Excel files with flat format
 */
export interface IExcelReaderFlatOptions extends IBaseExcelReaderOptions {
  /** Output format - flat */
  outputFormat: OutputFormat.FLAT | 'flat';
  /** Mapper function to transform the response data */
  mapper?: FlatMapper;
}

/**
 * Type helper to extract output format from options
 */
export type ExtractOutputFormat<T> = 
  T extends IExcelReaderDetailedOptions
    ? OutputFormat.DETAILED
    : T extends IExcelReaderFlatOptions
    ? OutputFormat.FLAT
    : OutputFormat.WORKSHEET;

/**
 * Options for reading Excel files
 */
export type IExcelReaderOptions = 
  | IExcelReaderWorksheetOptions 
  | IExcelReaderDetailedOptions 
  | IExcelReaderFlatOptions;

/**
 * Cell data in JSON format
 */
export interface IJsonCell {
  /** Cell value */
  value: unknown;
  /** Cell type */
  type?: string;
  /** Cell reference (e.g., A1) */
  reference?: string;
  /** Formatted value (if includeFormatting is true) */
  formattedValue?: string;
  /** Formula (if includeFormulas is true) */
  formula?: string;
  /** Cell comment */
  comment?: string;
}

/**
 * Row data in JSON format
 */
export interface IJsonRow {
  /** Row number (1-based) */
  rowNumber: number;
  /** Cells in the row */
  cells: IJsonCell[];
  /** Row as object (if useFirstRowAsHeaders is true) */
  data?: Record<string, unknown>;
}

/**
 * Sheet data in JSON format
 */
export interface IJsonSheet {
  /** Sheet name */
  name: string;
  /** Sheet index */
  index: number;
  /** Rows in the sheet */
  rows: IJsonRow[];
  /** Headers (if useFirstRowAsHeaders is true) */
  headers?: string[];
  /** Total number of rows */
  totalRows: number;
  /** Total number of columns */
  totalColumns: number;
}

/**
 * Workbook data in JSON format
 */
export interface IJsonWorkbook {
  /** Workbook metadata */
  metadata?: {
    title?: string;
    author?: string;
    company?: string;
    created?: Date | string;
    modified?: Date | string;
    description?: string;
  };
  /** Sheets in the workbook */
  sheets: IJsonSheet[];
  /** Total number of sheets */
  totalSheets: number;
}

/**
 * Detailed cell format - includes position information
 */
export interface IDetailedCell {
  /** Cell value */
  value: unknown;
  /** Cell text (string representation) */
  text: string;
  /** Column number (1-based) */
  column: number;
  /** Column letter (e.g., A, B, C) */
  columnLetter: string;
  /** Row number (1-based) */
  row: number;
  /** Cell reference (e.g., A1) */
  reference: string;
  /** Sheet name */
  sheet: string;
  /** Cell type */
  type?: string;
  /** Formatted value (if includeFormatting is true) */
  formattedValue?: string;
  /** Formula (if includeFormulas is true) */
  formula?: string;
  /** Cell comment */
  comment?: string;
}

/**
 * Detailed format result - array of cells with position
 */
export interface IDetailedFormat {
  /** Array of all cells with detailed information */
  cells: IDetailedCell[];
  /** Total number of cells */
  totalCells: number;
  /** Workbook metadata */
  metadata?: {
    title?: string;
    author?: string;
    company?: string;
    created?: Date | string;
    modified?: Date | string;
    description?: string;
  };
}

/**
 * Flat format result - just the data values
 */
export interface IFlatFormat {
  /** Array of row data (as objects if useFirstRowAsHeaders is true, or as arrays) */
  data: Array<Record<string, unknown> | unknown[]>;
  /** Headers (if useFirstRowAsHeaders is true) */
  headers?: string[];
  /** Sheet name */
  sheet?: string;
  /** Total number of rows */
  totalRows: number;
}

/**
 * Flat format result for multiple sheets
 */
export interface IFlatFormatMultiSheet {
  /** Data organized by sheet name */
  sheets: Record<string, IFlatFormat>;
  /** Total number of sheets */
  totalSheets: number;
  /** Workbook metadata */
  metadata?: {
    title?: string;
    author?: string;
    company?: string;
    created?: Date | string;
    modified?: Date | string;
    description?: string;
  };
}

/**
 * Success result with processing time for detailed format
 */
export interface IDetailedSuccessResult extends ISuccessResult<IDetailedFormat> {
  processingTime?: number;
}

/**
 * Success result with processing time for flat format
 */
export interface IFlatSuccessResult extends ISuccessResult<IFlatFormat | IFlatFormatMultiSheet> {
  processingTime?: number;
}

/**
 * Success result with processing time for worksheet format
 */
export interface IWorksheetSuccessResult extends ISuccessResult<IJsonWorkbook> {
  processingTime?: number;
}

/**
 * Error result with processing time
 */
export interface IErrorResultWithTime extends IErrorResult {
  processingTime?: number;
}

/**
 * Reader result - generic type based on output format
 * This type ensures TypeScript correctly infers the data type based on the output format
 * 
 * Using explicit interfaces instead of intersections to preserve discriminated union structure
 */
export type ExcelReaderResult<T extends OutputFormat = OutputFormat.WORKSHEET> = 
  T extends OutputFormat.DETAILED
    ? IDetailedSuccessResult | IErrorResultWithTime
    : T extends OutputFormat.FLAT
    ? IFlatSuccessResult | IErrorResultWithTime
    : IWorksheetSuccessResult | IErrorResultWithTime;

/**
 * Legacy reader result (for backward compatibility)
 */
export type IExcelReaderResult = Result<IJsonWorkbook> & {
  /** Processing time in milliseconds */
  processingTime?: number;
}

