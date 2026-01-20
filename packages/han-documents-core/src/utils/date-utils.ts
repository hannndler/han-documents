/**
 * Utilidades de fecha comunes
 */

/**
 * Formatea fecha a string ISO
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parsea string a Date
 */
export function parseDate(value: string | Date | number): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  return new Date(value);
}

/**
 * Obtiene fecha actual
 */
export function now(): Date {
  return new Date();
}

/**
 * Valida si es una fecha válida
 */
export function isValidDate(value: any): boolean {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  return false;
}

