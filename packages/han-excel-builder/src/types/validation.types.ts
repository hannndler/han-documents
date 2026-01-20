/**
 * Validation-specific type definitions
 */

import { CellType } from './core.types';
import { IDataCell, IHeaderCell, IFooterCell } from './cell.types';

/**
 * Validation rule interface
 */
export interface IValidationRule {
  /** Rule name */
  name: string;
  /** Rule description */
  description?: string;
  /** Rule type */
  type: 'required' | 'type' | 'range' | 'length' | 'format' | 'custom' | 'unique' | 'reference';
  /** Rule severity */
  severity: 'error' | 'warning' | 'info';
  /** Whether the rule is enabled */
  enabled: boolean;
  /** Rule parameters */
  params?: Record<string, unknown>;
  /** Custom validation function */
  validator?: (value: unknown, context?: IValidationContext) => IValidationResult;
}

/**
 * Validation context interface
 */
export interface IValidationContext {
  /** Cell being validated */
  cell: IDataCell | IHeaderCell | IFooterCell;
  /** Cell position */
  position?: { row: number; col: number };
  /** Worksheet name */
  worksheetName?: string;
  /** Table name */
  tableName?: string;
  /** Validation rules */
  rules?: IValidationRule[];
  /** Additional context data */
  data?: Record<string, unknown>;
}

/**
 * Validation result interface
 */
export interface IValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Validation info messages */
  info: string[];
  /** Suggested fixes */
  suggestions: string[];
  /** Validation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cell type validation interface
 */
export interface ICellTypeValidation {
  /** Expected cell type */
  expectedType: CellType;
  /** Whether to allow null/undefined values */
  allowNull?: boolean;
  /** Whether to allow empty strings */
  allowEmpty?: boolean;
  /** Type conversion options */
  conversion?: {
    /** Whether to attempt type conversion */
    enabled: boolean;
    /** Whether to be strict about conversion */
    strict: boolean;
  };
}

/**
 * Range validation interface
 */
export interface IRangeValidation {
  /** Minimum value */
  min?: number | Date | string;
  /** Maximum value */
  max?: number | Date | string;
  /** Whether the range is inclusive */
  inclusive?: boolean;
  /** Custom range function */
  rangeFunction?: (value: unknown) => boolean;
}

/**
 * Length validation interface
 */
export interface ILengthValidation {
  /** Minimum length */
  min?: number;
  /** Maximum length */
  max?: number;
  /** Exact length */
  exact?: number;
  /** Whether to trim whitespace before validation */
  trim?: boolean;
}

/**
 * Format validation interface
 */
export interface IFormatValidation {
  /** Format pattern (regex or format string) */
  pattern: string | RegExp;
  /** Format type */
  type: 'regex' | 'date' | 'email' | 'url' | 'phone' | 'custom';
  /** Custom format function */
  formatFunction?: (value: unknown) => boolean;
}

/**
 * Unique validation interface
 */
export interface IUniqueValidation {
  /** Scope for uniqueness check */
  scope: 'worksheet' | 'table' | 'column' | 'row' | 'custom';
  /** Custom scope function */
  scopeFunction?: (cell: IDataCell | IHeaderCell | IFooterCell) => string;
  /** Whether to ignore case */
  ignoreCase?: boolean;
  /** Whether to ignore whitespace */
  ignoreWhitespace?: boolean;
}

/**
 * Reference validation interface
 */
export interface IReferenceValidation {
  /** Reference type */
  type: 'formula' | 'hyperlink' | 'comment' | 'validation';
  /** Reference target */
  target: string;
  /** Whether the reference is required */
  required?: boolean;
  /** Reference validation function */
  validateReference?: (reference: string) => boolean;
}

/**
 * Validation schema interface
 */
export interface IValidationSchema {
  /** Schema name */
  name: string;
  /** Schema description */
  description?: string;
  /** Schema version */
  version?: string;
  /** Default rules */
  defaultRules: IValidationRule[];
  /** Cell type rules */
  cellTypeRules: Map<CellType, IValidationRule[]>;
  /** Custom rules */
  customRules: Map<string, IValidationRule>;
  /** Whether the schema is enabled */
  enabled: boolean;
}

/**
 * Validation engine interface
 */
export interface IValidationEngine {
  /** Validation schemas */
  schemas: Map<string, IValidationSchema>;
  /** Active schema */
  activeSchema?: IValidationSchema;
  /** Whether validation is enabled */
  enabled: boolean;
  /** Validation cache */
  cache: Map<string, IValidationResult>;

  /** Add a validation schema */
  addSchema(schema: IValidationSchema): void;
  /** Remove a validation schema */
  removeSchema(name: string): boolean;
  /** Set the active schema */
  setActiveSchema(name: string): boolean;
  /** Validate a cell */
  validateCell(cell: IDataCell | IHeaderCell | IFooterCell, context?: IValidationContext): IValidationResult;
  /** Validate a worksheet */
  validateWorksheet(worksheet: unknown): IValidationResult[];
  /** Clear validation cache */
  clearCache(): void;
  /** Get validation statistics */
  getStats(): IValidationStats;
}

/**
 * Validation statistics interface
 */
export interface IValidationStats {
  /** Total validations performed */
  totalValidations: number;
  /** Number of passed validations */
  passedValidations: number;
  /** Number of failed validations */
  failedValidations: number;
  /** Number of warnings */
  warnings: number;
  /** Average validation time in milliseconds */
  averageValidationTime: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Most common validation errors */
  commonErrors: Array<{ error: string; count: number }>;
}

