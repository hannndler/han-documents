/**
 * Metadata común para todos los tipos de documentos
 * (Excel, Word, PDF)
 */
export interface IDocumentMetadata {
  /** Título del documento */
  title?: string;
  
  /** Autor del documento */
  author?: string;
  
  /** Descripción del documento */
  description?: string;
  
  /** Palabras clave */
  keywords?: string | string[];
  
  /** Asunto */
  subject?: string;
  
  /** Categoría */
  category?: string;
  
  /** Empresa/Organización */
  company?: string;
  
  /** Fecha de creación */
  created?: Date;
  
  /** Fecha de modificación */
  modified?: Date;
  
  /** Nombre de la aplicación */
  application?: string;
  
  /** Versión de la aplicación */
  appVersion?: string;
  
  /** Idioma del documento */
  language?: string;
  
  /** Comentarios adicionales */
  comments?: string;
}

/**
 * Metadata específica para Excel (extiende la común)
 */
export interface IExcelMetadata extends IDocumentMetadata {
  /** Hyperlink base para Excel */
  hyperlinkBase?: string;
  
  /** Manager (específico de Excel) */
  manager?: string;
}

/**
 * Metadata específica para Word
 */
export interface IWordMetadata extends IDocumentMetadata {
  /** Template usado */
  template?: string;
}

/**
 * Metadata específica para PDF
 */
export interface IPDFMetadata extends IDocumentMetadata {
  /** Producer (aplicación que generó el PDF) */
  producer?: string;
  
  /** PDF version */
  pdfVersion?: string;
}

