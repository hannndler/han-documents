/**
 * PDFPage - Represents a page in the PDF document
 * Similar to Worksheet in ExcelBuilder
 */

import PDFDocument from 'pdfkit';
import { Result, success, error, ErrorType as CoreErrorType } from '@han/core';
import {
  IPDFPage,
  IPDFPageConfig,
  IPDFSection,
  PDFSectionType
} from '../types/page.types';
import {
  IPDFContentBlock,
  ITextContent,
  IImageContent,
  ITableRow,
  IListItem,
  ITableContent,
  IListContent
} from '../types';
import { IPDFStyle, IPDFTheme } from '../types/style.types';
import { IBuildOptions } from '../types/builder.types';

// Type for PDFDocument from pdfkit
type PDFDocumentType = PDFKit.PDFDocument;

/**
 * PDFPage class for creating PDF pages
 * 
 * Similar to Worksheet in ExcelBuilder, this class manages a single page
 * with sections (header, body, footer) and content blocks.
 */
export class PDFPage implements IPDFPage {
  public config: IPDFPageConfig;
  public sections: Map<PDFSectionType, IPDFSection> = new Map();
  public content: IPDFContentBlock[] = [];
  public currentY: number = 0;
  public isBuilt = false;

  // Private state
  private customStyles: Map<string, IPDFStyle> = new Map();
  private theme?: IPDFTheme;

  /**
   * Creates a new PDFPage instance
   * 
   * @param config - Page configuration
   */
  constructor(config: IPDFPageConfig) {
    this.config = {
      size: config.size || 'A4',
      orientation: config.orientation || 'portrait',
      margins: {
        top: config.margins?.top || 72,
        right: config.margins?.right || 72,
        bottom: config.margins?.bottom || 72,
        left: config.margins?.left || 72,
        ...config.margins
      },
      backgroundColor: config.backgroundColor,
      defaultFont: config.defaultFont || 'Helvetica',
      defaultFontSize: config.defaultFontSize || 12,
      hidden: config.hidden || false,
      pageNumberFormat: config.pageNumberFormat,
      ...config,
      name: config.name // name must come after spread to ensure it's not overwritten
    };

    // Initialize sections
    this.sections.set('header', { type: 'header', content: [] });
    this.sections.set('body', { type: 'body', content: [] });
    this.sections.set('footer', { type: 'footer', content: [] });

    // Set initial Y position based on margins
    this.currentY = this.config.margins?.top || 72;
  }

  /**
   * Add header section content
   */
  addHeader(content: IPDFContentBlock | IPDFContentBlock[]): this {
    const section = this.sections.get('header');
    if (section) {
      const contents = Array.isArray(content) ? content : [content];
      section.content.push(...contents);
      this.content.push(...contents);
    }
    return this;
  }

  /**
   * Add footer section content
   */
  addFooter(content: IPDFContentBlock | IPDFContentBlock[]): this {
    const section = this.sections.get('footer');
    if (section) {
      const contents = Array.isArray(content) ? content : [content];
      section.content.push(...contents);
      this.content.push(...contents);
    }
    return this;
  }

  /**
   * Add content to body section
   */
  addContent(content: IPDFContentBlock | IPDFContentBlock[]): this {
    const section = this.sections.get('body');
    if (section) {
      const contents = Array.isArray(content) ? content : [content];
      section.content.push(...contents);
      this.content.push(...contents);
    }
    return this;
  }

  /**
   * Add text content
   */
  addText(text: string | string[], style?: IPDFStyle): this {
    const texts = Array.isArray(text) ? text : [text];
    
    for (const txt of texts) {
      const textContent: ITextContent = {
        type: 'text',
        text: txt,
        style: style
      };
      
      this.addContent(textContent);
    }
    
    return this;
  }

