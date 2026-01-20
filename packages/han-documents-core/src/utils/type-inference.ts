/**
 * Utilidades para inferir tipos de datos
 */

/**
 * Tipos de datos soportados
 */
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  LINK = 'link',
  EMAIL = 'email',
  PHONE = 'phone'
}

/**
 * Infiere el tipo de dato basado en el valor
 * Útil para Excel, Word y PDF
 */
export function inferDataType(value: any): DataType {
  if (value === null || value === undefined) {
    return DataType.STRING;
  }
  
  if (typeof value === 'number') {
    return DataType.NUMBER;
  }
  
  if (typeof value === 'boolean') {
    return DataType.BOOLEAN;
  }
  
  if (value instanceof Date) {
    return DataType.DATE;
  }
  
  if (typeof value === 'string') {
    // Detectar URLs
    if (value.match(/^https?:\/\//i)) {
      return DataType.LINK;
    }
    
    // Detectar emails
    if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return DataType.EMAIL;
    }
    
    // Detectar teléfonos
    if (value.match(/^[\d\s\-\+\(\)]+$/)) {
      return DataType.PHONE;
    }
    
    // Detectar porcentajes
    if (value.endsWith('%')) {
      return DataType.PERCENTAGE;
    }
    
    // Detectar moneda
    if (value.match(/^[\$€£¥]\s?\d/)) {
      return DataType.CURRENCY;
    }
  }
  
  return DataType.STRING;
}

/**
 * Convierte valor a tipo específico
 */
export function convertToType(value: any, type: DataType): any {
  switch (type) {
    case DataType.NUMBER:
      return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    
    case DataType.BOOLEAN:
      return Boolean(value);
    
    case DataType.DATE:
      return value instanceof Date ? value : new Date(value);
    
    case DataType.PERCENTAGE:
      if (typeof value === 'string' && value.endsWith('%')) {
        return parseFloat(value) / 100;
      }
      return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    
    default:
      return String(value);
  }
}

