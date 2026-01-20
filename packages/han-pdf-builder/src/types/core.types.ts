/**
 * Core type definitions for Han PDF Builder
 * Adaptado para usar tipos compartidos de han-documents-core
 */

import { Color, IDocumentMetadata, Result, ErrorType as CoreErrorType } from '@han/core';

// Re-export tipos compartidos
export type { Color, Result, IDocumentMetadata } from '@han/core';
// Use CoreErrorType from @han/core instead of local enum
export { ErrorType as CoreErrorType } from '@han/core';

// Local ErrorType enum (for compatibility, may add PDF-specific errors later)
export enum LocalErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUILD_ERROR = 'BUILD_ERROR',
  STYLE_ERROR = 'STYLE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  READER_ERROR = 'READER_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR'
}

// Re-export as ErrorType for convenience (use CoreErrorType from @han/core)
export type { CoreErrorType as ErrorType };