  /**
   * Add image content
   */
  addImage(
    source: string | ArrayBuffer | Uint8Array,
    options?: Partial<IImageContent>
  ): this {
    const imageContent: IImageContent = {
      type: 'image',
      source,
      position: options?.position || {
        x: this.config.margins?.left || 72,
        y: this.currentY,
        width: options?.position?.width,
        height: options?.position?.height,
        type: 'relative'
      },
      format: options?.format,
      maintainAspectRatio: options?.maintainAspectRatio ?? true,
      opacity: options?.opacity,
      link: options?.link
    };

    this.addContent(imageContent);
    
    // Update current Y position if relative positioning
    if (imageContent.position.type === 'relative' || !imageContent.position.type) {
      const height = imageContent.position.height || 100; // Default height
      this.currentY += height + 10; // Add spacing
    }
    
    return this;
  }

  /**
   * Add table (placeholder for now)
   */
  addTable(rows: ITableRow[], options?: Partial<Omit<ITableContent, 'type' | 'rows'>>): this {
    const tableContent: ITableContent = {
      type: 'table',
      rows,
      ...options
    };
    
    // Add to body section by default
    this.addContent(tableContent);
    return this;
  }

  /**
   * Add list
   */
  addList(items: IListItem[], options?: Partial<Omit<IListContent, 'type' | 'items'>>): this {
    const listContent: IListContent = {
      type: 'list',
      items,
      listType: options?.listType || 'unordered',
      bullet: options?.bullet || '•',
      ...options
    };
    
    // Add to body section by default
    this.addContent(listContent);
    return this;
  }

  /**
   * Build the page using PDFKit
   */
  async build(doc: PDFDocumentType, options: IBuildOptions = {}): Promise<void> {
    if (this.isBuilt || this.config.hidden) {
      return;
    }

    // Get page size
    const pageSize = this.getPageSize();
    
    // Add page to document
    // Note: margins in addPage() are informational only in PDFKit
    // We handle margins manually when positioning content
    doc.addPage({
      size: pageSize,
      layout: this.config.orientation || 'portrait'
    });

    // Set background color if specified
    if (this.config.backgroundColor) {
      const color = this.convertColor(this.config.backgroundColor);
      doc.rect(0, 0, pageSize[0], pageSize[1]).fill(color);
    }

    // Build sections
    await this.buildSection(doc, this.sections.get('header')!, options);
    await this.buildSection(doc, this.sections.get('body')!, options);
    await this.buildSection(doc, this.sections.get('footer')!, options);

    this.isBuilt = true;
  }

  /**
   * Build a section
   */
  private async buildSection(
    doc: PDFDocumentType,
    section: IPDFSection,
    options: IBuildOptions
  ): Promise<void> {
    // Skip empty sections
    if (!section.content || section.content.length === 0) {
      return;
    }

    let yPosition: number;
    
    if (section.type === 'header') {
      yPosition = this.config.margins?.top || 72;
    } else if (section.type === 'footer') {
      yPosition = doc.page.height - (this.config.margins?.bottom || 72) - 20; // Leave space for text
    } else {
      // body section - start after margins
      yPosition = this.config.margins?.top || 72;
    }

    for (const content of section.content) {
      yPosition = await this.buildContent(doc, content, yPosition, options);
    }
  }

  /**
   * Build content block
   */
  private async buildContent(
    doc: PDFDocumentType,
    content: IPDFContentBlock,
    yPosition: number,
    options: IBuildOptions
  ): Promise<number> {
    switch (content.type) {
      case 'text':
        return this.buildText(doc, content as ITextContent, yPosition);
      case 'image':
        return this.buildImage(doc, content as IImageContent, yPosition);
      case 'table':
        return this.buildTable(doc, content as ITableContent, yPosition);
      case 'list':
        return this.buildList(doc, content as IListContent, yPosition);
      default:
        // Other content types not yet implemented
        return yPosition;
    }
  }

