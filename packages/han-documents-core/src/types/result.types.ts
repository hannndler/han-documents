/**
 * Tipos de error comunes
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUILD_ERROR = 'BUILD_ERROR',
  STYLE_ERROR = 'STYLE_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR'
}

/**
 * Interfaz de error común
 */
export interface IError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Resultado exitoso
 */
export interface ISuccessResult<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Resultado con error
 */
export interface IErrorResult {
  success: false;
  error: IError;
}

/**
 * Tipo Result genérico
 */
export type Result<T = unknown> = ISuccessResult<T> | IErrorResult;

/**
 * Helper para crear resultado exitoso
 */
export function success<T>(data: T, message?: string): ISuccessResult<T> {
  return { success: true, data, message };
}

/**
 * Helper para crear resultado con error
 */
export function error(
  type: ErrorType,
  message: string,
  code?: string,
  details?: Record<string, unknown>
): IErrorResult {
  return {
    success: false,
    error: {
      type,
      message,
      code,
      details,
      stack: new Error().stack
    }
  };
}

