# @han/pdf-builder

Advanced PDF document generator with TypeScript support, comprehensive styling, and optimized performance.

## Features

- ✅ **Multiple Pages** - Create PDFs with multiple pages
- ✅ **Rich Content** - Text, images, tables, lists, and more
- ✅ **Global Headers & Footers** - Apply headers and footers to all pages
- ✅ **Styling & Themes** - Comprehensive styling system with themes
- ✅ **TypeScript** - Fully typed with strict type checking
- ✅ **Cross-Platform** - Works in both browser and Node.js environments
- ✅ **PDF Reading** - Extract content from existing PDFs
- ✅ **Template Engine** - Fill PDF forms and generate from HTML
- ✅ **Event System** - Monitor build progress and errors
- ✅ **Performance Monitoring** - Track build statistics

## Installation

```bash
npm install @han/pdf-builder
# or
pnpm add @han/pdf-builder
# or
yarn add @han/pdf-builder
```

## Quick Start

### Basic Usage

```typescript
import { PDFBuilder } from '@han/pdf-builder';

// Create a new PDF builder
const builder = new PDFBuilder({
  metadata: {
    title: 'My Document',
    author: 'John Doe',
    subject: 'Sample PDF'
  }
});

// Add a page
const page = builder.addPage('Page1');
page.addText('Hello, World!');
page.addText('This is a sample PDF document.');

// Generate PDF (Browser)
await builder.generateAndDownload('document.pdf');

// Or save to file (Node.js)
await builder.saveToFile('./output/document.pdf');
```

### Multiple Pages

```typescript
const builder = new PDFBuilder();

// First page
const page1 = builder.addPage('Cover');
page1.addText('Cover Page', {
  font: { size: 24, style: 'bold' }
});

// Second page
const page2 = builder.addPage('Content');
page2.addText('Content Page');
page2.addText('More content here...');

await builder.generateAndDownload('multi-page.pdf');
```

## Core Components

### PDFBuilder

Main class for creating PDF documents.

```typescript
const builder = new PDFBuilder({
  metadata?: IDocumentMetadata;
  defaultPageConfig?: Partial<IPDFPageConfig>;
  globalHeader?: IPDFContentBlock[];
  globalFooter?: IPDFContentBlock[];
  enableValidation?: boolean;
  enableEvents?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxPages?: number;
  memoryLimit?: number;
});
```

### PDFPage

Represents a single page in the PDF document.

```typescript
const page = builder.addPage('PageName', {
  size?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'TABLOID' | [number, number];
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  backgroundColor?: Color;
  defaultFont?: string;
  defaultFontSize?: number;
});
```

## Content Types

### Text

```typescript
// Simple text
page.addText('Hello, World!');

// Text with style
page.addText('Styled Text', {
  font: {
    family: 'Helvetica',
    size: 16,
    style: 'bold',
    color: '#FF0000'
  },
  alignment: {
    horizontal: 'center',
    vertical: 'middle'
  }
});

// Multiple lines
page.addText([
  'Line 1',
  'Line 2',
  'Line 3'
]);
```

### Images

```typescript
// From file path (Node.js)
page.addImage('./path/to/image.png', {
  position: {
    x: 100,
    y: 100,
    width: 200,
    height: 150
  }
});

// From ArrayBuffer
const imageBuffer = await fetch('https://example.com/image.jpg')
  .then(r => r.arrayBuffer());
page.addImage(imageBuffer, {
  position: { x: 0, y: 0, width: 300, height: 200 },
  maintainAspectRatio: true
});
```

### Tables

```typescript
page.addTable([
  {
    cells: [
      { content: 'Header 1' },
      { content: 'Header 2' },
      { content: 'Header 3' }
    ],
    style: {
      font: { style: 'bold' },
      fill: { color: '#E0E0E0' }
    }
  },
  {
    cells: [
      { content: 'Row 1, Col 1' },
      { content: 'Row 1, Col 2' },
      { content: 'Row 1, Col 3' }
    ]
  },
  {
    cells: [
      { content: 'Row 2, Col 1' },
      { content: 'Row 2, Col 2' },
      { content: 'Row 2, Col 3' }
    ]
  }
], {
  columnWidths: [100, 150, 100],
  style: {
    border: {
      top: { width: 1, color: '#000000' },
      bottom: { width: 1, color: '#000000' },
      left: { width: 1, color: '#000000' },
      right: { width: 1, color: '#000000' }
    }
  }
});
```

### Lists

