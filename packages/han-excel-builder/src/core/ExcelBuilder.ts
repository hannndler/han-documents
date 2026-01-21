/**
 * ExcelBuilder - Main class for creating Excel workbooks
 * 
 * This class provides a fluent API for creating complex Excel files with multiple worksheets,
 * advanced styling, themes, and comprehensive features. It works in both browser and Node.js environments.
 * 
 * @example
 * ```typescript
 * const builder = new ExcelBuilder({
 *   metadata: {
 *     title: 'Sales Report',
 *     author: 'My Company'
 *   }
 * });
 * 
 * const worksheet = builder.addWorksheet('Sales');
 * worksheet.addHeader({ key: 'title', value: 'Monthly Report', type: CellType.STRING });
 * 
 * // Browser
 * await builder.generateAndDownload('report.xlsx');
 * 
 * // Node.js
 * await builder.saveToFile('./output/report.xlsx');
 * ```
 */

import ExcelJS from 'exceljs';
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
import { EventEmitter } from '../utils/EventEmitter';
import { Worksheet } from './Worksheet';
import {
  IExcelBuilder,
  IExcelBuilderConfig,
  IBuildOptions,
  IDownloadOptions,
  ISaveFileOptions,
  IBuildStats,
  BuilderEventType,
  IBuilderEvent,
  ErrorType,
  IWorkbookTheme,
  IWorkbookMetadata
} from '../types/builder.types';
import { Color, ISuccessResult, IErrorResult } from '../types/core.types';
import {
  IWorksheet,
  IWorksheetConfig
} from '../types/worksheet.types';

/**
 * ExcelBuilder class for creating Excel workbooks
 * 
 * Main entry point for creating Excel files. Supports multiple worksheets, themes,
 * predefined styles, and comprehensive Excel features.
 * 
 * @class ExcelBuilder
 * @implements {IExcelBuilder}
 * @implements {IDocumentBuilder<IBuildOptions, ArrayBuffer>}
 * @implements {IFileBuilder<ISaveFileOptions>}
 * @implements {IDownloadBuilder<IDownloadOptions>}
 */
