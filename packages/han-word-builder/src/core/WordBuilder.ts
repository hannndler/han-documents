/**
 * WordBuilder - Main class for creating Word documents
 * Implementación mínima usando tipos compartidos de han-documents-core
 */

import { 
  IDocumentMetadata, 
  Result, 
  success, 
  error, 
  ErrorType,
  IDocumentBuilder 
} from '@hannndler/core';

/**
 * WordBuilder class for creating Word documents
 * 
 * @implements {IDocumentBuilder}
 */
export class WordBuilder implements IDocumentBuilder<Record<string, never>, ArrayBuffer> {
  private metadata?: IDocumentMetadata;

  constructor(config?: { metadata?: IDocumentMetadata }) {
    this.metadata = config?.metadata;
  }

  setMetadata(metadata: IDocumentMetadata): this {
    this.metadata = metadata;
    return this;
  }

  async build(): Promise<Result<ArrayBuffer>> {
    // Placeholder implementation
    return error(ErrorType.BUILD_ERROR, 'WordBuilder not fully implemented yet', 'NOT_IMPLEMENTED');
  }

  async toBuffer(): Promise<Result<ArrayBuffer>> {
    return this.build();
  }

  async toBlob(): Promise<Result<Blob>> {
    const result = await this.build();
    if (!result.success) {
      return result as Result<Blob>;
    }
    return success(new Blob([result.data]));
  }

  validate(): Result<boolean> {
    return success(true);
  }

  clear(): void {
    this.metadata = undefined;
  }
}