  /**
   * Build text content
   */
  private buildText(
    doc: PDFDocumentType,
    content: ITextContent,
    yPosition: number
  ): number {
    const style = content.style || {};
    const font = style.font || {};
    
    // Determine font family based on style
    const baseFontFamily = font.family || this.config.defaultFont || 'Helvetica';
    const fontSize = font.size || this.config.defaultFontSize || 12;
    
    let finalFontFamily = baseFontFamily;
    if (font.style === 'bold') {
      finalFontFamily = 'Helvetica-Bold';
    } else if (font.style === 'italic') {
      finalFontFamily = 'Helvetica-Oblique';
    } else if (font.style === 'bolditalic') {
      // Note: PDFKit doesn't have bolditalic directly, using bold as fallback
      finalFontFamily = 'Helvetica-Bold';
    }
    
    // Set font and size together - this is critical!
    doc.font(finalFontFamily).fontSize(fontSize);

    // Set text color (default to black if not specified)
    if (font.color) {
      const color = this.convertColor(font.color);
      doc.fillColor(color);
    } else {
      doc.fillColor('black'); // Default text color
    }

    // Get position - PDFKit uses absolute coordinates from top-left (0,0)
    // If margins are set in addPage, we need to use absolute coordinates
    const leftMargin = this.config.margins?.left || 72;
    const x = content.position?.x !== undefined ? content.position.x : leftMargin;
    
    // Use provided Y or the current Y position
    const y = content.position?.y !== undefined ? content.position.y : yPosition;

    // Add text - handle both string and array of strings/rich text
    let textValue: string;
    if (typeof content.text === 'string') {
      textValue = content.text;
    } else if (Array.isArray(content.text)) {
      textValue = content.text.map(run => typeof run === 'string' ? run : run.text).join('');
    } else {
      textValue = '';
    }
    
    if (!textValue || textValue.trim() === '') {
      return yPosition; // Skip empty text
    }

    // Calculate available width for text wrapping
    // Note: PDFKit's page.width already accounts for the page size
    const pageWidth = doc.page.width;
    const rightMargin = this.config.margins?.right || 72;
    const availableWidth = content.position?.width || (pageWidth - x - rightMargin);
    
    // Ensure width is positive
    const finalWidth = Math.max(availableWidth, pageWidth - x - rightMargin);
    
    // Add text to PDF - PDFKit will handle wrapping within the width
    doc.text(textValue, x, y, {
      width: finalWidth > 0 ? finalWidth : undefined,
      align: (style.alignment?.horizontal || 'left') as 'left' | 'center' | 'right' | 'justify',
      lineGap: style.lineSpacing ? (style.lineSpacing - 1) * (font.size || this.config.defaultFontSize || 12) : undefined
    });

    // Calculate new Y position based on actual text height
    const textHeight = doc.heightOfString(textValue, {
      width: finalWidth > 0 ? finalWidth : undefined
    });

    return y + textHeight + 10; // Add spacing between text blocks
  }

  /**
   * Build image content
   */
  private async buildImage(
    doc: PDFDocumentType,
    content: IImageContent,
    yPosition: number
  ): Promise<number> {
    const x = content.position.x || (this.config.margins?.left || 72);
    const y = content.position.y || yPosition;
    const width = content.position.width;
    const height = content.position.height;

    try {
      const imageOptions: PDFKit.Mixins.ImageOption = {
        width,
        height,
        fit: content.maintainAspectRatio && width && height ? [width, height] : undefined
      };
      
      // Note: PDFKit doesn't support opacity directly in image() method
      // Opacity would need to be handled via graphics state if needed
      
      if (typeof content.source === 'string') {
        // Path or URL
        doc.image(content.source, x, y, imageOptions);
      } else {
        // Buffer or ArrayBuffer - need to convert to Buffer for Node.js
        // PDFKit expects Buffer | ArrayBuffer | string
        type BufferConstructor = {
          from(arrayBuffer: ArrayBufferLike): Uint8Array;
          from(array: Uint8Array): Uint8Array;
        };
        const BufferCtor = (typeof global !== 'undefined' && (global as { Buffer?: BufferConstructor }).Buffer) as BufferConstructor | undefined;
        
        let buffer: PDFKit.Mixins.ImageSrc;
        if (content.source instanceof ArrayBuffer) {
          buffer = BufferCtor
            ? BufferCtor.from(content.source) as PDFKit.Mixins.ImageSrc
            : content.source as PDFKit.Mixins.ImageSrc;
        } else if (content.source instanceof Uint8Array) {
          buffer = BufferCtor
            ? BufferCtor.from(content.source) as PDFKit.Mixins.ImageSrc
            : content.source.buffer as ArrayBuffer;
        } else {
          // Already a Buffer or string
          buffer = content.source as PDFKit.Mixins.ImageSrc;
        }
        
        doc.image(buffer, x, y, imageOptions);
      }

      // Calculate new Y position
      const imageHeight = height || 100;
      return y + imageHeight + 10; // Add spacing
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error adding image:', errorMessage);
      return yPosition;
    }
  }

