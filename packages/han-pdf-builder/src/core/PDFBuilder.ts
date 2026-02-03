/**
 * PDFBuilder - Main class for creating PDF documents
 * Similar to ExcelBuilder but for PDF documents
 */

import PDFDocument from 'pdfkit';
import saveAs from 'file-saver';
import { 
  IDocumentMetadata, 
  Result, 
  success, 
  error, 
  ErrorType as CoreErrorType,
  IDocumentBuilder,
  IFileBuilder,
  IDownloadBuilder
} from '@hannndler/core';
import { ErrorType as LocalErrorType } from '../types/core.types';
import { EventEmitter } from '../utils/EventEmitter';
import { PDFPage } from './PDFPage';
import {
  IPDFBuilder,
  IPDFBuilderConfig,
  IBuildOptions,
  IDownloadOptions,
  ISaveFileOptions,
  IPDFStats,
  BuilderEventType,
  IBuilderEvent,
  IJSONPDF
} from '../types/builder.types';
import { IPDFStyle, IPDFTheme } from '../types/style.types';
import { IPDFPage, IPDFPageConfig } from '../types/page.types';
import { IPDFContentBlock } from '../types/content.types';

/**
 * PDFBuilder class for creating PDF documents
 * 
 * Main entry point for creating PDF files. Supports multiple pages, themes,
 * predefined styles, and comprehensive PDF features. Works in both browser and Node.js environments.
 * 
 * @class PDFBuilder
 * @implements {IPDFBuilder}
 * @implements {IDocumentBuilder<IBuildOptions, ArrayBuffer>}
 * @implements {IFileBuilder<ISaveFileOptions>}
 * @implements {IDownloadBuilder<IDownloadOptions>}
 */
