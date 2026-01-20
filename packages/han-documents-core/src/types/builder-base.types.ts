import { IDocumentMetadata } from './metadata.types';
import { Result } from './result.types';

/**
 * Interfaz base para todos los builders de documentos
 * 
 * Esta interfaz define los métodos comunes que todos los builders deben implementar,
 * independientemente del formato de documento (Excel, PDF, Word, etc.)
 * 
 * @template TConfig - Tipo de opciones de configuración específicas del builder
 * @template TResult - Tipo de resultado retornado por build() (típicamente ArrayBuffer)
 * 
 * @example
 * ```typescript
 * class MyBuilder implements IDocumentBuilder<IMyOptions> {
 *   async build(options?: IMyOptions): Promise<Result<ArrayBuffer>> {
 *     // Implementación
 *   }
 *   // ... otros métodos requeridos
 * }
 * ```
 */
export interface IDocumentBuilder<TConfig = any, TResult = ArrayBuffer> {
  /** Establecer metadata del documento */
  setMetadata(metadata: IDocumentMetadata): this;
  
  /** Construir el documento */
  build(options?: TConfig): Promise<Result<TResult>>;
  
  /** Obtener como buffer */
  toBuffer(options?: TConfig): Promise<Result<ArrayBuffer>>;
  
  /** Obtener como blob (browser) */
  toBlob(options?: TConfig): Promise<Result<Blob>>;
  
  /** Validar el documento */
  validate(): Result<boolean>;
  
  /** Limpiar el documento */
  clear(): void;
}

/**
 * Interfaz para builders que soportan guardado en archivo (Node.js)
 * 
 * Extiende IDocumentBuilder agregando métodos para guardar archivos en disco
 * o escribir a streams, características típicamente usadas en entornos Node.js.
 * 
 * @template TConfig - Tipo de opciones de configuración específicas del builder
 * 
 * @example
 * ```typescript
 * class ExcelBuilder implements IFileBuilder<ISaveFileOptions> {
 *   async saveToFile(filePath: string, options?: ISaveFileOptions) {
 *     // Implementación para Node.js
 *   }
 *   // ... otros métodos
 * }
 * ```
 */
export interface IFileBuilder<TConfig = any> extends IDocumentBuilder<TConfig> {
  /** Guardar archivo en disco (Node.js) */
  saveToFile(filePath: string, options?: TConfig): Promise<Result<void>>;
  
  /** Guardar a stream (Node.js, para archivos grandes) */
  saveToStream(
    writeStream: { write: (chunk: any, callback?: (error?: Error | null) => void) => boolean },
    options?: TConfig
  ): Promise<Result<void>>;
}

/**
 * Interfaz para builders que soportan descarga en navegador
 * 
 * Extiende IDocumentBuilder agregando el método generateAndDownload,
 * usado típicamente en aplicaciones web del navegador.
 * 
 * @template TConfig - Tipo de opciones de configuración específicas del builder
 * 
 * @example
 * ```typescript
 * class ExcelBuilder implements IDownloadBuilder<IDownloadOptions> {
 *   async generateAndDownload(fileName: string, options?: IDownloadOptions) {
 *     // Implementación para navegador
 *   }
 *   // ... otros métodos
 * }
 * ```
 */
export interface IDownloadBuilder<TConfig = any> extends IDocumentBuilder<TConfig> {
  /** Generar y descargar archivo (browser) */
  generateAndDownload(fileName: string, options?: TConfig): Promise<Result<void>>;
}

/**
 * Configuración base para builders
 * 
 * Define las opciones comunes que todos los builders pueden aceptar
 * en su constructor o configuración inicial.
 */
export interface IBuilderConfig {
  /** Metadata del documento */
  metadata?: IDocumentMetadata;
  
  /** Habilitar validación */
  enableValidation?: boolean;
  
  /** Límite de memoria en bytes */
  memoryLimit?: number;
}