```typescript
// Unordered list
page.addList([
  { content: 'Item 1' },
  { content: 'Item 2' },
  { content: 'Item 3' }
], {
  listType: 'unordered',
  bullet: '•'
});

// Ordered list
page.addList([
  { content: 'First item' },
  { content: 'Second item' },
  { content: 'Third item' }
], {
  listType: 'ordered'
});

// Nested list
page.addList([
  {
    content: 'Parent item',
    items: [
      { content: 'Child item 1' },
      { content: 'Child item 2' }
    ]
  }
]);
```

## Global Headers and Footers

Apply headers and footers to all pages automatically.

```typescript
const builder = new PDFBuilder();

// Set global header
builder.setGlobalHeader({
  type: 'text',
  text: 'Company Name - Confidential',
  style: {
    font: { size: 10, color: '#666666' },
    alignment: { horizontal: 'center' }
  }
});

// Set global footer
builder.setGlobalFooter({
  type: 'text',
  text: 'Page {{pageNumber}} of {{totalPages}}',
  style: {
    font: { size: 9, color: '#999999' },
    alignment: { horizontal: 'center' }
  }
});

// All pages will automatically include these headers/footers
const page1 = builder.addPage('Page1');
const page2 = builder.addPage('Page2');
```

## Styling

### Predefined Styles

```typescript
// Add a style
builder.addStyle('title', {
  font: {
    family: 'Helvetica',
    size: 24,
    style: 'bold',
    color: '#000000'
  },
  alignment: {
    horizontal: 'center'
  }
});

// Use the style
const style = builder.getStyle('title');
page.addText('Title', style);
```

### Themes

```typescript
builder.setTheme({
  name: 'Corporate',
  colors: {
    primary: '#1E88E5',
    secondary: '#43A047',
    background: '#FFFFFF',
    text: '#212121',
    border: '#E0E0E0'
  },
  fonts: {
    default: 'Helvetica',
    header: 'Helvetica-Bold',
    body: 'Helvetica'
  },
  sectionStyles: {
    header: {
      font: { size: 10, color: '#666666' }
    },
    footer: {
      font: { size: 9, color: '#999999' }
    }
  }
});
```

## PDF Reading

Extract content from existing PDF files.

```typescript
import { PDFReader } from '@han/pdf-builder';

// Read from buffer
const buffer = await fetch('document.pdf').then(r => r.arrayBuffer());
const result = await PDFReader.fromBuffer(buffer, {
  outputFormat: 'pages',
  extractImages: true,
  extractLinks: true
});

if (result.success) {
  console.log('Total pages:', result.data.totalPages);
  result.data.pages.forEach(page => {
    console.log('Page', page.pageNumber, ':', page.content.text);
  });
}

// Read from file (Node.js only)
const fileResult = await PDFReader.fromFile('./document.pdf', {
  outputFormat: 'flat' // Get plain text
});

if (fileResult.success) {
  console.log('PDF text:', fileResult.data.text);
}
```

## Template Engine

### Fill PDF Forms

```typescript
import { TemplateEngine } from '@han/pdf-builder';

// Fill form fields in a PDF template
const result = await TemplateEngine.fillPDFTemplate(
  './template.pdf', // Path to PDF with form fields
  {
    fields: {
      'name': 'John Doe',
      'email': 'john@example.com',
      'date': '2024-01-01',
      'agree': true
    }
  }
);

if (result.success) {
  // Save filled PDF
  await fs.writeFile('./filled.pdf', Buffer.from(result.data.buffer));
}
```

### Generate from HTML

