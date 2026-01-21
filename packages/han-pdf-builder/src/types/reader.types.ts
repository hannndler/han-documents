/**
 * Types for PDF Reader functionality
 */

import { Result, IDocumentMetadata } from '@hannndler/core';

/**
 * Output format types
 */
export enum OutputFormat {
  /** Format by pages (structured with pages and content blocks) */
  PAGES = 'pages',
  /** Detailed format with position and style information */
  DETAILED = 'detailed',
  /** Flat format - just the text content without structure */
  FLAT = 'flat'
}

/**
 * Mapper function types for different output formats
 */
export type PagesMapper = (data: IJsonPDF) => unknown;
export type DetailedMapper = (data: IDetailedFormat) => unknown;
export type FlatMapper = (data: IFlatFormat) => unknown;

/**
 * Options for reading PDF files
 */
export interface IPDFReaderOptions {
  /** Output format (default: 'pages') */
  outputFormat?: OutputFormat | 'pages' | 'detailed' | 'flat';
  /** Mapper function to transform the response data */
  mapper?: PagesMapper | DetailedMapper | FlatMapper;
  /** Page number or array of page numbers to read (1-based, if not specified, reads all pages) */
  pageNumbers?: number | number[];
  /** Whether to include empty pages */
  includeEmptyPages?: boolean;
  /** Whether to include formatting information */
  includeFormatting?: boolean;
  /** Whether to extract images */
  extractImages?: boolean;
  /** Whether to extract forms */
  extractForms?: boolean;
  /** Whether to extract links */
  extractLinks?: boolean;
  /** Image output format (base64, buffer, path) */
  imageFormat?: 'base64' | 'buffer' | 'path';
  /** Date format for date fields */
  dateFormat?: string;
  /** Whether to convert dates to ISO strings */
  datesAsISO?: boolean;
}

/**
 * Extracted content interface
 */
export interface IExtractedContent {
  /** Text content */
  text?: string;
  /** Images (if extractImages is true) */
  images?: IExtractedImage[];
  /** Forms (if extractForms is true) */
  forms?: IExtractedForm[];
  /** Links (if extractLinks is true) */
  links?: IExtractedLink[];
}

/**
 * Extracted image interface
 */
export interface IExtractedImage {
  /** Image index */
  index: number;
  /** Image data (format depends on imageFormat option) */
  data: string | ArrayBuffer | Uint8Array;
  /** Image format */
  format: 'png' | 'jpeg' | 'jpg' | 'gif';
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Image position on page */
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Extracted form field interface
 */
export interface IExtractedForm {
  /** Field name */
  name: string;
  /** Field type */
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button';
  /** Field value */
  value?: string | boolean | string[];
  /** Field position */
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Extracted link interface
 */
export interface IExtractedLink {
  /** Link URL or action */
  url: string;
  /** Link text */
  text?: string;
  /** Link position */
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Page data in JSON format
 */
export interface IPDFPageData {
  /** Page number (1-based) */
  pageNumber: number;
  /** Page width in points */
  width: number;
  /** Page height in points */
  height: number;
  /** Extracted content */
  content: IExtractedContent;
  /** Page metadata */
  metadata?: {
    rotation?: number;
  };
}

/**
 * PDF data in JSON format (pages format)
 */
export interface IJsonPDF {
  /** PDF metadata */
  metadata?: IDocumentMetadata;
  /** Pages in the PDF */
  pages: IPDFPageData[];
  /** Total number of pages */
  totalPages: number;
}

/**
 * Detailed content block interface
 */
export interface IDetailedContentBlock {
  /** Content type */
  type: 'text' | 'image' | 'form' | 'link';
  /** Content value */
  value: unknown;
  /** Position information */
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    page: number;
  };
  /** Style information (if includeFormatting is true) */
  style?: {
    font?: string;
    fontSize?: number;
    color?: string;
  };
}

/**
 * Detailed format interface
 */
export interface IDetailedFormat {
  /** PDF metadata */
  metadata?: IDocumentMetadata;
  /** Detailed content blocks */
  content: IDetailedContentBlock[];
  /** Total number of pages */
  totalPages: number;
}

/**
 * Flat format interface
 */
export interface IFlatFormat {
  /** PDF metadata */
  metadata?: IDocumentMetadata;
  /** Plain text content */
  text: string;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Reader result - generic type based on output format
 */
export type PDFReaderResult<T extends OutputFormat = OutputFormat.PAGES> = 
  T extends OutputFormat.DETAILED
    ? Result<IDetailedFormat> & { processingTime?: number }
    : T extends OutputFormat.FLAT
    ? Result<IFlatFormat> & { processingTime?: number }
    : Result<IJsonPDF> & { processingTime?: number };

