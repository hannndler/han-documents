/**
 * Builder-specific type definitions for PDF Builder
 */

import { IDocumentMetadata, Result, Color } from '@han/core';
import { IPDFPage, IPDFPageConfig } from './page.types';
import { IPDFStyle, IPDFTheme } from './style.types';
import { IPDFContentBlock } from './content.types';

// Re-export ErrorType for convenience
export type { ErrorType } from './core.types';

/**
 * PDF builder configuration interface
 */
export interface IPDFBuilderConfig {
  /** Document metadata */
  metadata?: IDocumentMetadata;
  /** Default page configuration */
  defaultPageConfig?: Partial<IPDFPageConfig>;
  /** Default styles */
  defaultStyles?: {
    header?: IPDFStyle;
    body?: IPDFStyle;
    footer?: IPDFStyle;
    title?: IPDFStyle;
    subtitle?: IPDFStyle;
  };
  /** Global header content (applied to all pages) */
  globalHeader?: IPDFContentBlock[];
  /** Global footer content (applied to all pages) */
  globalFooter?: IPDFContentBlock[];
  /** Whether to enable validation */
  enableValidation?: boolean;
  /** Whether to enable events */
  enableEvents?: boolean;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Maximum number of pages */
  maxPages?: number;
  /** Memory limit in bytes */
  memoryLimit?: number;
}

/**
 * Build options interface
 */
export interface IBuildOptions {
  /** Output format */
  format?: 'pdf';
  /** Compression level (0-9, higher = more compression) */
  compressionLevel?: number;
  /** Whether to optimize for size */
  optimizeForSize?: boolean;
  /** Whether to optimize for speed */
  optimizeForSpeed?: boolean;
  /** PDF version (1.4, 1.5, 1.6, 1.7) */
  pdfVersion?: '1.4' | '1.5' | '1.6' | '1.7';
  /** Whether to include metadata */
  includeMetadata?: boolean;
  /** Whether to include forms */
  includeForms?: boolean;
}

/**
 * Download options interface
 */
export interface IDownloadOptions extends IBuildOptions {
  /** File name */
  fileName?: string;
  /** Whether to show download progress */
  showProgress?: boolean;
  /** Progress callback */
  onProgress?: (progress: number) => void;
  /** Whether to auto-download */
  autoDownload?: boolean;
  /** MIME type */
  mimeType?: string;
}

/**
 * Save file options interface (for Node.js)
 */
export interface ISaveFileOptions extends IBuildOptions {
  /** Whether to create parent directories if they don't exist (default: true) */
  createDir?: boolean;
  /** File encoding (default: 'binary') */
  encoding?: 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';
}

/**
 * Build statistics interface
 */
export interface IPDFStats {
  /** Total number of pages */
  totalPages: number;
  /** Total content blocks */
  totalContentBlocks: number;
  /** Total memory usage in bytes */
  memoryUsage: number;
  /** Build time in milliseconds */
  buildTime: number;
  /** File size in bytes */
  fileSize: number;
  /** Number of styles used */
  stylesUsed: number;
  /** Number of images used */
  imagesUsed: number;
  /** Number of tables used */
  tablesUsed: number;
  /** Performance metrics */
  performance: {
    /** Time spent building headers */
    headersTime: number;
    /** Time spent building content */
    contentTime: number;
    /** Time spent applying styles */
    stylesTime: number;
    /** Time spent writing to buffer */
    writeTime: number;
  };
}

/**
 * PDF builder interface
 */
export interface IPDFBuilder {
  /** Builder configuration */
  config: IPDFBuilderConfig;
  /** Pages in the document */
  pages: Map<string, IPDFPage>;
  /** Current page */
  currentPage: IPDFPage | undefined;
  /** Whether the builder is building */
  isBuilding: boolean;
  /** Build statistics */
  stats: IPDFStats;

  /** Add a new page */
  addPage(name: string, config?: Partial<IPDFPageConfig>): IPDFPage;
  /** Get a page by name */
  getPage(name: string): IPDFPage | undefined;
  /** Remove a page */
  removePage(name: string): boolean;
  /** Set the current page */
  setCurrentPage(name: string): boolean;
  /** Build the PDF */
  build(options?: IBuildOptions): Promise<Result<ArrayBuffer>>;
  /** Generate and download the file */
  generateAndDownload(fileName: string, options?: IDownloadOptions): Promise<Result<void>>;
  /** Save file to disk (Node.js only) */
  saveToFile(filePath: string, options?: ISaveFileOptions): Promise<Result<void>>;
  /** Save to stream (Node.js only) */
  saveToStream(writeStream: { write: (chunk: Uint8Array | Buffer, callback?: (error?: Error | null) => void) => boolean }, options?: IBuildOptions): Promise<Result<void>>;
  /** Get PDF as buffer */
  toBuffer(options?: IBuildOptions): Promise<Result<ArrayBuffer>>;
  /** Get PDF as blob */
  toBlob(options?: IBuildOptions): Promise<Result<Blob>>;
  /** Validate the PDF */
  validate(): Result<boolean>;
  /** Clear all pages */
  clear(): void;
  /** Get PDF statistics */
  getStats(): IPDFStats;
  /** Add a predefined style */
  addStyle(name: string, style: IPDFStyle): this;
  /** Get a predefined style by name */
  getStyle(name: string): IPDFStyle | undefined;
  /** Set PDF theme */
  setTheme(theme: IPDFTheme): this;
  /** Get current PDF theme */
  getTheme(): IPDFTheme | undefined;
  /** Set global header (applied to all pages) */
  setGlobalHeader(content: IPDFContentBlock | IPDFContentBlock[]): this;
  /** Set global footer (applied to all pages) */
  setGlobalFooter(content: IPDFContentBlock | IPDFContentBlock[]): this;
  /** Get global header */
  getGlobalHeader(): IPDFContentBlock[];
  /** Get global footer */
  getGlobalFooter(): IPDFContentBlock[];
  /** Create PDF from JSON structure */
  createFromJSON(json: IJSONPDF): Promise<Result<ArrayBuffer>>;
}

/**
 * Builder event types
 */
export enum BuilderEventType {
  PAGE_ADDED = 'pageAdded',
  PAGE_REMOVED = 'pageRemoved',
  PAGE_UPDATED = 'pageUpdated',
  BUILD_STARTED = 'buildStarted',
  BUILD_PROGRESS = 'buildProgress',
  BUILD_COMPLETED = 'buildCompleted',
  BUILD_ERROR = 'buildError',
  DOWNLOAD_STARTED = 'downloadStarted',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  DOWNLOAD_COMPLETED = 'downloadCompleted',
  DOWNLOAD_ERROR = 'downloadError'
}

/**
 * Builder event interface
 */
export interface IBuilderEvent {
  type: BuilderEventType;
  data?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * JSON structure for PDF creation
 */
export interface IJSONPDF {
  /** Document metadata */
  metadata?: IDocumentMetadata;
  /** Pages array */
  pages: Array<{
    name?: string;
    size?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'TABLOID' | [number, number];
    orientation?: 'portrait' | 'landscape';
    margins?: { top: number; right: number; bottom: number; left: number };
    header?: IPDFContentBlock[];
    body?: IPDFContentBlock[];
    footer?: IPDFContentBlock[];
  }>;
  /** Theme */
  theme?: IPDFTheme;
  /** Styles */
  styles?: Record<string, IPDFStyle>;
}

