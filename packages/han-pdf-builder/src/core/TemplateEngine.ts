/**
 * TemplateEngine - Class for filling PDF templates and generating PDFs from HTML
 */

import { PDFDocument } from 'pdf-lib';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - puppeteer types may not be available in all environments
import puppeteer from 'puppeteer';
import { Result, success, error, ErrorType as CoreErrorType } from '@hannndler/core';
import {
  ITemplateConfig,
  ITemplateData,
  IHTMLTemplate,
  ITemplateFillResult
} from '../types/template.types';

/**
 * TemplateEngine class for PDF template operations
 */
export class TemplateEngine {
  /**
   * Fill PDF form fields from template
   */
  static async fillPDFTemplate(
    templateSource: string | ArrayBuffer | Uint8Array,
    data: ITemplateData
  ): Promise<Result<ITemplateFillResult>> {
    try {
      let pdfBytes: Uint8Array;

      // Load template source
      if (typeof templateSource === 'string') {
        // File path or URL - read as buffer
        if (typeof window === 'undefined') {
          // Node.js environment
          type NodeFS = typeof import('fs/promises');
          const fs = (await import('fs/promises')) as unknown as NodeFS;
          const fileBuffer = await fs.readFile(templateSource);
          pdfBytes = new Uint8Array(fileBuffer);
        } else {
          // Browser environment - fetch URL
          const response = await fetch(templateSource);
          const arrayBuffer = await response.arrayBuffer();
          pdfBytes = new Uint8Array(arrayBuffer);
        }
      } else if (templateSource instanceof ArrayBuffer) {
        pdfBytes = new Uint8Array(templateSource);
      } else {
        pdfBytes = templateSource;
      }

      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Get form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      let fieldsFilled = 0;
      const errors: string[] = [];

      // Fill form fields from data
      if (data.fields) {
        for (const [fieldName, fieldValue] of Object.entries(data.fields)) {
          try {
            const field = fields.find(f => f.getName() === fieldName);

            if (!field) {
              errors.push(`Field '${fieldName}' not found in template`);
              continue;
            }

            // Fill field based on type
            const fieldType = field.constructor.name;

            if (fieldType === 'PDFTextField') {
              const textField = form.getTextField(fieldName);
              const value = Array.isArray(fieldValue) ? fieldValue.join(', ') : String(fieldValue);
              textField.setText(value);
              fieldsFilled++;
            } else if (fieldType === 'PDFCheckBox') {
              const checkbox = form.getCheckBox(fieldName);
              const isChecked = typeof fieldValue === 'boolean' ? fieldValue : String(fieldValue).toLowerCase() === 'true';
              if (isChecked) {
                checkbox.check();
              } else {
                checkbox.uncheck();
              }
              fieldsFilled++;
            } else if (fieldType === 'PDFRadioGroup') {
              const radioGroup = form.getRadioGroup(fieldName);
              const option = Array.isArray(fieldValue) ? fieldValue[0] : String(fieldValue);
              radioGroup.select(option);
              fieldsFilled++;
            } else if (fieldType === 'PDFDropdown') {
              const dropdown = form.getDropdown(fieldName);
              const option = Array.isArray(fieldValue) ? fieldValue[0] : String(fieldValue);
              dropdown.select(option);
              fieldsFilled++;
            }
          } catch (fieldError) {
            const errorMessage = fieldError instanceof Error ? fieldError.message : 'Unknown error filling field';
            errors.push(`Error filling field '${fieldName}': ${errorMessage}`);
          }
        }
      }

      // Flatten form (make fields read-only)
      form.flatten();

      // Save PDF to buffer
      const filledPdfBytes = await pdfDoc.save();
      const buffer = filledPdfBytes.buffer.slice(
        filledPdfBytes.byteOffset,
        filledPdfBytes.byteOffset + filledPdfBytes.byteLength
      );

      return success({
        buffer: buffer as ArrayBuffer,
        fieldsFilled,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fill PDF template';
      return error(
        CoreErrorType.BUILD_ERROR,
        errorMessage,
        'TEMPLATE_FILL_ERROR',
        { originalError: err }
      );
    }
  }

  /**
   * Generate PDF from HTML template using Puppeteer
   */
  static async generatePDFFromHTML(
    template: IHTMLTemplate
  ): Promise<Result<ArrayBuffer>> {
    if (typeof window !== 'undefined') {
      // Browser environment - Puppeteer is not available
      return error(
        CoreErrorType.BUILD_ERROR,
        'generatePDFFromHTML is only available in Node.js environment. Puppeteer requires Node.js.',
        'BROWSER_ENVIRONMENT'
      );
    }

    type Browser = {
      newPage: () => Promise<{ setContent: (html: string, options?: unknown) => Promise<void>; pdf: (options?: unknown) => Promise<Buffer> }>;
      close: () => Promise<void>;
    };
    let browser: Browser | undefined;
    
    try {
      // Launch Puppeteer browser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      browser = await (puppeteer as any).launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = await (browser as any).newPage();

      // Replace template variables in HTML
      let processedHTML = template.html;
      if (template.data?.fields) {
        for (const [key, value] of Object.entries(template.data.fields)) {
          const placeholder = `{{${key}}}`;
          const replacement = Array.isArray(value) ? value.join(', ') : String(value);
          processedHTML = processedHTML.replace(new RegExp(placeholder, 'g'), replacement);
        }
      }

      // Inject CSS if provided
      if (template.css) {
        const styleTag = `<style>${template.css}</style>`;
        processedHTML = styleTag + processedHTML;
      }

      // Set page content
      await page.setContent(processedHTML, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF with options
      type PDFOptions = {
        format?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'TABLOID';
        landscape?: boolean;
        margin?: {
          top?: string;
          right?: string;
          bottom?: string;
          left?: string;
        };
        displayHeaderFooter?: boolean;
        headerTemplate?: string;
        footerTemplate?: string;
        printBackground?: boolean;
      };
      const pdfOptions: PDFOptions = {
        format: template.pdfOptions?.format || 'A4',
        landscape: template.pdfOptions?.landscape || false,
        margin: template.pdfOptions?.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        displayHeaderFooter: template.pdfOptions?.displayHeaderFooter || false,
        headerTemplate: template.pdfOptions?.headerTemplate || '',
        footerTemplate: template.pdfOptions?.footerTemplate || '',
        printBackground: template.pdfOptions?.printBackground || false
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfBuffer = await (page as any).pdf(pdfOptions);

      // Close browser
      if (browser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (browser as any).close();
      }
      browser = undefined;

      // Convert Buffer to ArrayBuffer
      const arrayBuffer = pdfBuffer.buffer.slice(
        pdfBuffer.byteOffset,
        pdfBuffer.byteOffset + pdfBuffer.byteLength
      );

      return success(arrayBuffer as ArrayBuffer);
    } catch (err: unknown) {
      // Ensure browser is closed on error
      if (browser) {
        try {
          await browser.close();
        } catch {
          // Ignore close errors
        }
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF from HTML';
      return error(
        CoreErrorType.BUILD_ERROR,
        errorMessage,
        'HTML_TO_PDF_ERROR',
        { originalError: err }
      );
    }
  }

  /**
   * Fill template configuration (wrapper method)
   */
  static async fillTemplate(
    config: ITemplateConfig,
    data: ITemplateData
  ): Promise<Result<ArrayBuffer>> {
    if (config.type === 'html') {
      // Handle HTML template
      const htmlTemplate: IHTMLTemplate = {
        html: typeof config.source === 'string' ? config.source : new TextDecoder().decode(config.source),
        data
      };

      return this.generatePDFFromHTML(htmlTemplate);
    } else {
      // Handle PDF template
      const result = await this.fillPDFTemplate(config.source, data);
      if (!result.success) {
        return result as Result<ArrayBuffer>;
      }

      return success(result.data.buffer);
    }
  }
}

