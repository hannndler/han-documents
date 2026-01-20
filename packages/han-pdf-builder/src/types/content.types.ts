/**
 * Content-specific type definitions for PDF Builder
 */

import { Color } from '@han/core';
import { IPDFStyle } from './style.types';

/**
 * Content block type
 */
export type ContentBlockType = 'text' | 'image' | 'table' | 'list' | 'formField' | 'rectangle' | 'line' | 'circle';

/**
 * Content position interface
 */
export interface IContentPosition {
  /** X position in points */
  x?: number;
  /** Y position in points */
  y?: number;
  /** Width in points */
  width?: number;
  /** Height in points */
  height?: number;
  /** Position type */
  type?: 'absolute' | 'relative' | 'flow';
}

/**
 * Rich text run interface
 */
export interface IRichTextRun {
  /** Text content */
  text: string;
  /** Style for this run */
  style?: Partial<IPDFStyle>;
}

/**
 * Text content interface
 */
export interface ITextContent {
  /** Content type */
  type: 'text';
  /** Text content (plain text or rich text runs) */
  text: string | IRichTextRun[];
  /** Position */
  position?: IContentPosition;
  /** Style */
  style?: IPDFStyle;
  /** Link URL (if text should be clickable) */
  link?: string;
}

/**
 * Image content interface
 */
export interface IImageContent {
  /** Content type */
  type: 'image';
  /** Image source (path, buffer, base64, or URL) */
  source: string | ArrayBuffer | Uint8Array;
  /** Position */
  position: IContentPosition;
  /** Image format */
  format?: 'png' | 'jpeg' | 'jpg' | 'gif';
  /** Whether to maintain aspect ratio */
  maintainAspectRatio?: boolean;
  /** Opacity (0-1) */
  opacity?: number;
  /** Link URL (if image should be clickable) */
  link?: string;
}

/**
 * Table cell interface
 */
export interface ITableCell {
  /** Cell content */
  content: string | ITextContent;
  /** Cell style */
  style?: IPDFStyle;
  /** Column span */
  colSpan?: number;
  /** Row span */
  rowSpan?: number;
}

/**
 * Table row interface
 */
export interface ITableRow {
  /** Cells in the row */
  cells: ITableCell[];
  /** Row style */
  style?: IPDFStyle;
}

/**
 * Table content interface
 */
export interface ITableContent {
  /** Content type */
  type: 'table';
  /** Table rows */
  rows: ITableRow[];
  /** Position */
  position?: IContentPosition;
  /** Table style */
  style?: IPDFStyle;
  /** Column widths (auto if not specified) */
  columnWidths?: number[];
  /** Whether to repeat header row on each page */
  repeatHeader?: boolean;
}

/**
 * List item interface
 */
export interface IListItem {
  /** Item content */
  content: string | ITextContent;
  /** Nested items */
  items?: IListItem[];
  /** Item style */
  style?: IPDFStyle;
}

/**
 * List content interface
 */
export interface IListContent {
  /** Content type */
  type: 'list';
  /** List items */
  items: IListItem[];
  /** Position */
  position?: IContentPosition;
  /** List style */
  style?: IPDFStyle;
  /** List type */
  listType?: 'unordered' | 'ordered' | 'none';
  /** Bullet character for unordered lists */
  bullet?: string;
}

/**
 * Form field type
 */
export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button';

/**
 * Form field interface
 */
export interface IFormField {
  /** Content type */
  type: 'formField';
  /** Field name */
  name: string;
  /** Field type */
  fieldType: FormFieldType;
  /** Field value */
  value?: string | boolean | string[];
  /** Position */
  position: IContentPosition;
  /** Field style */
  style?: IPDFStyle;
  /** Placeholder text */
  placeholder?: string;
  /** Options (for dropdown/radio) */
  options?: string[];
  /** Whether field is required */
  required?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
}

/**
 * Rectangle content interface
 */
export interface IRectangleContent {
  /** Content type */
  type: 'rectangle';
  /** Position */
  position: IContentPosition;
  /** Fill color */
  fill?: Color;
  /** Border color */
  border?: Color;
  /** Border width */
  borderWidth?: number;
  /** Border radius */
  borderRadius?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Line content interface
 */
export interface ILineContent {
  /** Content type */
  type: 'line';
  /** Start position */
  start: { x: number; y: number };
  /** End position */
  end: { x: number; y: number };
  /** Line color */
  color?: Color;
  /** Line width */
  width?: number;
  /** Line style */
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Circle content interface
 */
export interface ICircleContent {
  /** Content type */
  type: 'circle';
  /** Center position */
  center: { x: number; y: number };
  /** Radius */
  radius: number;
  /** Fill color */
  fill?: Color;
  /** Border color */
  border?: Color;
  /** Border width */
  borderWidth?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Union type for all content blocks
 */
export type IPDFContentBlock =
  | ITextContent
  | IImageContent
  | ITableContent
  | IListContent
  | IFormField
  | IRectangleContent
  | ILineContent
  | ICircleContent;

