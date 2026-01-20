/**
 * Cell-specific type definitions
 */

import { IBaseCell } from './core.types';
import type { CellValue } from 'exceljs';

/**
 * Header cell interface
 */
export interface IHeaderCell extends IBaseCell {
  /** Reference to parent header key */
  mainHeaderKey?: string;
  /** Child headers */
  children?: IHeaderCell[];
  /** Whether this is a main header */
  isMainHeader?: boolean;
  /** Header level (1 = main, 2 = sub, etc.) */
  level?: number;
}

/**
 * Data cell interface
 */
export interface IDataCell extends IBaseCell {
  /** Reference to header key */
  header: string;
  /** Reference to main header key */
  mainHeaderKey?: string;
  /** Child data cells */
  children?: IDataCell[];
  /** Whether this cell has alternating row color */
  striped?: boolean;
  /** Row index */
  rowIndex?: number;
  /** Column index */
  colIndex?: number;
}

/**
 * Footer cell interface
 */
export interface IFooterCell extends IBaseCell {
  /** Reference to header key */
  header: string;
  /** Child footer cells */
  children?: IDataCell[];
  /** Whether this is a total row */
  isTotal?: boolean;
  /** Footer type */
  footerType?: 'total' | 'subtotal' | 'average' | 'count' | 'custom';
}

/**
 * Cell position interface
 */
export interface ICellPosition {
  /** Row index (1-based) */
  row: number;
  /** Column index (1-based) */
  col: number;
  /** Cell reference (e.g., A1) */
  reference: string;
}

/**
 * Cell range interface
 */
export interface ICellRange {
  /** Start position */
  start: ICellPosition;
  /** End position */
  end: ICellPosition;
  /** Range reference (e.g., A1:B10) */
  reference: string;
}

/**
 * Cell data for different types
 */
export interface ICellData {
  /** String cell data */
  string?: {
    value: string;
    maxLength?: number;
    trim?: boolean;
  };
  /** Number cell data */
  number?: {
    value: number;
    min?: number;
    max?: number;
    precision?: number;
    allowNegative?: boolean;
  };
  /** Date cell data */
  date?: {
    value: Date;
    min?: Date;
    max?: Date;
    format?: string;
  };
  /** Boolean cell data */
  boolean?: {
    value: boolean;
    trueText?: string;
    falseText?: string;
  };
  /** Percentage cell data */
  percentage?: {
    value: number;
    min?: number;
    max?: number;
    precision?: number;
    showSymbol?: boolean;
  };
  /** Currency cell data */
  currency?: {
    value: number;
    currency?: string;
    precision?: number;
    showSymbol?: boolean;
  };
  /** Link cell data */
  link?: {
    value: string;
    text?: string;
    tooltip?: string;
  };
  /** Formula cell data */
  formula?: {
    value: string;
    result?: CellValue;
  };
}

/**
 * Cell validation result
 */
export interface ICellValidationResult {
  /** Whether the cell is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Cell event types
 */
export enum CellEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  STYLED = 'styled',
  VALIDATED = 'validated'
}

/**
 * Cell event interface
 */
export interface ICellEvent {
  type: CellEventType;
  cell: IDataCell | IHeaderCell | IFooterCell;
  position: ICellPosition;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Rich text run interface (for formatted text within a cell)
 */
export interface IRichTextRun {
  /** Text content */
  text: string;
  /** Font name */
  font?: string;
  /** Font size */
  size?: number;
  /** Font color */
  color?: string | { r: number; g: number; b: number } | { theme: number };
  /** Bold */
  bold?: boolean;
  /** Italic */
  italic?: boolean;
  /** Underline */
  underline?: boolean;
  /** Strikethrough */
  strikethrough?: boolean;
}