export class ExcelBuilder implements 
  IExcelBuilder,
  IDocumentBuilder<IBuildOptions, ArrayBuffer>,
  IFileBuilder<ISaveFileOptions>,
  IDownloadBuilder<IDownloadOptions> {
  public config: IExcelBuilderConfig;
  public worksheets: Map<string, IWorksheet> = new Map();
  public currentWorksheet: IWorksheet | undefined;
  public isBuilding = false;
  public stats: IBuildStats;

  private eventEmitter: EventEmitter;
  private cellStyles: Map<string, import('../types/style.types').IStyle> = new Map();
  private theme: IWorkbookTheme | undefined;

  /**
   * Creates a new ExcelBuilder instance
   * 
   * @param {IExcelBuilderConfig} config - Configuration options for the builder
   * @param {IWorkbookMetadata} [config.metadata] - Workbook metadata (title, author, description, etc.)
   * @param {Partial<IWorksheetConfig>} [config.defaultWorksheetConfig] - Default configuration for all worksheets
   * @param {boolean} [config.enableValidation=true] - Enable data validation
   * @param {boolean} [config.enableEvents=true] - Enable event system
   * @param {boolean} [config.enablePerformanceMonitoring=false] - Enable performance monitoring
   * @param {number} [config.maxWorksheets=255] - Maximum number of worksheets allowed
   * @param {number} [config.maxRowsPerWorksheet=1048576] - Maximum rows per worksheet
   * @param {number} [config.maxColumnsPerWorksheet=16384] - Maximum columns per worksheet
   * @param {number} [config.memoryLimit=104857600] - Memory limit in bytes (100MB default)
   * 
   * @example
   * ```typescript
   * const builder = new ExcelBuilder({
   *   metadata: {
   *     title: 'Annual Report',
   *     author: 'John Doe',
   *     description: 'Company annual report for 2024'
   *   },
   *   enableValidation: true,
   *   enableEvents: true
   * });
   * ```
   */
  constructor(config: IExcelBuilderConfig = {}) {
    this.config = {
      enableValidation: true,
      enableEvents: true,
      enablePerformanceMonitoring: false,
      maxWorksheets: 255,
      maxRowsPerWorksheet: 1048576,
      maxColumnsPerWorksheet: 16384,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      ...config
    };

    this.stats = this.initializeStats();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Add a new worksheet to the workbook
   * 
   * Creates a new worksheet with the specified name and configuration. The worksheet
   * becomes the current worksheet automatically. If a worksheet with the same name
   * already exists, an error is thrown.
   * 
   * @param {string} name - Unique name for the worksheet (required, must be unique)
   * @param {Partial<IWorksheetConfig>} [worksheetConfig={}] - Configuration for the worksheet
   * @param {string} [worksheetConfig.tabColor] - Tab color (hex format, e.g., '#FF0000')
   * @param {number} [worksheetConfig.defaultRowHeight=20] - Default row height in points
   * @param {number} [worksheetConfig.defaultColWidth=10] - Default column width in characters
   * @param {boolean} [worksheetConfig.hidden=false] - Whether the worksheet is hidden
   * @param {boolean} [worksheetConfig.protected=false] - Whether the worksheet is protected
   * @param {string} [worksheetConfig.protectionPassword] - Password for worksheet protection
   * @param {boolean} [worksheetConfig.showGridLines=true] - Show grid lines
   * @param {boolean} [worksheetConfig.showRowColHeaders=true] - Show row and column headers
   * @param {number} [worksheetConfig.zoom] - Zoom level (10-400)
   * 
   * @returns {IWorksheet} The newly created worksheet instance
   * 
   * @throws {Error} If a worksheet with the same name already exists
   * 
   * @example
   * ```typescript
   * // Simple worksheet
   * const sheet1 = builder.addWorksheet('Sales');
   * 
   * // Worksheet with configuration
   * const sheet2 = builder.addWorksheet('Summary', {
   *   tabColor: '#4472C4',
   *   defaultRowHeight: 25,
   *   defaultColWidth: 15,
   *   protected: true,
   *   protectionPassword: 'mypassword'
   * });
   * ```
   */
  addWorksheet(name: string, worksheetConfig: Partial<IWorksheetConfig> = {}): IWorksheet {
    if (this.worksheets.has(name)) {
      throw new Error(`Worksheet "${name}" already exists`);
    }

    const config: IWorksheetConfig = {
      name,
      defaultRowHeight: 20,
      defaultColWidth: 10,
      ...this.config.defaultWorksheetConfig,
      ...worksheetConfig
    };

    const worksheet = new Worksheet(config);
    this.worksheets.set(name, worksheet);
    this.currentWorksheet = worksheet;
    
    this.emitEvent(BuilderEventType.WORKSHEET_ADDED, { worksheetName: name });
    
    return worksheet;
  }

  /**
   * Get a worksheet by name
   * 
   * Retrieves an existing worksheet from the workbook by its name.
   * Returns undefined if the worksheet doesn't exist.
   * 
   * @param {string} name - Name of the worksheet to retrieve
   * @returns {IWorksheet | undefined} The worksheet if found, undefined otherwise
   * 
   * @example
   * ```typescript
   * const worksheet = builder.getWorksheet('Sales');
   * if (worksheet) {
   *   worksheet.addRow([...]);
   * }
   * ```
   */
  getWorksheet(name: string): IWorksheet | undefined {
    return this.worksheets.get(name);
  }

  /**
   * Remove a worksheet by name
   * 
   * Removes a worksheet from the workbook. If the removed worksheet was the current
   * worksheet, the current worksheet is cleared.
   * 
   * @param {string} name - Name of the worksheet to remove
   * @returns {boolean} True if the worksheet was found and removed, false otherwise
   * 
   * @example
   * ```typescript
   * const removed = builder.removeWorksheet('OldSheet');
   * if (removed) {
   *   console.log('Worksheet removed successfully');
   * }
   * ```
   */
  removeWorksheet(name: string): boolean {
    const worksheet = this.worksheets.get(name);
    if (!worksheet) {
      return false;
    }

    this.worksheets.delete(name);
    
    // If this was the current worksheet, clear it
    if (this.currentWorksheet === worksheet) {
      this.currentWorksheet = undefined;
    }
    
    this.emitEvent(BuilderEventType.WORKSHEET_REMOVED, { worksheetName: name });
    
    return true;
  }

  /**
   * Set the current worksheet
   * 
   * Sets the active worksheet. Operations like addRow() will be performed on the
   * current worksheet. When you add a new worksheet, it automatically becomes the current one.
   * 
   * @param {string} name - Name of the worksheet to set as current
   * @returns {boolean} True if the worksheet was found and set, false otherwise
   * 
   * @example
   * ```typescript
   * builder.addWorksheet('Sheet1');
   * builder.addWorksheet('Sheet2');
   * 
   * // Switch back to Sheet1
   * builder.setCurrentWorksheet('Sheet1');
   * ```
   */
  setCurrentWorksheet(name: string): boolean {
    const worksheet = this.worksheets.get(name);
    if (!worksheet) {
      return false;
    }
    
    this.currentWorksheet = worksheet;
    return true;
  }

  /**
   * Set metadata for the workbook
   * 
   * Updates the workbook metadata. This method is part of the IDocumentBuilder interface
   * and allows setting metadata after the builder has been created.
   * 
   * @param {IDocumentMetadata} metadata - Document metadata to set
   * @returns {this} This builder instance for method chaining
   * 
   * @example
   * ```typescript
   * builder.setMetadata({
   *   title: 'Annual Report',
   *   author: 'John Doe',
   *   description: 'Company annual report for 2024'
   * });
   * ```
   */
  setMetadata(metadata: IDocumentMetadata): this {
    this.config.metadata = metadata as IWorkbookMetadata;
    return this;
  }

  /**
   * Build the workbook and return as ArrayBuffer
   * 
   * Compiles all worksheets, applies themes and styles, and generates the Excel file
   * as an ArrayBuffer. This is the core method that all export methods use internally.
   * 
   * The build process:
   * 1. Creates a new ExcelJS workbook
   * 2. Applies workbook metadata
   * 3. Applies theme (if set)
   * 4. Adds predefined cell styles
   * 5. Builds each worksheet
   * 6. Writes to buffer with compression
   * 
   * @param {IBuildOptions} [options={}] - Build options
   * @param {'xlsx' | 'xls' | 'csv'} [options.format='xlsx'] - Output format
   * @param {boolean} [options.includeStyles=true] - Include cell styles
   * @param {number} [options.compressionLevel=6] - Compression level (0-9, higher = more compression)
   * @param {boolean} [options.optimizeForSpeed=false] - Optimize for speed over file size
   * 
   * @returns {Promise<Result<ArrayBuffer>>} Result containing the Excel file as ArrayBuffer
   * 
   * @throws {Error} If build is already in progress (prevents concurrent builds)
   * 
   * @example
   * ```typescript
   * // Basic build
   * const result = await builder.build();
   * if (result.success) {
   *   const buffer = result.data;
   *   // Use buffer...
   * }
   * 
   * // Build with options
   * const result = await builder.build({
   *   compressionLevel: 9, // Maximum compression
   *   optimizeForSpeed: true
   * });
   * ```
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
      
      const workbook = new ExcelJS.Workbook();
      
      // Add metadata using IDocumentMetadata from core
      if (this.config.metadata) {
        const metadata = this.config.metadata as IWorkbookMetadata;
        workbook.creator = metadata.author || 'Han Excel Builder';
        workbook.lastModifiedBy = metadata.author || 'Han Excel Builder';
        workbook.created = metadata.created || new Date();
        workbook.modified = metadata.modified || new Date();
        if (metadata.title) workbook.title = metadata.title;
        if (metadata.subject) workbook.subject = metadata.subject;
        if (metadata.keywords) workbook.keywords = Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords;
        if (metadata.category) workbook.category = metadata.category;
        if (metadata.description) workbook.description = metadata.description;
        if (metadata.company) workbook.company = metadata.company;
        if (metadata.hyperlinkBase) {
          // hyperlinkBase is not directly available in ExcelJS WorkbookProperties
          // Store it in custom properties if needed
          (workbook as any).hyperlinkBase = metadata.hyperlinkBase;
        }
      }

      // Apply theme if set
      if (this.theme) {
        this.applyTheme(workbook, this.theme);
      }

      // Add predefined cell styles
      for (const [name, style] of this.cellStyles.entries()) {
        this.addStyleToWorkbook(workbook, name, style);
      }

      // Build each worksheet
      for (const worksheet of this.worksheets.values()) {
        await (worksheet as Worksheet).build(workbook, options);
      }

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer({
        compression: options.compressionLevel || 6
      } as any);

      const endTime = Date.now();
      this.stats.buildTime = endTime - startTime;
      this.stats.fileSize = buffer.byteLength;
      
      this.emitEvent(BuilderEventType.BUILD_COMPLETED, {
        buildTime: this.stats.buildTime,
        fileSize: this.stats.fileSize
      });

      return success(buffer);

    } catch (err: any) {
      const errorResult = error(
        CoreErrorType.BUILD_ERROR,
        err.message || 'Failed to build workbook',
        'BUILD_FAILED',
        { originalError: err }
      );

      this.emitEvent(BuilderEventType.BUILD_ERROR, {
        error: err.message
      });

      return errorResult;
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Generate and download the file (Browser only)
   * 
   * Builds the Excel file and automatically triggers a download in the user's browser.
   * This is the simplest method for browser environments - just one method call!
   * 
   * **Note**: This method is designed for browser environments. For Node.js, use `saveToFile()` instead.
   * 
   * @param {string} fileName - Name of the file to download (e.g., 'report.xlsx')
   * @param {IDownloadOptions} [options={}] - Download options
   * @param {string} [options.mimeType] - MIME type (default: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
   * @param {number} [options.compressionLevel=6] - Compression level (0-9)
   * @param {boolean} [options.includeStyles=true] - Include cell styles
   * 
   * @returns {Promise<Result<void>>} Result indicating success or failure
   * 
   * @example
   * ```typescript
   * // Simple download
   * const result = await builder.generateAndDownload('sales-report.xlsx');
   * 
   * if (result.success) {
   *   console.log('File downloaded successfully!');
   * } else {
   *   console.error('Download failed:', result.error);
   * }
   * 
   * // With options
   * await builder.generateAndDownload('report.xlsx', {
   *   compressionLevel: 9,
   *   mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
   * });
   * ```
   */
  async generateAndDownload(fileName: string, options: IDownloadOptions = {}): Promise<Result<void>> {
    const buildResult = await this.build(options);
    
    if (!buildResult.success) {
      return buildResult;
    }

    try {
      this.emitEvent(BuilderEventType.DOWNLOAD_STARTED, { fileName });
      
      const blob = new Blob([buildResult.data], { 
        type: options.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, fileName);
      
      this.emitEvent(BuilderEventType.DOWNLOAD_COMPLETED, { fileName });
      
      return success(undefined);

    } catch (err: any) {
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        err.message || 'Download failed',
        'DOWNLOAD_FAILED'
      );

      this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: err.message });
      return errorResult;
    }
  }

  /**
   * Save file to disk (Node.js only)
   * 
   * Builds the Excel file and saves it directly to the file system. This is the Node.js
   * equivalent of `generateAndDownload()` - just as simple! Automatically creates parent
   * directories if they don't exist.
   * 
   * **Note**: This method only works in Node.js environments. For browsers, use `generateAndDownload()`.
   * 
   * @param {string} filePath - Full path where to save the file (e.g., './output/report.xlsx')
   * @param {ISaveFileOptions} [options={}] - Save options
   * @param {boolean} [options.createDir=true] - Create parent directories if they don't exist
   * @param {string} [options.encoding='binary'] - File encoding ('binary', 'base64', etc.)
   * @param {number} [options.compressionLevel=6] - Compression level (0-9)
   * @param {boolean} [options.includeStyles=true] - Include cell styles
   * 
   * @returns {Promise<Result<void>>} Result indicating success or failure
   * 
   * @throws {Error} If called in browser environment (use `generateAndDownload()` instead)
   * @throws {Error} If Node.js modules (fs, path, buffer) are not available
   * 
   * @example
   * ```typescript
   * // Simple save - creates directories automatically
   * const result = await builder.saveToFile('./output/report.xlsx');
   * 
   * if (result.success) {
   *   console.log('File saved successfully!');
   * }
   * 
   * // With options
   * await builder.saveToFile('./reports/sales.xlsx', {
   *   createDir: true,  // Create ./reports/ if it doesn't exist
   *   encoding: 'binary',
   *   compressionLevel: 9
   * });
   * ```
   */
  async saveToFile(filePath: string, options: ISaveFileOptions = {}): Promise<Result<void>> {
    const buildResult = await this.build(options);
    
    if (!buildResult.success) {
      return buildResult;
    }

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
      
      // Dynamic import of Node.js modules to avoid issues in browser builds
      const nodeModules = await (async () => {
        try {
          // @ts-ignore - Dynamic import for Node.js only
          const fs = await import('fs/promises');
          // @ts-ignore - Dynamic import for Node.js only
          const path = await import('path');
          // @ts-ignore - Dynamic import for Node.js only
          const buffer = await import('buffer');
          return { fs, path, Buffer: buffer.Buffer };
        } catch {
          throw new Error('Node.js modules not available. saveToFile() requires Node.js environment.');
        }
      })();
      
      // Create directory if needed
      if (options.createDir !== false) {
        const dir = nodeModules.path.dirname(filePath);
        try {
          await nodeModules.fs.mkdir(dir, { recursive: true });
        } catch (error: any) {
          // Ignore error if directory already exists
          if (error?.code !== 'EEXIST') {
            throw error;
          }
        }
      }
      
      // Convert ArrayBuffer to Buffer and write to file
      const buffer = nodeModules.Buffer.from(buildResult.data);
      await nodeModules.fs.writeFile(filePath, buffer, { encoding: options.encoding || 'binary' });
      
      this.emitEvent(BuilderEventType.DOWNLOAD_COMPLETED, { fileName: filePath });
      
      return success(undefined);

    } catch (err: any) {
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        err.message || 'Failed to save file',
        'SAVE_FAILED'
      );

      this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: err.message });
      return errorResult;
    }
  }

  /**
   * Save to stream (Node.js only) - For large files
   * 
   * Builds the Excel file and writes it directly to a writable stream. This is ideal
   * for very large files or when you need to stream the data (e.g., HTTP responses,
   * file uploads, etc.).
   * 
   * **Note**: This method only works in Node.js environments.
   * 
   * @param {NodeJS.WritableStream} writeStream - Writable stream to write the file to
   * @param {IBuildOptions} [options={}] - Build options
   * @param {number} [options.compressionLevel=6] - Compression level (0-9)
   * @param {boolean} [options.includeStyles=true] - Include cell styles
   * 
   * @returns {Promise<Result<void>>} Result indicating success or failure
   * 
   * @throws {Error} If called in browser environment
   * 
   * @example
   * ```typescript
   * import fs from 'fs';
   * 
   * // Save to file stream
   * const writeStream = fs.createWriteStream('./output/report.xlsx');
   * const result = await builder.saveToStream(writeStream);
   * 
   * if (result.success) {
   *   writeStream.end();
   *   console.log('File streamed successfully!');
   * }
   * 
   * // HTTP response stream
   * app.get('/download', async (req, res) => {
   *   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
   *   await builder.saveToStream(res);
   * });
   * ```
   */
  async saveToStream(writeStream: { write: (chunk: any, callback?: (error?: Error | null) => void) => boolean }, options: IBuildOptions = {}): Promise<Result<void>> {
    const buildResult = await this.build(options);
    
    if (!buildResult.success) {
      return buildResult;
    }

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
      
      // Dynamic import of Node.js buffer module
      // @ts-ignore - Dynamic import for Node.js only
      const bufferModule = await import('buffer');
      const buffer = bufferModule.Buffer.from(buildResult.data);
      
      return new Promise((resolve) => {
        writeStream.write(buffer, (error: any) => {
          if (error) {
            const errorResult = error(
              CoreErrorType.FILE_ERROR,
              error.message || 'Failed to write to stream',
              'STREAM_WRITE_FAILED'
            );
            this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: error.message });
            resolve(errorResult);
          } else {
            this.emitEvent(BuilderEventType.DOWNLOAD_COMPLETED, { fileName: 'stream' });
            resolve(success(undefined));
          }
        });
      });

    } catch (err: any) {
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        err.message || 'Failed to save to stream',
        'STREAM_FAILED'
      );

      this.emitEvent(BuilderEventType.DOWNLOAD_ERROR, { error: err.message });
      return errorResult;
    }
  }

  /**
   * Get workbook as ArrayBuffer
   * 
   * Builds the Excel file and returns it as an ArrayBuffer. This is useful when you need
   * the raw binary data for custom handling (e.g., sending via WebSocket, processing with
   * other libraries, manual file operations, etc.).
   * 
   * Works in both browser and Node.js environments.
   * 
   * @param {IBuildOptions} [options={}] - Build options
   * @param {number} [options.compressionLevel=6] - Compression level (0-9)
   * @param {boolean} [options.includeStyles=true] - Include cell styles
   * 
   * @returns {Promise<Result<ArrayBuffer>>} Result containing the Excel file as ArrayBuffer
   * 
   * @example
   * ```typescript
   * // Browser: Get buffer for custom handling
   * const result = await builder.toBuffer();
   * if (result.success) {
   *   const buffer = result.data;
   *   // Upload to server, send via WebSocket, etc.
   * }
   * 
   * // Node.js: Get buffer for manual file write
   * const result = await builder.toBuffer();
   * if (result.success) {
   *   const fs = await import('fs/promises');
   *   await fs.writeFile('./report.xlsx', Buffer.from(result.data));
   * }
   * ```
   */
  async toBuffer(options: IBuildOptions = {}): Promise<Result<ArrayBuffer>> {
    return this.build(options);
  }

  /**
   * Get workbook as Blob
   * 
   * Builds the Excel file and returns it as a Blob object. This is useful in browser
   * environments when you need to upload to a server, create object URLs for preview,
   * or handle the file programmatically without triggering an automatic download.
   * 
   * **Note**: Blob is a browser API. In Node.js, use `toBuffer()` instead.
   * 
   * @param {IBuildOptions} [options={}] - Build options
   * @param {number} [options.compressionLevel=6] - Compression level (0-9)
   * @param {boolean} [options.includeStyles=true] - Include cell styles
   * 
   * @returns {Promise<Result<Blob>>} Result containing the Excel file as Blob
   * 
   * @example
   * ```typescript
   * // Get as Blob for upload
   * const result = await builder.toBlob();
   * if (result.success) {
   *   const blob = result.data;
   *   
   *   // Upload to server
   *   const formData = new FormData();
   *   formData.append('file', blob, 'report.xlsx');
   *   await fetch('/api/upload', { method: 'POST', body: formData });
   *   
   *   // Or create preview URL
   *   const url = URL.createObjectURL(blob);
   *   window.open(url);
   * }
   * ```
   */
  async toBlob(options: IBuildOptions = {}): Promise<Result<Blob>> {
    const buildResult = await this.build(options);
    
    if (!buildResult.success) {
      return buildResult;
    }

    const blob = new Blob([buildResult.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    return success(blob);
  }

  /**
   * Validate the workbook
   * 
   * Performs validation checks on the workbook to ensure it's ready for building.
   * Validates that worksheets exist and each worksheet is valid.
   * 
   * @returns {Result<boolean>} Result indicating if the workbook is valid
   * - `success: true` - Workbook is valid and ready to build
   * - `success: false` - Validation errors found (check `error.message` for details)
   * 
   * @example
   * ```typescript
   * const validation = builder.validate();
   * if (!validation.success) {
   *   console.error('Validation errors:', validation.error?.message);
   *   return;
   * }
   * 
   * // Safe to build
   * await builder.build();
   * ```
   */
  validate(): Result<boolean> {
    const errors: string[] = [];
    
    if (this.worksheets.size === 0) {
      errors.push('No worksheets found');
    }

    // Validate each worksheet
    for (const [name, worksheet] of this.worksheets.entries()) {
      const worksheetValidation = (worksheet as Worksheet).validate();
      if (!worksheetValidation.success) {
        errors.push(`Worksheet "${name}": ${worksheetValidation.error?.message}`);
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
   * Clear all worksheets and reset the builder
   * 
   * Removes all worksheets, clears predefined cell styles, resets the theme,
   * and clears the current worksheet. This effectively resets the builder to
   * its initial state.
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Clear everything and start fresh
   * builder.clear();
   * 
   * // Now add new worksheets
   * builder.addWorksheet('NewSheet');
   * ```
   */
  clear(): void {
    this.worksheets.clear();
    this.currentWorksheet = undefined;
    this.cellStyles.clear();
    this.theme = undefined;
    this.stats = this.initializeStats();
  }

  /**
   * Get workbook statistics
   * 
   * Returns build statistics including build time, file size, number of worksheets,
   * cells, styles used, and performance metrics. Statistics are updated after each build.
   * 
   * @returns {IBuildStats} Statistics object containing:
   * - `totalWorksheets` - Number of worksheets
   * - `totalCells` - Total number of cells
   * - `memoryUsage` - Memory usage in bytes
   * - `buildTime` - Last build time in milliseconds
   * - `fileSize` - Last build file size in bytes
   * - `stylesUsed` - Number of unique styles used
   * - `formulasUsed` - Number of formulas
   * - `conditionalFormatsUsed` - Number of conditional formats
   * - `performance` - Performance breakdown by operation
   * 
   * @example
   * ```typescript
   * await builder.build();
   * const stats = builder.getStats();
   * 
   * console.log(`Build time: ${stats.buildTime}ms`);
   * console.log(`File size: ${stats.fileSize} bytes`);
   * console.log(`Worksheets: ${stats.totalWorksheets}`);
   * ```
   */
  getStats(): IBuildStats {
    return { ...this.stats };
  }

  /**
   * Add a predefined cell style
   * 
   * Defines a reusable cell style that can be referenced by name in cells using
   * the `styleName` property. This is useful for maintaining consistent styling
   * across the workbook and reducing code duplication.
   * 
   * Styles are stored at the workbook level and can be used in any worksheet.
   * 
   * @param {string} name - Unique name for the style (used to reference it later)
   * @param {IStyle} style - Style object created with StyleBuilder
   * @returns {this} Returns the builder instance for method chaining
   * 
   * @example
   * ```typescript
   * // Define reusable styles
   * builder.addCellStyle('headerStyle', StyleBuilder.create()
   *   .font({ name: 'Arial', size: 14, bold: true })
   *   .fill({ backgroundColor: '#4472C4' })
   *   .fontColor('#FFFFFF')
   *   .build()
   * );
   * 
   * // Use in cells
   * worksheet.addHeader({
   *   key: 'title',
   *   value: 'Report',
   *   type: CellType.STRING,
   *   styleName: 'headerStyle' // Reference the predefined style
   * });
   * ```
   */
  addCellStyle(name: string, style: import('../types/style.types').IStyle): this {
    this.cellStyles.set(name, style);
    return this;
  }

  /**
   * Get a predefined cell style by name
   * 
   * Retrieves a previously defined cell style by its name. Returns undefined
   * if the style doesn't exist.
   * 
   * @param {string} name - Name of the style to retrieve
   * @returns {IStyle | undefined} The style if found, undefined otherwise
   * 
   * @example
   * ```typescript
   * const style = builder.getCellStyle('headerStyle');
   * if (style) {
   *   console.log('Style found:', style);
   * }
   * ```
   */
  getCellStyle(name: string): import('../types/style.types').IStyle | undefined {
    return this.cellStyles.get(name);
  }

  /**
   * Set workbook theme
   * 
   * Applies a color and font theme to the entire workbook. Themes affect all
   * worksheets and can automatically apply styles to table sections (header, body, footer)
   * if `autoApplySectionStyles` is enabled.
   * 
   * Themes include:
   * - Color palette (dark1, light1, dark2, light2, accent1-6, hyperlink colors)
   * - Font families (major and minor fonts for latin, eastAsian, complexScript)
   * - Optional section styles for automatic styling
   * 
   * @param {IWorkbookTheme} theme - Theme configuration object
   * @param {string} [theme.name] - Theme name
   * @param {object} [theme.colors] - Color palette
   * @param {object} [theme.fonts] - Font configuration
   * @param {object} [theme.sectionStyles] - Styles for table sections
   * @param {boolean} [theme.autoApplySectionStyles=true] - Auto-apply section styles
   * 
   * @returns {this} Returns the builder instance for method chaining
   * 
   * @example
   * ```typescript
   * builder.setTheme({
   *   name: 'Corporate Theme',
   *   colors: {
   *     dark1: '#000000',
   *     light1: '#FFFFFF',
   *     accent1: '#4472C4',
   *     accent2: '#ED7D31'
   *   },
   *   fonts: {
   *     major: { latin: 'Calibri' },
   *     minor: { latin: 'Calibri' }
   *   },
   *   autoApplySectionStyles: true
   * });
   * ```
   */
  setTheme(theme: IWorkbookTheme): this {
    this.theme = theme;
    return this;
  }

  /**
   * Get current workbook theme
   * 
   * Retrieves the currently active theme, if one has been set.
   * 
   * @returns {IWorkbookTheme | undefined} The current theme, or undefined if no theme is set
   * 
   * @example
   * ```typescript
   * const theme = builder.getTheme();
   * if (theme) {
   *   console.log('Active theme:', theme.name);
   * }
   * ```
   */
  getTheme(): IWorkbookTheme | undefined {
    return this.theme;
  }

  /**
   * Register an event listener
   * 
   * Subscribes to builder events to monitor the build process. Returns a listener ID
   * that can be used to remove the listener later.
   * 
   * Available events:
   * - `build:started` - Build process started
   * - `build:completed` - Build completed successfully
   * - `build:error` - Build failed with error
   * - `download:started` - File download/save started
   * - `download:completed` - File download/save completed
   * - `download:error` - File download/save failed
   * - `worksheet:added` - New worksheet added
   * - `worksheet:removed` - Worksheet removed
   * 
   * @param {BuilderEventType} eventType - Type of event to listen for
   * @param {(event: IBuilderEvent) => void} listener - Callback function to execute when event fires
   * @returns {string} Listener ID (use with `off()` to remove the listener)
   * 
   * @example
   * ```typescript
   * const listenerId = builder.on('build:started', (event) => {
   *   console.log('Build started at', event.timestamp);
   * });
   * 
   * builder.on('build:completed', (event) => {
   *   console.log('Build completed:', event.data);
   * });
   * 
   * builder.on('build:error', (event) => {
   *   console.error('Build error:', event.data.error);
   * });
   * ```
   */
  on(eventType: BuilderEventType, listener: (event: IBuilderEvent) => void): string {
    return this.eventEmitter.on(eventType, listener);
  }

  /**
   * Remove an event listener
   * 
   * Unsubscribes from a specific event by removing the listener with the given ID.
   * 
   * @param {BuilderEventType} eventType - Type of event
   * @param {string} listenerId - Listener ID returned from `on()`
   * @returns {boolean} True if the listener was found and removed, false otherwise
   * 
   * @example
   * ```typescript
   * const listenerId = builder.on('build:started', handler);
   * 
   * // Later, remove the listener
   * builder.off('build:started', listenerId);
   * ```
   */
  off(eventType: BuilderEventType, listenerId: string): boolean {
    return this.eventEmitter.off(eventType, listenerId);
  }

  /**
   * Remove all event listeners
   * 
   * Removes all listeners for a specific event type, or all listeners for all events
   * if no event type is specified.
   * 
   * @param {BuilderEventType} [eventType] - Event type to clear listeners for. If omitted, clears all listeners
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Remove all listeners for 'build:started' event
   * builder.removeAllListeners('build:started');
   * 
   * // Remove all listeners for all events
   * builder.removeAllListeners();
   * ```
   */
  removeAllListeners(eventType?: BuilderEventType): void {
    if (eventType) {
      this.eventEmitter.offAll(eventType);
    } else {
      this.eventEmitter.clear();
    }
  }

  /**
   * Private methods
   */
  
  /**
   * Emit an event to all registered listeners
   * @private
   */
  private emitEvent(type: BuilderEventType, data?: Record<string, unknown>): void {
    if (!this.config.enableEvents) return;
    
    const event: IBuilderEvent = {
      type,
      data: data || {},
      timestamp: new Date()
    };
    this.eventEmitter.emitSync(event);
  }

  /**
   * Initialize build statistics
   * @private
   */
  private initializeStats(): IBuildStats {
    return {
      totalWorksheets: 0,
      totalCells: 0,
      memoryUsage: 0,
      buildTime: 0,
      fileSize: 0,
      stylesUsed: 0,
      formulasUsed: 0,
      conditionalFormatsUsed: 0,
      performance: {
        headersTime: 0,
        dataTime: 0,
        stylesTime: 0,
        writeTime: 0
      }
    };
  }

  /**
   * Apply theme to workbook
   * 
   * Internal method that applies the theme configuration to the ExcelJS workbook.
   * Converts theme colors and fonts to ExcelJS format.
   * 
   * @private
   * @param {ExcelJS.Workbook} workbook - ExcelJS workbook instance
   * @param {IWorkbookTheme} theme - Theme configuration
   */
  private applyTheme(workbook: ExcelJS.Workbook, theme: IWorkbookTheme): void {
    if (!workbook.model) {
      return;
    }

    // ExcelJS theme structure
    const excelTheme: any = {
      name: theme.name || 'Custom Theme'
    };

    if (theme.colors) {
      excelTheme.colors = {};
      if (theme.colors.dark1) excelTheme.colors.dark1 = this.convertColorToTheme(theme.colors.dark1);
      if (theme.colors.light1) excelTheme.colors.light1 = this.convertColorToTheme(theme.colors.light1);
      if (theme.colors.dark2) excelTheme.colors.dark2 = this.convertColorToTheme(theme.colors.dark2);
      if (theme.colors.light2) excelTheme.colors.light2 = this.convertColorToTheme(theme.colors.light2);
      if (theme.colors.accent1) excelTheme.colors.accent1 = this.convertColorToTheme(theme.colors.accent1);
      if (theme.colors.accent2) excelTheme.colors.accent2 = this.convertColorToTheme(theme.colors.accent2);
      if (theme.colors.accent3) excelTheme.colors.accent3 = this.convertColorToTheme(theme.colors.accent3);
      if (theme.colors.accent4) excelTheme.colors.accent4 = this.convertColorToTheme(theme.colors.accent4);
      if (theme.colors.accent5) excelTheme.colors.accent5 = this.convertColorToTheme(theme.colors.accent5);
      if (theme.colors.accent6) excelTheme.colors.accent6 = this.convertColorToTheme(theme.colors.accent6);
      if (theme.colors.hyperlink) excelTheme.colors.hyperlink = this.convertColorToTheme(theme.colors.hyperlink);
      if (theme.colors.followedHyperlink) excelTheme.colors.followedHyperlink = this.convertColorToTheme(theme.colors.followedHyperlink);
    }

    if (theme.fonts) {
      excelTheme.fonts = {};
      if (theme.fonts.major) {
        excelTheme.fonts.major = {
          latin: theme.fonts.major.latin || 'Calibri',
          eastAsian: theme.fonts.major.eastAsian || theme.fonts.major.latin || 'Calibri',
          complexScript: theme.fonts.major.complexScript || theme.fonts.major.latin || 'Calibri'
        };
      }
      if (theme.fonts.minor) {
        excelTheme.fonts.minor = {
          latin: theme.fonts.minor.latin || 'Calibri',
          eastAsian: theme.fonts.minor.eastAsian || theme.fonts.minor.latin || 'Calibri',
          complexScript: theme.fonts.minor.complexScript || theme.fonts.minor.latin || 'Calibri'
        };
      }
    }

    // Apply theme to workbook (ExcelJS stores theme in model)
    (workbook as any).model = (workbook as any).model || {};
    (workbook as any).model.theme = excelTheme;
  }

  /**
   * Convert color to theme format
   * 
   * Converts a Color value (hex string, RGB object, or theme color) to the format
   * expected by ExcelJS themes (hex string without #).
   * 
   * @private
   * @param {Color} color - Color to convert
   * @returns {string} Hex color string without # prefix
   */
  private convertColorToTheme(color: Color): string {
    if (typeof color === 'string') {
      // Remove # if present
      return color.startsWith('#') ? color.substring(1) : color;
    }
    if ('r' in color && 'g' in color && 'b' in color) {
      return `${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
    }
    return '000000';
  }

  /**
   * Add style to workbook
   * 
   * Stores a predefined style in the workbook so it can be accessed during worksheet
   * building. ExcelJS doesn't support named styles directly, so we store them in a custom
   * property that worksheets can access when building cells.
   * 
   * @private
   * @param {ExcelJS.Workbook} workbook - ExcelJS workbook instance
   * @param {string} name - Style name
   * @param {IStyle} style - Style object
   * 
   * @remarks
   * ExcelJS applies styles per cell, not as named styles. This method stores styles
   * in a way that worksheets can retrieve them when building cells that reference
   * the style by name.
   */
  private addStyleToWorkbook(workbook: ExcelJS.Workbook, name: string, style: import('../types/style.types').IStyle): void {
    (workbook as any).__customStyles = (workbook as any).__customStyles || {};
    (workbook as any).__customStyles[name] = style;
  }
}