  /**
   * Build table content
   */
  private buildTable(
    doc: PDFDocumentType,
    content: ITableContent,
    yPosition: number
  ): number {
    if (!content.rows || content.rows.length === 0) {
      return yPosition;
    }

    const leftMargin = this.config.margins?.left || 72;
    const rightMargin = this.config.margins?.right || 72;
    const pageWidth = doc.page.width;
    const availableWidth = content.position?.width || (pageWidth - leftMargin - rightMargin);
    
    // Calculate column widths
    const maxColumns = Math.max(...content.rows.map(row => row.cells.length));
    const columnWidths = content.columnWidths || this.calculateColumnWidths(content.rows, maxColumns, availableWidth);
    
    // Table style
    const tableStyle = content.style || {};
    const cellPadding = 5; // Default padding
    const rowHeight = tableStyle.font?.size || this.config.defaultFontSize || 12;
    const headerRowHeight = rowHeight + 10; // Extra height for header
    
    // Starting position
    const startX = content.position?.x !== undefined ? content.position.x : leftMargin;
    let currentY = content.position?.y !== undefined ? content.position.y : yPosition;
    
    // Draw table borders if style requires
    // IBorderSides has top/left/bottom/right, use top border as default
    const defaultBorder = tableStyle.border?.top || tableStyle.border?.left || tableStyle.border?.bottom || tableStyle.border?.right;
    const borderColor = defaultBorder?.color ? this.convertColor(defaultBorder.color) : '#000000';
    const borderWidth = defaultBorder?.width || 1;
    
    // Draw header row if first row should be styled differently
    const hasHeader = content.rows.length > 0;
    
    // Draw each row
    content.rows.forEach((row, rowIndex) => {
      const isHeaderRow = hasHeader && rowIndex === 0;
      const currentRowHeight = isHeaderRow ? headerRowHeight : rowHeight + cellPadding * 2;
      
      // Draw cells in row
      let currentX = startX;
      let actualColIndex = 0;
      
      row.cells.forEach((cell) => {
        const colSpan = cell.colSpan || 1;
        const cellWidth = columnWidths.slice(actualColIndex, actualColIndex + colSpan).reduce((sum, w) => sum + w, 0);
        
        // Draw cell border
        if (borderWidth > 0) {
          doc.strokeColor(borderColor).lineWidth(borderWidth);
          doc.rect(currentX, currentY, cellWidth, currentRowHeight).stroke();
        }
        
        // Fill cell background if specified
        if (cell.style?.fill?.color) {
          const fillColor = this.convertColor(cell.style.fill.color);
          doc.fillColor(fillColor).rect(currentX, currentY, cellWidth, currentRowHeight).fill();
        } else if (isHeaderRow && tableStyle.fill?.color) {
          const fillColor = this.convertColor(tableStyle.fill.color);
          doc.fillColor(fillColor).rect(currentX, currentY, cellWidth, currentRowHeight).fill();
        }
        
        // Get cell text
        let cellText = '';
        if (typeof cell.content === 'string') {
          cellText = cell.content;
        } else if (cell.content && typeof cell.content === 'object' && 'text' in cell.content) {
          if (typeof cell.content.text === 'string') {
            cellText = cell.content.text;
          } else if (Array.isArray(cell.content.text)) {
            cellText = cell.content.text.map(run => typeof run === 'string' ? run : run.text).join('');
          }
        }
        
        // Set cell font style
        const cellFont = cell.style?.font || row.style?.font || tableStyle.font || {};
        const fontFamily = cellFont.family || this.config.defaultFont || 'Helvetica';
        const fontSize = cellFont.size || this.config.defaultFontSize || 12;
        
        let finalFontFamily = fontFamily;
        if (cellFont.style === 'bold') {
          finalFontFamily = 'Helvetica-Bold';
        } else if (cellFont.style === 'italic') {
          finalFontFamily = 'Helvetica-Oblique';
        } else if (cellFont.style === 'bolditalic') {
          finalFontFamily = 'Helvetica-Bold';
        }
        
        if (isHeaderRow) {
          finalFontFamily = 'Helvetica-Bold'; // Headers are bold by default
        }
        
        doc.font(finalFontFamily).fontSize(fontSize);
        
        // Set text color
        const textColor = cellFont.color || (isHeaderRow ? '#000000' : '#000000');
        if (textColor) {
          doc.fillColor(this.convertColor(textColor));
        } else {
          doc.fillColor('black');
        }
        
        // Text alignment
        const alignment = cell.style?.alignment?.horizontal || row.style?.alignment?.horizontal || tableStyle.alignment?.horizontal || 'left';
        
        // Calculate text position with padding
        const textX = currentX + cellPadding;
        const textY = currentY + cellPadding;
        const textWidth = cellWidth - cellPadding * 2;
        
        // Draw text
        if (cellText) {
          doc.text(cellText, textX, textY, {
            width: textWidth,
            align: alignment as 'left' | 'center' | 'right' | 'justify'
          });
        }
        
        currentX += cellWidth;
        actualColIndex += colSpan;
      });
      
      currentY += currentRowHeight;
    });
    
    return currentY + 10; // Add spacing after table
  }

