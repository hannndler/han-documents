/**
 * Core type definitions for Han Excel Builder
 * Adaptado para usar tipos compartidos de han-documents-core
 */

import { CellValue } from 'exceljs';
import { Color } from '@hannndler/core';
import { IWorkbookMetadata, Result, ErrorType, ISuccessResult, IErrorResult } from './compat.types';

// Re-export tipos compartidos
export type { Color, Result, IWorkbookMetadata, ISuccessResult, IErrorResult } from './compat.types';
export { ErrorType } from './compat.types';

/**
 * Supported cell data types
 */
export enum CellType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  LINK = 'link',
  FORMULA = 'formula'
}

/**
 * Number format options
 */
export enum NumberFormat {
  GENERAL = 'General',
  NUMBER = '#,##0',
  NUMBER_DECIMALS = '#,##0.00',
  CURRENCY = '$#,##0.00',
  CURRENCY_INTEGER = '$#,##0',
  PERCENTAGE = '0%',
  PERCENTAGE_DECIMALS = '0.00%',
  DATE = 'dd/mm/yyyy',
  DATE_TIME = 'dd/mm/yyyy hh:mm',
  TIME = 'hh:mm:ss',
  CUSTOM = 'custom'
}

/**
 * Horizontal alignment options
 */
export enum HorizontalAlignment {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  FILL = 'fill',
  JUSTIFY = 'justify',
  CENTER_CONTINUOUS = 'centerContinuous',
  DISTRIBUTED = 'distributed'
}

/**
 * Vertical alignment options
 */
export enum VerticalAlignment {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  DISTRIBUTED = 'distributed',
  JUSTIFY = 'justify'
}

/**
 * Border style options
 */
export enum BorderStyle {
  THIN = 'thin',
  MEDIUM = 'medium',
  THICK = 'thick',
  DOTTED = 'dotted',
  DASHED = 'dashed',
  DOUBLE = 'double',
  HAIR = 'hair',
  MEDIUM_DASHED = 'mediumDashed',
  DASH_DOT = 'dashDot',
  MEDIUM_DASH_DOT = 'mediumDashDot',
  DASH_DOT_DOT = 'dashDotDot',
  MEDIUM_DASH_DOT_DOT = 'mediumDashDotDot',
  SLANT_DASH_DOT = 'slantDashDot'
}

/**
 * Font style options
 */
export enum FontStyle {
  NORMAL = 'normal',
  BOLD = 'bold',
  ITALIC = 'italic',
  BOLD_ITALIC = 'bold italic'
}

/**
 * Base cell properties interface
 */
export interface IBaseCell {
  /** Unique identifier for the cell */
  key: string;
  /** Cell data type */
  type: CellType;
  /** Cell value */
  value: CellValue;
  /** Optional cell reference (e.g., A1, B2) */
  reference?: string;
  /** Whether to merge this cell with others */
  mergeCell?: boolean;
  /** Number of columns to merge (if mergeCell is true) */
  mergeTo?: number;
  /** Row height for this cell */
  rowHeight?: number;
  /** Column width for this cell */
  colWidth?: number;
  /** Whether to move to next row after this cell */
  jump?: boolean;
  /** Hyperlink URL */
  link?: string;
  /** Text mask for hyperlink (displayed text when link is present) */
  mask?: string;
  /** Excel formula */
  formula?: string;
  /** Number format for numeric cells */
  numberFormat?: NumberFormat | string;
  /** Custom number format string */
  customNumberFormat?: string;
  /** Whether the cell is protected */
  protected?: boolean;
  /** Whether the cell is hidden */
  hidden?: boolean;
  /** Cell comment */
  comment?: string;
  /** Data validation rules */
  validation?: IDataValidation;
  /** Optional styles for the cell */
  styles?: import('./style.types').IStyle;
  /** Predefined style name (references a style added via addCellStyle) */
  styleName?: string;
  /** Legacy children cells */
  childrens?: IBaseCell[];
  /** Modern children cells */
  children?: IBaseCell[];
}

/**
 * Data validation interface
 */
export interface IDataValidation {
  /** Validation type */
  type: 'list' | 'whole' | 'decimal' | 'textLength' | 'date' | 'time' | 'custom';
  /** Validation operator */
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
  /** Validation formula or values */
  formula1?: string | number | Date;
  /** Second validation formula or value (for between/notBetween) */
  formula2?: string | number | Date;
  /** Whether to show error message */
  showErrorMessage?: boolean;
  /** Error message text */
  errorMessage?: string;
  /** Whether to show input message */
  showInputMessage?: boolean;
  /** Input message text */
  inputMessage?: string;
  /** Whether to allow blank values */
  allowBlank?: boolean;
}

