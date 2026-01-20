/**
 * Template-specific type definitions for PDF Builder
 */

import { Result } from '@han/core';
import { IPDFContentBlock } from './content.types';

/**
 * Template configuration interface
 */
export interface ITemplateConfig {
  /** Template type */
  type: 'pdf' | 'html';
  /** Template source (path, buffer, or HTML string) */
  source: string | ArrayBuffer | Uint8Array;
  /** Template data mapping */
  dataMapping?: Record<string, string>;
}

/**
 * Template data interface - data to fill into template
 */
export interface ITemplateData {
  /** Field values (field name -> value) */
  fields?: Record<string, string | number | boolean | string[]>;
  /** Content blocks to insert */
  content?: IPDFContentBlock[];
  /** Custom data */
  custom?: Record<string, unknown>;
}

/**
 * HTML template configuration interface
 */
export interface IHTMLTemplate {
  /** HTML template string */
  html: string;
  /** CSS styles (optional, can be inline or in <style> tag) */
  css?: string;
  /** Template data */
  data?: ITemplateData;
  /** PDF options for puppeteer */
  pdfOptions?: {
    /** Page size */
    format?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'TABLOID';
    /** Orientation */
    landscape?: boolean;
    /** Margins */
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    /** Display header/footer */
    displayHeaderFooter?: boolean;
    /** Header template (HTML) */
    headerTemplate?: string;
    /** Footer template (HTML) */
    footerTemplate?: string;
    /** Print background graphics */
    printBackground?: boolean;
  };
}

/**
 * PDF template fill result
 */
export interface ITemplateFillResult {
  /** Filled PDF as buffer */
  buffer: ArrayBuffer;
  /** Number of fields filled */
  fieldsFilled: number;
  /** Errors during filling (if any) */
  errors?: string[];
}