```typescript
// Generate PDF from HTML (Node.js only)
const result = await TemplateEngine.generatePDFFromHTML({
  html: `
    <html>
      <head>
        <style>
          body { font-family: Arial; }
          h1 { color: #1E88E5; }
        </style>
      </head>
      <body>
        <h1>{{title}}</h1>
        <p>{{content}}</p>
      </body>
    </html>
  `,
  data: {
    fields: {
      title: 'My Document',
      content: 'This is the content'
    }
  },
  pdfOptions: {
    format: 'A4',
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    }
  }
});

if (result.success) {
  await fs.writeFile('./from-html.pdf', Buffer.from(result.data));
}
```

## Environment Support

### Browser

```typescript
// Generate and download
await builder.generateAndDownload('document.pdf');

// Get as Blob
const blobResult = await builder.toBlob();
if (blobResult.success) {
  const url = URL.createObjectURL(blobResult.data);
  // Use the URL
}
```

### Node.js

```typescript
// Save to file
await builder.saveToFile('./output/document.pdf');

// Save to stream
const stream = fs.createWriteStream('./output/document.pdf');
await builder.saveToStream(stream);

// Get as Buffer
const bufferResult = await builder.toBuffer();
if (bufferResult.success) {
  await fs.writeFile('./output/document.pdf', Buffer.from(bufferResult.data));
}
```

## Events

Monitor build progress and handle errors.

```typescript
const builder = new PDFBuilder({
  enableEvents: true
});

// Listen to events (if EventEmitter is exposed)
// builder.on('buildStarted', () => console.log('Build started'));
// builder.on('buildCompleted', (data) => console.log('Build completed', data));
// builder.on('buildError', (error) => console.error('Build error', error));
```

## Statistics

Get build statistics.

```typescript
const stats = builder.getStats();
console.log('Total pages:', stats.totalPages);
console.log('Build time:', stats.buildTime, 'ms');
console.log('File size:', stats.fileSize, 'bytes');
console.log('Content blocks:', stats.totalContentBlocks);
```

## API Reference

### PDFBuilder

#### Methods

- `addPage(name: string, config?: Partial<IPDFPageConfig>): IPDFPage` - Add a new page
- `getPage(name: string): IPDFPage | undefined` - Get a page by name
- `removePage(name: string): boolean` - Remove a page
- `setCurrentPage(name: string): boolean` - Set the current page
- `build(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Build the PDF
- `generateAndDownload(fileName: string, options?: IDownloadOptions): Promise<Result<void>>` - Generate and download (browser)
- `saveToFile(filePath: string, options?: ISaveFileOptions): Promise<Result<void>>` - Save to file (Node.js)
- `saveToStream(writeStream, options?: IBuildOptions): Promise<Result<void>>` - Save to stream (Node.js)
- `toBuffer(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Get as buffer
- `toBlob(options?: IBuildOptions): Promise<Result<Blob>>` - Get as blob
- `validate(): Result<boolean>` - Validate the document
- `clear(): void` - Clear all pages
- `getStats(): IPDFStats` - Get build statistics
- `addStyle(name: string, style: IPDFStyle): this` - Add a predefined style
- `getStyle(name: string): IPDFStyle | undefined` - Get a style by name
- `setTheme(theme: IPDFTheme): this` - Set PDF theme
- `getTheme(): IPDFTheme | undefined` - Get current theme
- `setGlobalHeader(content: IPDFContentBlock | IPDFContentBlock[]): this` - Set global header
- `setGlobalFooter(content: IPDFContentBlock | IPDFContentBlock[]): this` - Set global footer
- `getGlobalHeader(): IPDFContentBlock[]` - Get global header
- `getGlobalFooter(): IPDFContentBlock[]` - Get global footer

### PDFPage

#### Methods

- `addHeader(content: IPDFContentBlock | IPDFContentBlock[]): this` - Add header content
- `addFooter(content: IPDFContentBlock | IPDFContentBlock[]): this` - Add footer content
- `addContent(content: IPDFContentBlock | IPDFContentBlock[]): this` - Add body content
- `addText(text: string | string[], style?: IPDFStyle): this` - Add text
- `addImage(source: string | ArrayBuffer | Uint8Array, options?: Partial<IImageContent>): this` - Add image
- `addTable(rows: ITableRow[], options?: Partial<Omit<ITableContent, 'type' | 'rows'>>): this` - Add table
- `addList(items: IListItem[], options?: Partial<Omit<IListContent, 'type' | 'items'>>): this` - Add list

### PDFReader

#### Static Methods

- `fromBuffer(buffer: ArrayBuffer, options?: IPDFReaderOptions): Promise<PDFReaderResult>` - Read from buffer
- `fromFile(filePath: string, options?: IPDFReaderOptions): Promise<PDFReaderResult>` - Read from file (Node.js)

### TemplateEngine

#### Static Methods

- `fillPDFTemplate(templateSource: string | ArrayBuffer | Uint8Array, data: ITemplateData): Promise<Result<ITemplateFillResult>>` - Fill PDF form
- `generatePDFFromHTML(template: IHTMLTemplate): Promise<Result<ArrayBuffer>>` - Generate from HTML (Node.js)
- `fillTemplate(config: ITemplateConfig, data: ITemplateData): Promise<Result<ArrayBuffer>>` - Fill template (wrapper)

## TypeScript Support

This package is written in TypeScript and provides full type definitions. All types are exported and can be imported:

```typescript
import type {
  IPDFBuilder,
  IPDFPage,
  IPDFPageConfig,
  IPDFContentBlock,
  IPDFStyle,
  IPDFTheme,
  ITextContent,
  IImageContent,
  ITableContent,
  IListContent
} from '@han/pdf-builder';
```

## Examples

See the `examples/` directory for more examples:

- `generate-pdf.ts` - Basic PDF generation example

## License

MIT

## Repository

[https://github.com/hannndler/han-documents](https://github.com/hannndler/han-documents)

## Support

For issues and questions, please open an issue on GitHub.