export class PDFBuilder implements 
  IPDFBuilder,
  IDocumentBuilder<IBuildOptions, ArrayBuffer>,
  IFileBuilder<ISaveFileOptions>,
  IDownloadBuilder<IDownloadOptions> {
  
  public config: IPDFBuilderConfig;
  public pages: Map<string, IPDFPage> = new Map();
  public currentPage: IPDFPage | undefined;
  public isBuilding = false;
  public stats: IPDFStats;

  private eventEmitter: EventEmitter;
  private styles: Map<string, IPDFStyle> = new Map();
  private theme: IPDFTheme | undefined;
  private globalHeader: IPDFContentBlock[] = [];
  private globalFooter: IPDFContentBlock[] = [];

  /**
   * Creates a new PDFBuilder instance
   * 
   * @param config - Configuration options for the builder
   */
  constructor(config: IPDFBuilderConfig = {}) {
    this.config = {
      enableValidation: true,
      enableEvents: true,
      enablePerformanceMonitoring: false,
      maxPages: 1000,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      ...config
    };

    // Initialize global header and footer from config
    if (config.globalHeader) {
      this.globalHeader = Array.isArray(config.globalHeader) ? config.globalHeader : [config.globalHeader];
    }
    if (config.globalFooter) {
      this.globalFooter = Array.isArray(config.globalFooter) ? config.globalFooter : [config.globalFooter];
    }

    this.stats = this.initializeStats();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): IPDFStats {
    return {
      totalPages: 0,
      totalContentBlocks: 0,
      memoryUsage: 0,
      buildTime: 0,
      fileSize: 0,
      stylesUsed: 0,
      imagesUsed: 0,
      tablesUsed: 0,
      performance: {
        headersTime: 0,
        contentTime: 0,
        stylesTime: 0,
        writeTime: 0
      }
    };
  }

  /**
   * Add a new page to the document
   */
  addPage(name: string, pageConfig: Partial<IPDFPageConfig> = {}): IPDFPage {
    if (this.pages.has(name)) {
      throw new Error(`Page "${name}" already exists`);
    }

    const config: IPDFPageConfig = {
      name,
      size: 'A4',
      orientation: 'portrait',
      margins: {
        top: 72,
        right: 72,
        bottom: 72,
        left: 72
      },
      defaultFont: 'Helvetica',
      defaultFontSize: 12,
      ...this.config.defaultPageConfig,
      ...pageConfig
    };

    const page = new PDFPage(config);
    this.pages.set(name, page);
    this.currentPage = page;
    
    this.emitEvent(BuilderEventType.PAGE_ADDED, { pageName: name });
    
    return page;
  }

  /**
   * Get a page by name
   */
  getPage(name: string): IPDFPage | undefined {
    return this.pages.get(name);
  }

  /**
   * Remove a page by name
   */
  removePage(name: string): boolean {
    const page = this.pages.get(name);
    if (!page) {
      return false;
    }

    this.pages.delete(name);
    
    // If this was the current page, clear it
    if (this.currentPage === page) {
      this.currentPage = undefined;
    }
    
    this.emitEvent(BuilderEventType.PAGE_REMOVED, { pageName: name });
    
    return true;
  }

  /**
   * Set the current page
   */
  setCurrentPage(name: string): boolean {
    const page = this.pages.get(name);
    if (!page) {
      return false;
    }
    
    this.currentPage = page;
    return true;
  }

  /**
   * Set metadata for the document
   */
  setMetadata(metadata: IDocumentMetadata): this {
    this.config.metadata = metadata;
    return this;
  }

  /**
   * Build the PDF and return as ArrayBuffer
   */
  async build(options: IBuildOptions = {}): Promise<Result<ArrayBuffer>> {
    if (this.isBuilding) {
      return error(
        CoreErrorType.BUILD_ERROR,
        'Build already in progress',
        'BUILD_IN_PROGRESS'
      );
    }

    this.isBuilding = true;
    const startTime = Date.now();
    
    try {
      this.emitEvent(BuilderEventType.BUILD_STARTED);
      
      // Reset page build state before building (allows rebuilding)
      // Note: IPDFPage.isBuilt is a public property that needs to be reset for rebuilding
      for (const page of this.pages.values()) {
        // Type assertion to access isBuilt property for modification
        // isBuilt is defined in IPDFPage but TypeScript treats it as potentially readonly
        (page as IPDFPage & { isBuilt: boolean }).isBuilt = false;
      }
      
      // Create PDFKit document
      // Note: autoFirstPage is true by default, so we disable it to control page creation
      const docOptions: PDFKit.PDFDocumentOptions = {
        compress: options.compressionLevel !== undefined ? options.compressionLevel > 0 : true,
        pdfVersion: options.pdfVersion || '1.7',
        autoFirstPage: false, // We'll create pages manually
        info: this.config.metadata ? {
          Title: this.config.metadata.title || '',
          Author: this.config.metadata.author || '',
          Subject: this.config.metadata.subject || '',
          Keywords: Array.isArray(this.config.metadata.keywords) 
            ? this.config.metadata.keywords.join(', ')
            : this.config.metadata.keywords || '',
          Creator: 'Han PDF Builder',
          Producer: 'Han PDF Builder'
        } : undefined
      };
      const doc = new PDFDocument(docOptions);

      // Collect PDF chunks
      const chunks: Uint8Array[] = [];
      
      // Register data listener BEFORE building content
      doc.on('data', (chunk: Uint8Array) => {
        chunks.push(chunk);
      });

      // Register end listener BEFORE calling end()
      const bufferPromise = new Promise<Uint8Array>((resolve, reject) => {
        doc.on('end', () => {
          // Concatenate chunks into single Uint8Array
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const pdfBuffer = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            pdfBuffer.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(pdfBuffer);
        });
        
        doc.on('error', (err: Error) => {
          reject(err);
        });
      });

      // Build each page
      const headersStartTime = Date.now();
      for (const page of this.pages.values()) {
        if (!page.config.hidden) {
          // Apply global header and footer to each page (before building)
          // These will be added to the page's header/footer sections
          // Note: If page already has header/footer, global ones will be added first
          if (this.globalHeader.length > 0) {
            // Add global header at the beginning of the header section
            const headerSection = page.sections.get('header');
            if (headerSection) {
              headerSection.content.unshift(...this.globalHeader);
            }
          }
          if (this.globalFooter.length > 0) {
            // Add global footer at the beginning of the footer section
            const footerSection = page.sections.get('footer');
            if (footerSection) {
              footerSection.content.unshift(...this.globalFooter);
            }
          }
          await page.build(doc, options);
        }
      }
      this.stats.performance.headersTime = Date.now() - headersStartTime;

      // Finalize PDF - this triggers the 'data' and 'end' events
      doc.end();

      // Wait for all data chunks
      const buffer = await bufferPromise;

      const endTime = Date.now();
      this.stats.buildTime = endTime - startTime;
      this.stats.fileSize = buffer.byteLength;
      this.stats.totalPages = this.pages.size;
      
      // Convert Uint8Array to ArrayBuffer
      // Create a new ArrayBuffer by copying the data to ensure completeness
      // This avoids issues with shared buffers and ensures the PDF is complete
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      const view = new Uint8Array(arrayBuffer);
      view.set(buffer);
      
      this.emitEvent(BuilderEventType.BUILD_COMPLETED, {
        buildTime: this.stats.buildTime,
        fileSize: this.stats.fileSize
      });

      this.isBuilding = false;
      return success(arrayBuffer as ArrayBuffer);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to build PDF';
      const errorResult = error(
        CoreErrorType.BUILD_ERROR,
        errorMessage,
        'BUILD_FAILED',
        { originalError: err }
      );

      this.emitEvent(BuilderEventType.BUILD_ERROR, { error: errorMessage });
      this.isBuilding = false;
      return errorResult;
    }
  }

  /**
   * Generate and download the PDF file (browser)
   */
  async generateAndDownload(fileName: string, options: IDownloadOptions = {}): Promise<Result<void>> {
    try {
      this.emitEvent(BuilderEventType.DOWNLOAD_STARTED, { fileName });
      
      const result = await this.build(options);
      if (!result.success) {
        return result as Result<void>;
      }

      const blob = new Blob([result.data], { type: 'application/pdf' });
      saveAs(blob, fileName || 'document.pdf');
      
      this.emitEvent(BuilderEventType.DOWNLOAD_COMPLETED, { fileName });
      
      return success(undefined);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        errorMessage,
        'DOWNLOAD_FAILED'
      );

      this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: errorMessage });
      return errorResult;
    }
  }

  /**
   * Save PDF file to disk (Node.js only)
   */
  async saveToFile(filePath: string, options: ISaveFileOptions = {}): Promise<Result<void>> {
    try {
      // Check if we're in Node.js
      if (typeof window !== 'undefined') {
        return error(
          CoreErrorType.FILE_ERROR,
          'saveToFile() is only available in Node.js. Use generateAndDownload() in the browser.',
          'BROWSER_ENVIRONMENT'
        );
      }

      this.emitEvent(BuilderEventType.DOWNLOAD_STARTED, { fileName: filePath });
      
      // Dynamic import of Node.js modules (only available in Node.js)
      // Type assertions needed because these modules don't have types in browser context
      type NodeFS = typeof import('fs/promises');
      type NodePath = typeof import('path');
      // Prefer runtime require() to avoid bundler externalization in builds
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fsReq = typeof require === 'function' ? (require as any)('fs/promises') : undefined;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pathReq = typeof require === 'function' ? (require as any)('path') : undefined;

      const fsMod = fsReq ?? (await import('fs/promises'));
      const pathMod = pathReq ?? (await import('path'));

      // Normalize modules in case bundler wraps them under `.default`
      const fs = (fsMod as any).default ?? (fsMod as unknown as NodeFS);
      const path = (pathMod as any).default ?? (pathMod as unknown as NodePath);
      
      // Create directory if needed
      if (options.createDir !== false) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      const result = await this.build(options);
      if (!result.success) {
        return result as Result<void>;
      }

      // Convert ArrayBuffer to Buffer for Node.js file writing
      // Create Uint8Array from ArrayBuffer and then convert to Buffer
      const uint8View = new Uint8Array(result.data);
      
      // Buffer is available in Node.js runtime, but TypeScript doesn't know it
      type BufferConstructor = {
        from(arrayBuffer: ArrayBufferLike, byteOffset?: number, length?: number): Uint8Array;
        from(array: Uint8Array): Uint8Array;
      };
      const BufferCtor = (typeof global !== 'undefined' && (global as { Buffer?: BufferConstructor }).Buffer) as BufferConstructor | undefined;
      
      const nodeBuffer: Uint8Array = BufferCtor
        ? BufferCtor.from(uint8View.buffer, uint8View.byteOffset, uint8View.byteLength)
        : uint8View;
      
      // Write file - use binary encoding to ensure PDF is written correctly
      await fs.writeFile(filePath, nodeBuffer, 'binary');
      
      this.emitEvent(BuilderEventType.DOWNLOAD_COMPLETED, { fileName: filePath });
      
      return success(undefined);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        errorMessage,
        'SAVE_FAILED'
      );

      this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: errorMessage });
      return errorResult;
    }
  }

  /**
   * Save PDF to stream (Node.js only)
   */
  async saveToStream(
    writeStream: { write: (chunk: Uint8Array | Buffer, callback?: (error?: Error | null) => void) => boolean },
    options: IBuildOptions = {}
  ): Promise<Result<void>> {
    try {
      // Check if we're in Node.js
      if (typeof window !== 'undefined') {
        return error(
          CoreErrorType.FILE_ERROR,
          'saveToStream() is only available in Node.js.',
          'BROWSER_ENVIRONMENT'
        );
      }

      this.emitEvent(BuilderEventType.DOWNLOAD_STARTED, { fileName: 'stream' });
      
      const result = await this.build(options);
      if (!result.success) {
        return result as Result<void>;
      }

      // For Node.js stream, we need Buffer
      type BufferConstructor = {
        from(arrayBuffer: ArrayBufferLike): Uint8Array;
      };
      const BufferCtor = (typeof global !== 'undefined' && (global as { Buffer?: BufferConstructor }).Buffer) as BufferConstructor | undefined;
      const nodeBuffer: Uint8Array = BufferCtor 
        ? BufferCtor.from(result.data)
        : new Uint8Array(result.data);
      
      return new Promise((resolve) => {
        writeStream.write(nodeBuffer, (err?: Error | null) => {
          if (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to write to stream';
            const errorResult = error(
              CoreErrorType.FILE_ERROR,
              errorMessage,
              'STREAM_WRITE_FAILED'
            );
            this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: errorMessage });
            resolve(errorResult);
          } else {
            this.emitEvent(BuilderEventType.DOWNLOAD_COMPLETED, { fileName: 'stream' });
            resolve(success(undefined));
          }
        });
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save to stream';
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        errorMessage,
        'STREAM_FAILED'
      );

      this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: errorMessage });
      return errorResult;
    }
  }

  /**
   * Get PDF as buffer
   */
  async toBuffer(options?: IBuildOptions): Promise<Result<ArrayBuffer>> {
    return this.build(options);
  }

  /**
   * Get PDF as blob
   */
  async toBlob(options?: IBuildOptions): Promise<Result<Blob>> {
    const result = await this.build(options);
    if (!result.success) {
      return result as Result<Blob>;
    }
    
    if (typeof Blob === 'undefined') {
      return error(CoreErrorType.BUILD_ERROR, 'Blob is not available in this environment. Use toBuffer() instead.', 'BLOB_NOT_AVAILABLE');
    }
    
    return success(new Blob([result.data as BlobPart], { type: 'application/pdf' }));
  }

  /**
   * Validate the document
   */
  validate(): Result<boolean> {
    if (this.pages.size === 0) {
      return error(
        CoreErrorType.VALIDATION_ERROR,
        'PDF has no pages',
        'NO_PAGES'
      );
    }

    const errors: string[] = [];
    
    for (const [name, page] of this.pages.entries()) {
      if (!page.config.hidden) {
        const pageValidation = page.validate();
        if (!pageValidation.success) {
          errors.push(`Page "${name}": ${pageValidation.error?.message}`);
        }
      }
    }

    if (errors.length > 0) {
      return error(
        CoreErrorType.VALIDATION_ERROR,
        errors.join('; '),
        'VALIDATION_FAILED'
      );
    }

    return success(true);
  }

  /**
   * Clear all pages
   */
  clear(): void {
    this.pages.clear();
    this.currentPage = undefined;
    this.config.metadata = undefined;
    this.stats = this.initializeStats();
  }

  /**
   * Get PDF statistics
   */
  getStats(): IPDFStats {
    return { ...this.stats };
  }

  /**
   * Add a predefined style
   */
  addStyle(name: string, style: IPDFStyle): this {
    this.styles.set(name, style);
    return this;
  }

  /**
   * Get a predefined style by name
   */
  getStyle(name: string): IPDFStyle | undefined {
    return this.styles.get(name);
  }

  /**
   * Set PDF theme
   */
  setTheme(theme: IPDFTheme): this {
    this.theme = theme;
    return this;
  }

  /**
   * Get current PDF theme
   */
  getTheme(): IPDFTheme | undefined {
    return this.theme;
  }

  /**
   * Set global header (applied to all pages)
   */
  setGlobalHeader(content: IPDFContentBlock | IPDFContentBlock[]): this {
    this.globalHeader = Array.isArray(content) ? content : [content];
    return this;
  }

  /**
   * Set global footer (applied to all pages)
   */
  setGlobalFooter(content: IPDFContentBlock | IPDFContentBlock[]): this {
    this.globalFooter = Array.isArray(content) ? content : [content];
    return this;
  }

  /**
   * Get global header
   */
  getGlobalHeader(): IPDFContentBlock[] {
    return [...this.globalHeader];
  }

  /**
   * Get global footer
   */
  getGlobalFooter(): IPDFContentBlock[] {
    return [...this.globalFooter];
  }

  /**
   * Create PDF from JSON structure
   * TODO: Implement in Phase 4
   */
  async createFromJSON(json: IJSONPDF): Promise<Result<ArrayBuffer>> {
    // TODO: Implement in Phase 4 - TemplateEngine
    return error(
      CoreErrorType.BUILD_ERROR,
      'createFromJSON() not yet implemented',
      'NOT_IMPLEMENTED'
    );
  }

  /**
   * Emit an event
   */
  private emitEvent(type: BuilderEventType, data?: Record<string, unknown>): void {
    if (!this.config.enableEvents) {
      return;
    }

    const event: IBuilderEvent = {
      type,
      data,
      timestamp: new Date()
    };

    this.eventEmitter.emitSync(event);
  }
}
