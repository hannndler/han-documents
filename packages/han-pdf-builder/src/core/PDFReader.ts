/**
 * PDFReader - Class for reading PDF files and converting them to JSON
 */

import * as pdfjsLib from 'pdfjs-dist';
import { Result, success, error, ErrorType as CoreErrorType, IDocumentMetadata } from '@han/core';
import {
  IPDFReaderOptions,
  IJsonPDF,
  IPDFPageData,
  IExtractedContent,
  IExtractedImage,
  IExtractedForm,
  IExtractedLink,
  OutputFormat,
  IDetailedFormat,
  IDetailedContentBlock,
  IFlatFormat,
  PDFReaderResult
} from '../types/reader.types';

// Configure pdfjs-dist worker (required for PDF.js to work)
// Note: In production, this should point to the actual worker file
if (typeof window !== 'undefined') {
  // Browser environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} else {
  // Node.js environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * PDFReader class for reading PDF files and converting to JSON
 */
export class PDFReader {
  /**
   * Read PDF file from ArrayBuffer
   */
  static async fromBuffer<T extends OutputFormat = OutputFormat.PAGES>(
    buffer: ArrayBuffer,
    options: IPDFReaderOptions = {}
  ): Promise<PDFReaderResult<T>> {
    const startTime = Date.now();

    try {
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        useSystemFonts: true
      });

      const pdfDocument = await loadingTask.promise;

      const outputFormat = (options.outputFormat || OutputFormat.PAGES) as OutputFormat;
      const processingTime = Date.now() - startTime;

      let result: unknown;

      switch (outputFormat) {
        case OutputFormat.DETAILED:
          result = await this.convertToDetailedFormat(pdfDocument, options);
          break;
        case OutputFormat.FLAT:
          result = await this.convertToFlatFormat(pdfDocument, options);
          break;
        case OutputFormat.PAGES:
        default:
          result = await this.convertToPagesFormat(pdfDocument, options);
          break;
      }

      // Apply mapper function if provided
      if (options.mapper) {
        try {
          // Apply mapper based on output format
          switch (outputFormat) {
            case OutputFormat.DETAILED:
              result = (options.mapper as (data: IDetailedFormat) => unknown)(result as IDetailedFormat);
              break;
            case OutputFormat.FLAT:
              result = (options.mapper as (data: IFlatFormat) => unknown)(result as IFlatFormat);
              break;
            case OutputFormat.PAGES:
            default:
              result = (options.mapper as (data: IJsonPDF) => unknown)(result as IJsonPDF);
              break;
          }
        } catch (mapperError) {
          const errorResult = error(
            CoreErrorType.VALIDATION_ERROR,
            mapperError instanceof Error
              ? `Mapper function error: ${mapperError.message}`
              : 'Error in mapper function',
            'MAPPER_ERROR',
            { originalError: mapperError }
          );
          return {
            ...errorResult,
            processingTime: Date.now() - startTime
          } as PDFReaderResult<T>;
        }
      }

      const successResult = success(result as T);
      const resultWithTime = {
        ...successResult,
        processingTime
      };
      return resultWithTime as unknown as PDFReaderResult<T>;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read PDF file';
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        errorMessage,
        'PDF_READ_ERROR',
        { originalError: err }
      );
      return {
        ...errorResult,
        processingTime: Date.now() - startTime
      } as PDFReaderResult<T>;
    }
  }

  /**
   * Read PDF file from file path (Node.js only)
   */
  static async fromFile<T extends OutputFormat = OutputFormat.PAGES>(
    filePath: string,
    options: IPDFReaderOptions = {}
  ): Promise<PDFReaderResult<T>> {
    try {
      // Dynamic import of Node.js modules
      type NodeFS = typeof import('fs/promises');
      const fs = (await import('fs/promises')) as unknown as NodeFS;
      
      const fileBuffer = await fs.readFile(filePath);
      const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      
      return this.fromBuffer<T>(arrayBuffer, options);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read PDF file from path';
      const errorResult = error(
        CoreErrorType.FILE_ERROR,
        errorMessage,
        'FILE_READ_ERROR',
        { originalError: err }
      );
      return {
        ...errorResult,
        processingTime: 0
      } as PDFReaderResult<T>;
    }
  }

  /**
   * Convert PDF document to pages format
   */
  private static async convertToPagesFormat(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    options: IPDFReaderOptions
  ): Promise<IJsonPDF> {
    const totalPages = pdfDocument.numPages;
    const pages: IPDFPageData[] = [];
    
    // Determine which pages to read
    const pageNumbers = this.getPageNumbers(options.pageNumbers, totalPages);

    // Extract metadata
    const metadata = await this.extractMetadata(pdfDocument);

    // Process each page
    for (const pageNum of pageNumbers) {
      const page = await pdfDocument.getPage(pageNum);
      const content = await this.extractPageContent(page, pageNum, options);
      
      // Skip empty pages if not included
      if (!options.includeEmptyPages && (!content.text || content.text.trim() === '') && 
          (!content.images || content.images.length === 0)) {
        continue;
      }

      pages.push({
        pageNumber: pageNum,
        width: page.view[2] - page.view[0],
        height: page.view[3] - page.view[1],
        content,
        metadata: {
          rotation: page.rotate || undefined
        }
      });
    }

    return {
      metadata,
      pages,
      totalPages
    };
  }

  /**
   * Convert PDF document to detailed format
   */
  private static async convertToDetailedFormat(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    options: IPDFReaderOptions
  ): Promise<IDetailedFormat> {
    const totalPages = pdfDocument.numPages;
    const contentBlocks: IDetailedContentBlock[] = [];
    
    const pageNumbers = this.getPageNumbers(options.pageNumbers, totalPages);

    // Extract metadata
    const metadata = await this.extractMetadata(pdfDocument);

    // Process each page
    for (const pageNum of pageNumbers) {
      const page = await pdfDocument.getPage(pageNum);
      const extracted = await this.extractPageContent(page, pageNum, options);
      
      // Add text blocks
      if (extracted.text) {
        contentBlocks.push({
          type: 'text',
          value: extracted.text,
          position: {
            x: 0,
            y: 0,
            page: pageNum
          }
        });
      }

      // Add image blocks
      if (extracted.images && options.extractImages) {
        for (const image of extracted.images) {
          contentBlocks.push({
            type: 'image',
            value: image.data,
            position: {
              ...image.position!,
              page: pageNum
            }
          });
        }
      }

      // Add form blocks
      if (extracted.forms && options.extractForms) {
        for (const form of extracted.forms) {
          contentBlocks.push({
            type: 'form',
            value: form.value,
            position: {
              ...form.position!,
              page: pageNum
            }
          });
        }
      }

      // Add link blocks
      if (extracted.links && options.extractLinks) {
        for (const link of extracted.links) {
          contentBlocks.push({
            type: 'link',
            value: link.url,
            position: {
              ...link.position!,
              page: pageNum
            }
          });
        }
      }
    }

    return {
      metadata,
      content: contentBlocks,
      totalPages
    };
  }

  /**
   * Convert PDF document to flat format
   */
  private static async convertToFlatFormat(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    options: IPDFReaderOptions
  ): Promise<IFlatFormat> {
    const totalPages = pdfDocument.numPages;
    const textParts: string[] = [];
    
    const pageNumbers = this.getPageNumbers(options.pageNumbers, totalPages);

    // Extract metadata
    const metadata = await this.extractMetadata(pdfDocument);

    // Process each page
    for (const pageNum of pageNumbers) {
      const page = await pdfDocument.getPage(pageNum);
      const content = await this.extractPageContent(page, pageNum, options);
      
      if (content.text) {
        textParts.push(content.text);
      }
    }

    return {
      metadata,
      text: textParts.join('\n\n'),
      totalPages
    };
  }

  /**
   * Extract page content (text, images, forms, links)
   */
  private static async extractPageContent(
    page: pdfjsLib.PDFPageProxy,
    pageNum: number,
    options: IPDFReaderOptions
  ): Promise<IExtractedContent> {
    const content: IExtractedContent = {};

    // Extract text
    const textContent = await page.getTextContent();
    if (textContent.items && textContent.items.length > 0) {
      content.text = textContent.items
        .map(item => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
    }

    // Extract images (if requested)
    if (options.extractImages) {
      // Note: Image extraction is more complex and may require additional processing
      // This is a placeholder implementation
      content.images = [];
    }

    // Extract forms (if requested)
    if (options.extractForms) {
      // Note: Form extraction requires additional processing
      // This is a placeholder implementation
      content.forms = [];
    }

    // Extract links (if requested)
    if (options.extractLinks) {
      const annotations = await page.getAnnotations();
      const links: IExtractedLink[] = [];
      
      for (const annotation of annotations) {
        if (annotation.subtype === 'Link' && annotation.url) {
          links.push({
            url: annotation.url,
            text: annotation.contents || undefined,
            position: annotation.rect ? {
              x: annotation.rect[0],
              y: annotation.rect[1],
              width: annotation.rect[2] - annotation.rect[0],
              height: annotation.rect[3] - annotation.rect[1]
            } : undefined
          });
        }
      }
      
      if (links.length > 0) {
        content.links = links;
      }
    }

    return content;
  }

  /**
   * Extract PDF metadata
   */
  private static async extractMetadata(
    pdfDocument: pdfjsLib.PDFDocumentProxy
  ): Promise<IDocumentMetadata | undefined> {
    try {
      const metadata = await pdfDocument.getMetadata();
      
      if (!metadata || !metadata.info) {
        return undefined;
      }

      const info = metadata.info as {
        Title?: string;
        Author?: string;
        Subject?: string;
        Keywords?: string;
        Creator?: string;
        Producer?: string;
        CreationDate?: string;
        ModDate?: string;
      };
      return {
        title: info.Title || undefined,
        author: info.Author || undefined,
        subject: info.Subject || undefined,
        keywords: info.Keywords ? info.Keywords.split(',').map((k: string) => k.trim()) : undefined,
        // producer is not part of IDocumentMetadata, storing in application instead
        application: info.Producer || undefined,
        created: info.CreationDate ? new Date(info.CreationDate) : undefined,
        modified: info.ModDate ? new Date(info.ModDate) : undefined
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get page numbers to read based on options
   */
  private static getPageNumbers(
    pageNumbers: number | number[] | undefined,
    totalPages: number
  ): number[] {
    if (pageNumbers === undefined) {
      // Read all pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (typeof pageNumbers === 'number') {
      // Single page
      if (pageNumbers < 1 || pageNumbers > totalPages) {
        return [];
      }
      return [pageNumbers];
    }

    // Array of pages - filter valid page numbers
    return pageNumbers.filter(num => num >= 1 && num <= totalPages);
  }
}

