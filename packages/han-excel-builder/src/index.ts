/**
 * Han Excel Builder - Main entry point
 * Adaptado para usar tipos compartidos de han-documents-core
 */

// Core exports
export { ExcelBuilder } from './core/ExcelBuilder';
export { ExcelReader } from './core/ExcelReader';
export { Worksheet } from './core/Worksheet';
export { StyleBuilder } from './styles/StyleBuilder';

// Type exports
export * from './types/core.types';
export * from './types/cell.types';
export * from './types/worksheet.types';
export * from './types/style.types';
export * from './types/builder.types';
export * from './types/validation.types';
export * from './types/events.types';
export * from './types/reader.types';
export * from './types/compat.types';

// Constants and enums
export {
  CellType,
  NumberFormat,
  HorizontalAlignment,
  VerticalAlignment,
  BorderStyle,
  FontStyle,
  ErrorType
} from './types/core.types';

export {
  BuilderEventType,
  StylePreset
} from './types';

// Utility exports
export { EventEmitter } from './utils/EventEmitter';

// Re-export shared types from core for convenience
export type { IDocumentMetadata, IExcelMetadata } from '@han/core';
export { Result, success, error } from '@han/core';

// Default export
export { ExcelBuilder as default } from './core/ExcelBuilder';


