/**
 * Page-specific type definitions for PDF Builder
 */

import { Color } from '@han/core';
import { IPDFContentBlock } from './content.types';
import { IPDFStyle } from './style.types';
import { IBuildOptions } from './builder.types';
import type * as PDFKit from 'pdfkit';

/**
 * Page size options
 */
export type PageSize = 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'TABLOID' | [number, number];

/**
 * Page orientation
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Page margins interface
 */
export interface IPageMargins {
  /** Top margin in points */
  top?: number;
  /** Right margin in points */
  right?: number;
  /** Bottom margin in points */
  bottom?: number;
  /** Left margin in points */
  left?: number;
}

/**
 * PDF page configuration interface
 */
export interface IPDFPageConfig {
  /** Page name/identifier */
  name: string;
  /** Page size */
  size?: PageSize;
  /** Page orientation */
  orientation?: PageOrientation;
  /** Page margins */
  margins?: IPageMargins;
  /** Background color */
  backgroundColor?: Color;
  /** Default font family */
  defaultFont?: string;
  /** Default font size */
  defaultFontSize?: number;
  /** Whether page is hidden (not included in final PDF) */
  hidden?: boolean;
  /** Page number format */
  pageNumberFormat?: string;
}

/**
 * PDF section type
 */
export type PDFSectionType = 'header' | 'body' | 'footer';

/**
 * PDF section interface
 */
export interface IPDFSection {
  /** Section type */
  type: PDFSectionType;
  /** Content blocks in the section */
  content: IPDFContentBlock[];
  /** Section height (for header/footer) */
  height?: number;
  /** Section style */
  style?: IPDFStyle;
}

/**
 * PDF page interface
 */
export interface IPDFPage {
  /** Page configuration */
  config: IPDFPageConfig;
  /** Sections in the page */
  sections: Map<PDFSectionType, IPDFSection>;
  /** All content blocks */
  content: IPDFContentBlock[];
  /** Current Y position (for flow positioning) */
  currentY: number;
  /** Whether the page has been built */
  isBuilt: boolean;

  /** Add header section */
  addHeader(content: IPDFContentBlock | IPDFContentBlock[]): this;
  /** Add footer section */
  addFooter(content: IPDFContentBlock | IPDFContentBlock[]): this;
  /** Add content to body */
  addContent(content: IPDFContentBlock | IPDFContentBlock[]): this;
  /** Add text */
  addText(text: string | string[], style?: IPDFStyle): this;
  /** Add image */
  addImage(source: string | ArrayBuffer | Uint8Array, options?: Partial<IImageContent>): this;
  /** Add table */
  addTable(rows: ITableRow[], options?: Partial<Omit<ITableContent, 'type' | 'rows'>>): this;
  /** Add list */
  addList(items: IListItem[], options?: Partial<Omit<IListContent, 'type' | 'items'>>): this;
  /** Build the page */
  build(doc: PDFKit.PDFDocument, options?: IBuildOptions): Promise<void>;
  /** Validate the page */
  validate(): Result<boolean>;
}

// Re-export types needed from content.types
import type { ITableRow, IListItem, IImageContent, ITableContent, IListContent } from './content.types';
import type { Result } from '@han/core';

// Note: ITableRow and IListItem are defined in content.types.ts