  /**
   * Calculate column widths automatically
   */
  private calculateColumnWidths(rows: ITableRow[], maxColumns: number, availableWidth: number): number[] {
    if (maxColumns === 0) {
      return [];
    }
    
    // Simple equal width distribution
    // TODO: Could be improved to calculate based on content width
    const equalWidth = availableWidth / maxColumns;
    return Array(maxColumns).fill(equalWidth);
  }

  /**
   * Build list content
   */
  private buildList(
    doc: PDFDocumentType,
    content: IListContent,
    yPosition: number
  ): number {
    if (!content.items || content.items.length === 0) {
      return yPosition;
    }

    const leftMargin = this.config.margins?.left || 72;
    const rightMargin = this.config.margins?.right || 72;
    const pageWidth = doc.page.width;
    const availableWidth = content.position?.width || (pageWidth - leftMargin - rightMargin);
    
    const listStyle = content.style || {};
    const font = listStyle.font?.family || this.config.defaultFont || 'Helvetica';
    const fontSize = listStyle.font?.size || this.config.defaultFontSize || 12;
    
    const startX = content.position?.x !== undefined ? content.position.x : leftMargin;
    let currentY = content.position?.y !== undefined ? content.position.y : yPosition;
    
    // Bullet settings
    const bullet = content.bullet || '•';
    const bulletWidth = 20;
    const indent = content.listType === 'ordered' ? 30 : 25;
    const lineSpacing = listStyle.lineSpacing ? (listStyle.lineSpacing - 1) * fontSize : 5;
    
    // Draw each list item
    content.items.forEach((item, index) => {
      // Get item text
      let itemText = '';
      if (typeof item.content === 'string') {
        itemText = item.content;
      } else if (item.content && typeof item.content === 'object' && 'text' in item.content) {
        if (typeof item.content.text === 'string') {
          itemText = item.content.text;
        } else if (Array.isArray(item.content.text)) {
          itemText = item.content.text.map(run => typeof run === 'string' ? run : run.text).join('');
        }
      }
      
      // Item style
      const itemFont = item.style?.font || listStyle.font || {};
      const itemFontFamily = itemFont.family || font;
      const itemFontSize = itemFont.size || fontSize;
      
      let finalFontFamily = itemFontFamily;
      if (itemFont.style === 'bold') {
        finalFontFamily = 'Helvetica-Bold';
      } else if (itemFont.style === 'italic') {
        finalFontFamily = 'Helvetica-Oblique';
      } else if (itemFont.style === 'bolditalic') {
        finalFontFamily = 'Helvetica-Bold';
      }
      
      doc.font(finalFontFamily).fontSize(itemFontSize);
      
      // Text color
      const textColor = itemFont.color || listStyle.font?.color || '#000000';
      doc.fillColor(this.convertColor(textColor));
      
      // Draw bullet or number
      if (content.listType !== 'none') {
        const bulletText = content.listType === 'ordered' ? `${index + 1}.` : bullet;
        doc.text(bulletText, startX, currentY, {
          width: bulletWidth,
          align: 'right'
        });
      }
      
      // Draw item text
      if (itemText) {
        const textX = startX + indent;
        const textWidth = availableWidth - indent;
        
        doc.text(itemText, textX, currentY, {
          width: textWidth,
          align: 'left'
        });
        
        // Calculate text height
        const textHeight = doc.heightOfString(itemText, {
          width: textWidth
        });
        
        currentY += textHeight + lineSpacing;
      } else {
        currentY += itemFontSize + lineSpacing;
      }
      
      // Handle nested items (recursive)
      if (item.items && item.items.length > 0) {
        const nestedList: IListContent = {
          ...content,
          items: item.items,
          position: {
            ...content.position,
            x: startX + indent + 20, // Additional indent for nested
            y: currentY
          }
        };
        currentY = this.buildList(doc, nestedList, currentY);
      }
    });
    
    return currentY + 10; // Add spacing after list
  }

