/**
 * Formatos de fecha comunes
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  US: 'MM/DD/YYYY',
  EU: 'DD/MM/YYYY',
  LONG: 'MMMM DD, YYYY',
  SHORT: 'MMM DD, YYYY'
} as const;

/**
 * Formatos de número comunes
 */
export const NUMBER_FORMATS = {
  INTEGER: '#,##0',
  DECIMAL: '#,##0.00',
  PERCENTAGE: '0%',
  PERCENTAGE_DECIMAL: '0.00%',
  CURRENCY_USD: '$#,##0.00',
  CURRENCY_EUR: '€#,##0.00'
} as const;

/**
 * Formatos de archivo soportados
 */
export const FILE_FORMATS = {
  EXCEL: ['xlsx', 'xls', 'csv'],
  WORD: ['docx', 'doc'],
  PDF: ['pdf']
} as const;

