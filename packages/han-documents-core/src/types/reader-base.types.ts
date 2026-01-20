import { Result } from './result.types';

/**
 * Interfaz base para todos los readers de documentos
 * 
 * Esta interfaz define los métodos comunes para leer documentos desde diferentes fuentes
 * (ArrayBuffer, Blob, File) y convertir them a estructuras de datos.
 * 
 * @template TInput - Tipo de entrada (ArrayBuffer, Blob, File, etc.)
 * @template TOptions - Tipo de opciones de lectura específicas del reader
 * @template TResult - Tipo de resultado retornado (estructura de datos parseada)
 * 
 * @example
 * ```typescript
 * class ExcelReader implements IDocumentReader<ArrayBuffer, IExcelReaderOptions, IJsonWorkbook> {
 *   async fromBuffer(buffer: ArrayBuffer, options?: IExcelReaderOptions) {
 *     // Implementación
 *   }
 *   // ... otros métodos requeridos
 * }
 * ```
 */
export interface IDocumentReader<TInput = ArrayBuffer, TOptions = any, TResult = any> {
  /** Leer desde ArrayBuffer */
  fromBuffer(buffer: ArrayBuffer, options?: TOptions): Promise<Result<TResult>>;
  
  /** Leer desde Blob */
  fromBlob(blob: Blob, options?: TOptions): Promise<Result<TResult>>;
  
  /** Leer desde File (browser) */
  fromFile(file: File, options?: TOptions): Promise<Result<TResult>>;
}

/**
 * Interfaz para readers que soportan lectura desde archivo en Node.js
 * 
 * Extiende IDocumentReader agregando el método fromPath para leer archivos
 * desde el sistema de archivos, característica típicamente usada en Node.js.
 * 
 * @template TInput - Tipo de entrada
 * @template TOptions - Tipo de opciones de lectura
 * @template TResult - Tipo de resultado
 * 
 * @example
 * ```typescript
 * class ExcelReader implements IFileReader<ArrayBuffer, IExcelReaderOptions, IJsonWorkbook> {
 *   async fromPath(filePath: string, options?: IExcelReaderOptions) {
 *     // Implementación para Node.js
 *   }
 *   // ... otros métodos
 * }
 * ```
 */
export interface IFileReader<TInput = ArrayBuffer, TOptions = any, TResult = any> 
  extends IDocumentReader<TInput, TOptions, TResult> {
  /** Leer desde ruta de archivo (Node.js) */
  fromPath(filePath: string, options?: TOptions): Promise<Result<TResult>>;
}

/**
 * Configuración base para readers
 * 
 * Define las opciones comunes que todos los readers pueden aceptar.
 */
export interface IReaderConfig {
  /** Incluir formato de celdas/elementos */
  includeFormatting?: boolean;
  
  /** Incluir fórmulas */
  includeFormulas?: boolean;
  
  /** Incluir filas/elementos vacíos */
  includeEmptyRows?: boolean;
}