  /**
   * Get page size in points
   */
  private getPageSize(): [number, number] {
    const size = this.config.size || 'A4';
    
    if (Array.isArray(size)) {
      return size;
    }

    // Standard page sizes in points (1/72 inch)
    const sizes: Record<string, [number, number]> = {
      'A4': [595.28, 841.89],
      'A3': [841.89, 1190.55],
      'A5': [420.94, 595.28],
      'LETTER': [612, 792],
      'LEGAL': [612, 1008],
      'TABLOID': [792, 1224]
    };

    return sizes[size] || sizes['A4'];
  }

  /**
   * Convert color to PDFKit format
   */
  private convertColor(color: string | { r: number; g: number; b: number } | { theme: number } | { c: number; m: number; y: number; k: number }): string {
    if (typeof color === 'string') {
      // Hex color
      if (color.startsWith('#')) {
        const hex = color.substring(1);
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return `rgb(${r}, ${g}, ${b})`;
      }
      return color;
    }
    
    // RGB object
    if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
      return `rgb(${color.r / 255}, ${color.g / 255}, ${color.b / 255})`;
    }
    
    // CMYK object
    if (color && typeof color === 'object' && 'c' in color && 'm' in color && 'y' in color && 'k' in color) {
      return `cmyk(${color.c}, ${color.m}, ${color.y}, ${color.k})`;
    }
    
    // Theme color - fallback to black
    return 'rgb(0, 0, 0)';
  }

  /**
   * Validate the page
   */
  validate(): Result<boolean> {
    if (this.config.hidden) {
      return success(true);
    }

    // Check if page has content
    if (this.content.length === 0 && this.sections.get('body')?.content.length === 0) {
      return error(
        CoreErrorType.VALIDATION_ERROR,
        'Page is empty',
        'EMPTY_PAGE'
      );
    }

    return success(true);
  }
}

