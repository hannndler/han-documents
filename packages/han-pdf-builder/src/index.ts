/**
 * Han PDF Builder - Main entry point
 */

// Core exports
export { PDFBuilder } from './core/PDFBuilder';
export { PDFReader } from './core/PDFReader';
export { TemplateEngine } from './core/TemplateEngine';
export { PDFPage } from './core/PDFPage';

// Type exports
export * from './types/core.types';
export * from './types/content.types';
export * from './types/page.types';
export * from './types/style.types';
export * from './types/builder.types';
export * from './types/reader.types';
export * from './types/template.types';

// Constants and enums
export {
  StylePreset
} from './types';

// Utility exports
export { EventEmitter } from './utils/EventEmitter';

// Re-export shared types from core for convenience
export type { IDocumentMetadata } from '@hannndler/core';
export { Result, success, error } from '@hannndler/core';// Default export
export { PDFBuilder as default } from './core/PDFBuilder';
