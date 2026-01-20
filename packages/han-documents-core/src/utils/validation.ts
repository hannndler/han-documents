import { ErrorType, error, Result, success } from '../types/result.types';

/**
 * Valida que un valor no sea null/undefined
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): Result<T> {
  if (value === null || value === undefined) {
    return error(
      ErrorType.VALIDATION_ERROR,
      `${fieldName} is required`,
      'REQUIRED_FIELD'
    );
  }
  return success(value);
}

/**
 * Valida que un string tenga longitud mínima
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string = 'Value'
): Result<string> {
  if (value.length < minLength) {
    return error(
      ErrorType.VALIDATION_ERROR,
      `${fieldName} must be at least ${minLength} characters`,
      'MIN_LENGTH'
    );
  }
  return success(value);
}

/**
 * Valida que un número esté en un rango
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): Result<number> {
  if (value < min || value > max) {
    return error(
      ErrorType.VALIDATION_ERROR,
      `${fieldName} must be between ${min} and ${max}`,
      'OUT_OF_RANGE'
    );
  }
  return success(value);
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): Result<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return error(
      ErrorType.VALIDATION_ERROR,
      'Invalid email format',
      'INVALID_EMAIL'
    );
  }
  return success(email);
}

/**
 * Valida formato de URL
 */
export function validateUrl(url: string): Result<string> {
  try {
    new URL(url);
    return success(url);
  } catch {
    return error(
      ErrorType.VALIDATION_ERROR,
      'Invalid URL format',
      'INVALID_URL'
    );
  }
}

