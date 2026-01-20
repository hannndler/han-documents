/**
 * Tests for PDFBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PDFBuilder } from './PDFBuilder';
import { PDFPage } from './PDFPage';
import { ErrorType } from '@han/core';

describe('PDFBuilder', () => {
  let builder: PDFBuilder;

  beforeEach(() => {
    builder = new PDFBuilder({
      metadata: {
        title: 'Test Document',
        author: 'Test Author'
      }
    });
  });

  describe('Constructor', () => {
    it('should create a PDFBuilder instance', () => {
      expect(builder).toBeInstanceOf(PDFBuilder);
      expect(builder.pages.size).toBe(0);
      expect(builder.currentPage).toBeUndefined();
      expect(builder.isBuilding).toBe(false);
    });

    it('should initialize with metadata', () => {
      const builderWithMeta = new PDFBuilder({
        metadata: {
          title: 'My PDF',
          author: 'John Doe',
          description: 'Test PDF'
        }
      });
      
      expect(builderWithMeta.config.metadata?.title).toBe('My PDF');
      expect(builderWithMeta.config.metadata?.author).toBe('John Doe');
    });
  });

  describe('Page Management', () => {
    it('should add a page', () => {
      const page = builder.addPage('Page1');
      
      expect(page).toBeInstanceOf(PDFPage);
      expect(builder.pages.size).toBe(1);
      expect(builder.pages.has('Page1')).toBe(true);
      expect(builder.currentPage).toBe(page);
    });

    it('should throw error when adding duplicate page name', () => {
      builder.addPage('Page1');
      
      expect(() => {
        builder.addPage('Page1');
      }).toThrow('Page "Page1" already exists');
    });

    it('should get a page by name', () => {
      const page = builder.addPage('Page1');
      const retrievedPage = builder.getPage('Page1');
      
      expect(retrievedPage).toBe(page);
    });

    it('should return undefined for non-existent page', () => {
      const page = builder.getPage('NonExistent');
      expect(page).toBeUndefined();
    });

    it('should remove a page', () => {
      builder.addPage('Page1');
      const removed = builder.removePage('Page1');
      
      expect(removed).toBe(true);
      expect(builder.pages.size).toBe(0);
      expect(builder.currentPage).toBeUndefined();
    });

    it('should return false when removing non-existent page', () => {
      const removed = builder.removePage('NonExistent');
      expect(removed).toBe(false);
    });

    it('should set current page', () => {
      builder.addPage('Page1');
      builder.addPage('Page2');
      
      const result = builder.setCurrentPage('Page2');
      
      expect(result).toBe(true);
      expect(builder.currentPage?.config.name).toBe('Page2');
    });

    it('should return false when setting non-existent page as current', () => {
      const result = builder.setCurrentPage('NonExistent');
      expect(result).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should set metadata', () => {
      builder.setMetadata({
        title: 'New Title',
        author: 'New Author'
      });
      
      expect(builder.config.metadata?.title).toBe('New Title');
      expect(builder.config.metadata?.author).toBe('New Author');
    });
  });

  describe('Content Management', () => {
    it('should add text to a page', () => {
      const page = builder.addPage('Page1');
      page.addText('Hello World');
      
      expect(page.content.length).toBeGreaterThan(0);
      expect(page.content[0].type).toBe('text');
    });

    it('should add multiple text lines', () => {
      const page = builder.addPage('Page1');
      page.addText(['Line 1', 'Line 2', 'Line 3']);
      
      expect(page.content.length).toBe(3);
    });
  });

  describe('Validation', () => {
    it('should validate empty PDF', () => {
      const result = builder.validate();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe(ErrorType.VALIDATION_ERROR);
        expect(result.error.code).toBe('NO_PAGES');
      }
    });

    it('should validate PDF with pages', () => {
      const page = builder.addPage('Page1');
      page.addText('Content');
      
      const result = builder.validate();
      expect(result.success).toBe(true);
    });

    it('should validate empty page', async () => {
      const page = builder.addPage('Page1');
      const result = page.validate();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMPTY_PAGE');
      }
    });
  });

  describe('Statistics', () => {
    it('should return statistics', () => {
      const stats = builder.getStats();
      
      expect(stats).toHaveProperty('totalPages');
      expect(stats).toHaveProperty('totalContentBlocks');
      expect(stats).toHaveProperty('buildTime');
      expect(stats).toHaveProperty('fileSize');
    });

    it('should update statistics after building', async () => {
      const page = builder.addPage('Page1');
      page.addText('Test content');
      
      await builder.build();
      const stats = builder.getStats();
      
      expect(stats.totalPages).toBe(1);
      expect(stats.buildTime).toBeGreaterThan(0);
    });
  });

  describe('Build', () => {
    it('should build a simple PDF', async () => {
      const page = builder.addPage('Page1');
      page.addText('Hello World');
      
      const result = await builder.build();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(ArrayBuffer);
        expect(result.data.byteLength).toBeGreaterThan(0);
      }
    });

    it('should prevent concurrent builds', async () => {
      const page = builder.addPage('Page1');
      page.addText('Content');
      
      // Start first build
      const buildPromise1 = builder.build();
      
      // Try to start second build
      const result2 = await builder.build();
      
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.code).toBe('BUILD_IN_PROGRESS');
      }
      
      // Wait for first build to complete
      await buildPromise1;
    });

    it('should build PDF with multiple pages', async () => {
      const page1 = builder.addPage('Page1');
      page1.addText('Page 1 content');
      
      const page2 = builder.addPage('Page2');
      page2.addText('Page 2 content');
      
      const result = await builder.build();
      
      expect(result.success).toBe(true);
      if (result.success) {
        const stats = builder.getStats();
        expect(stats.totalPages).toBe(2);
      }
    });
  });

  describe('Clear', () => {
    it('should clear all pages', () => {
      builder.addPage('Page1');
      builder.addPage('Page2');
      
      builder.clear();
      
      expect(builder.pages.size).toBe(0);
      expect(builder.currentPage).toBeUndefined();
    });
  });

  describe('Styles', () => {
    it('should add a style', () => {
      const style = {
        font: {
          family: 'Helvetica',
          size: 14,
          style: 'bold' as const
        }
      };
      
      builder.addStyle('header', style);
      const retrievedStyle = builder.getStyle('header');
      
      expect(retrievedStyle).toEqual(style);
    });

    it('should return undefined for non-existent style', () => {
      const style = builder.getStyle('NonExistent');
      expect(style).toBeUndefined();
    });
  });

  describe('Theme', () => {
    it('should set and get theme', () => {
      const theme = {
        colors: {
          primary: '#FF0000',
          background: '#FFFFFF'
        }
      };
      
      builder.setTheme(theme);
      const retrievedTheme = builder.getTheme();
      
      expect(retrievedTheme).toEqual(theme);
    });
  });
});

