/**
 * Tipos de compatibilidad para mantener la misma API pública
 * Estos son aliases de los tipos compartidos de han-documents-core
 */

import { 
  IDocumentMetadata, 
  IExcelMetadata,
  Result as CoreResult,
  ISuccessResult as CoreISuccessResult,
  IErrorResult as CoreIErrorResult,
  IError as CoreIError,
  ErrorType as CoreErrorType,
  Color as CoreColor
} from '@hannndler/core';

/**
 * Alias para compatibilidad con código existente
 * IWorkbookMetadata ahora es IDocumentMetadata
 */
export type IWorkbookMetadata = IExcelMetadata;

/**
 * Re-exportar Result como alias para compatibilidad
 */
export type Result<T = unknown> = CoreResult<T>;
export type ISuccessResult<T = unknown> = CoreISuccessResult<T>;
export type IErrorResult = CoreIErrorResult;
export type IError = CoreIError;

/**
 * Re-exportar ErrorType con tipos adicionales específicos de Excel
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUILD_ERROR = 'BUILD_ERROR',
  STYLE_ERROR = 'STYLE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  WORKSHEET_ERROR = 'WORKSHEET_ERROR',
  CELL_ERROR = 'CELL_ERROR'
}

/**
 * Re-exportar Color como alias
 */
export type Color = CoreColor;

