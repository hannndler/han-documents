# @hannndler/xlsx-builder

Advanced Excel file generator with TypeScript support, comprehensive styling, and optimized performance.

## Features

- ✅ **Multiple Worksheets** - Create workbooks with multiple worksheets
- ✅ **Rich Content** - Headers, subheaders, rows, footers, tables, images
- ✅ **Advanced Styling** - Fonts, colors, borders, alignment, conditional formatting
- ✅ **Nested Headers** - Support for multi-level header structures
- ✅ **Structured Tables** - Excel structured tables with auto-filters
- ✅ **Pivot Tables** - Create pivot tables for data analysis
- ✅ **Data Validation** - Validate cell values and types
- ✅ **Images** - Add images to worksheets
- ✅ **Themes** - Comprehensive theme system
- ✅ **TypeScript** - Fully typed with strict type checking
- ✅ **Cross-Platform** - Works in both browser and Node.js environments
- ✅ **Excel Reading** - Read and extract data from Excel files
- ✅ **Event System** - Monitor build progress and errors
- ✅ **Performance Monitoring** - Track build statistics

## Installation

```bash
npm install @hannndler/xlsx-builder
# or
pnpm add @hannndler/xlsx-builder
# or
yarn add @hannndler/xlsx-builder
```

## Quick Start

### Basic Usage

```typescript
import { ExcelBuilder, CellType } from '@hannndler/xlsx-builder';

// Create a new Excel builder
const builder = new ExcelBuilder({
  metadata: {
    title: 'Sales Report',
    author: 'John Doe',
    subject: 'Monthly Sales Data'
  }
});

// Add a worksheet
const worksheet = builder.addWorksheet('Sales');

// Add header
worksheet.addHeader({
  key: 'title',
  value: 'Monthly Sales Report',
  type: CellType.STRING
});

// Add data rows
worksheet.addRow([
  { key: 'product', value: 'Product A', type: CellType.STRING },
  { key: 'quantity', value: 100, type: CellType.NUMBER },
  { key: 'price', value: 29.99, type: CellType.NUMBER }
]);

// Generate Excel (Browser)
await builder.generateAndDownload('report.xlsx');

// Or save to file (Node.js)
await builder.saveToFile('./output/report.xlsx');
```

### Multiple Worksheets

```typescript
const builder = new ExcelBuilder();

// First worksheet
const salesSheet = builder.addWorksheet('Sales');
salesSheet.addHeader({ key: 'title', value: 'Sales Data', type: CellType.STRING });
salesSheet.addRow([
  { key: 'month', value: 'January', type: CellType.STRING },
  { key: 'amount', value: 5000, type: CellType.NUMBER }
]);

// Second worksheet
const summarySheet = builder.addWorksheet('Summary');
summarySheet.addHeader({ key: 'title', value: 'Summary', type: CellType.STRING });
summarySheet.addRow([
  { key: 'total', value: 5000, type: CellType.NUMBER }
]);

await builder.generateAndDownload('multi-sheet.xlsx');
```

## Core Components

### ExcelBuilder

Main class for creating Excel workbooks.

```typescript
const builder = new ExcelBuilder({
  metadata?: IWorkbookMetadata;
  defaultWorksheetConfig?: Partial<IWorksheetConfig>;
  enableValidation?: boolean;
  enableEvents?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxWorksheets?: number;
  maxRowsPerWorksheet?: number;
  maxColumnsPerWorksheet?: number;
  memoryLimit?: number;
});
```

### Worksheet

Represents a single worksheet in the workbook.

```typescript
const worksheet = builder.addWorksheet('SheetName', {
  tabColor?: string;
  defaultRowHeight?: number;
  defaultColWidth?: number;
  hidden?: boolean;
  protected?: boolean;
  protectionPassword?: string;
  showGridLines?: boolean;
  showRowColHeaders?: boolean;
  zoom?: number;
});
```

## Content Types

### Headers

```typescript
// Simple header
worksheet.addHeader({
  key: 'title',
  value: 'Report Title',
  type: CellType.STRING
});

// Header with style
worksheet.addHeader({
  key: 'title',
  value: 'Styled Header',
  type: CellType.STRING,
  styles: {
    font: { bold: true, size: 16, color: '#FF0000' },
    fill: { fgColor: '#FFFF00' },
    alignment: { horizontal: 'center' }
  }
});
```

### Subheaders (Nested)

```typescript
worksheet.addSubHeaders([
  {
    key: 'header1',
    value: 'Main Header',
    type: CellType.STRING,
    colSpan: 2
  },
  {
    key: 'subheader1',
    value: 'Sub Header 1',
    type: CellType.STRING
  },
  {
    key: 'subheader2',
    value: 'Sub Header 2',
    type: CellType.STRING
  }
]);
```

### Rows

```typescript
// Single row
worksheet.addRow([
  { key: 'name', value: 'John Doe', type: CellType.STRING },
  { key: 'age', value: 30, type: CellType.NUMBER },
  { key: 'active', value: true, type: CellType.BOOLEAN }
]);

// Multiple rows
worksheet.addRow([
  { key: 'product', value: 'Product A', type: CellType.STRING },
  { key: 'price', value: 29.99, type: CellType.NUMBER }
]);
worksheet.addRow([
  { key: 'product', value: 'Product B', type: CellType.STRING },
  { key: 'price', value: 39.99, type: CellType.NUMBER }
]);
```

### Tables

```typescript
// Add a structured table
worksheet.addTable({
  name: 'SalesTable',
  headers: [
    { key: 'product', value: 'Product', type: CellType.STRING },
    { key: 'quantity', value: 'Quantity', type: CellType.NUMBER },
    { key: 'price', value: 'Price', type: CellType.NUMBER }
  ],
  body: [
    [
      { key: 'product', value: 'Product A', type: CellType.STRING },
      { key: 'quantity', value: 100, type: CellType.NUMBER },
      { key: 'price', value: 29.99, type: CellType.NUMBER }
    ],
    [
      { key: 'product', value: 'Product B', type: CellType.STRING },
      { key: 'quantity', value: 200, type: CellType.NUMBER },
      { key: 'price', value: 39.99, type: CellType.NUMBER }
    ]
  ],
  showBorders: true,
  showStripes: true,
  autoFilter: true
});
```

### Footers

```typescript
worksheet.addFooter({
  key: 'total',
  value: 'Total: $1000',
  type: CellType.STRING,
  styles: {
    font: { bold: true }
  }
});
```

## Styling

### Cell Styles

```typescript
// Add a predefined style
builder.addCellStyle('header', {
  font: {
    bold: true,
    size: 14,
    color: '#FFFFFF'
  },
  fill: {
    fgColor: '#4472C4'
  },
  alignment: {
    horizontal: 'center',
    vertical: 'middle'
  },
  border: {
    top: { style: 'thin', color: '#000000' },
    bottom: { style: 'thin', color: '#000000' },
    left: { style: 'thin', color: '#000000' },
    right: { style: 'thin', color: '#000000' }
  }
});

// Use the style
const style = builder.getCellStyle('header');
worksheet.addHeader({
  key: 'title',
  value: 'Title',
  type: CellType.STRING,
  styles: style
});
```

### Conditional Formatting

```typescript
worksheet.addRow([
  {
    key: 'value',
    value: 150,
    type: CellType.NUMBER,
    styles: {
      conditionalFormats: [
        {
          type: 'cellValue',
          operator: 'greaterThan',
          formula: 100,
          style: {
            font: { color: '#00FF00' },
            fill: { fgColor: '#E8F5E9' }
          }
        }
      ]
    }
  }
]);
```

### Themes

```typescript
builder.setTheme({
  name: 'Corporate',
  colors: {
    primary: '#1E88E5',
    secondary: '#43A047',
    accent: '#FFC107',
    background: '#FFFFFF',
    text: '#212121',
    border: '#E0E0E0'
  },
  fonts: {
    default: 'Calibri',
    header: 'Calibri',
    body: 'Calibri'
  }
});
```

## Advanced Features

### Data Validation

```typescript
worksheet.addRow([
  {
    key: 'status',
    value: 'Active',
    type: CellType.STRING,
    validation: {
      type: 'list',
      formulae: ['Active', 'Inactive', 'Pending']
    }
  },
  {
    key: 'age',
    value: 25,
    type: CellType.NUMBER,
    validation: {
      type: 'whole',
      operator: 'between',
      formulae: [18, 100]
    }
  }
]);
```

### Images

```typescript
worksheet.addImage({
  path: './logo.png',
  name: 'Logo',
  extension: 'png',
  position: {
    row: 1,
    col: 1
  },
  width: 200,
  height: 100
});
```

### Pivot Tables

```typescript
worksheet.addPivotTable({
  name: 'SalesPivot',
  sourceRange: 'A1:D10',
  rows: ['Product'],
  columns: ['Month'],
  values: [
    { name: 'Total', formula: 'SUM(Amount)' }
  ],
  filters: ['Region']
});
```

### Excel Structured Tables

```typescript
worksheet.addExcelTable({
  name: 'SalesData',
  range: {
    start: 'A1',
    end: 'C10'
  },
  style: 'TableStyleMedium2',
  headerRow: true,
  totalRow: true,
  columns: [
    { name: 'Product', totalsRowLabel: 'Total' },
    { name: 'Quantity', totalsRowFunction: 'sum' },
    { name: 'Price', totalsRowFunction: 'sum' }
  ]
});
```

## Excel Reading

Extract data from existing Excel files.

### Using Instance Methods (Recommended)

```typescript
import { ExcelReader, OutputFormat } from '@hannndler/xlsx-builder';

// Create a reader instance with default options
const reader = new ExcelReader({
  outputFormat: OutputFormat.FLAT,
  useFirstRowAsHeaders: true,
  includeEmptyRows: false
});

// Read from buffer
const buffer = await fetch('report.xlsx').then(r => r.arrayBuffer());
const result = await reader.fromBuffer(buffer);

// Read from file (Node.js only)
const fileResult = await reader.fromPath('./report.xlsx', {
  sheetName: 'Sales' // Override specific option
});

// Read from Node.js Buffer (useful with multer or file uploads)
import multer from 'multer';
const upload = multer();
// In your route handler:
const result = await reader.fromNodeBuffer(req.file.buffer, {
  outputFormat: OutputFormat.FLAT
});

// Read from File (browser)
const fileInput = document.querySelector('input[type="file"]');
if (fileInput?.files?.[0]) {
  const fileResult = await reader.fromFile(fileInput.files[0]);
}

if (result.success) {
  console.log('Data:', result.data);
  console.log('Processing time:', result.processingTime, 'ms');
}
```

### Using Static Methods (Convenience)

```typescript
import { ExcelReader, OutputFormat } from '@hannndler/xlsx-builder';

// Read from buffer (static method)
const buffer = await fetch('report.xlsx').then(r => r.arrayBuffer());
const result = await ExcelReader.fromBuffer(buffer, {
  outputFormat: OutputFormat.WORKSHEET,
  includeFormatting: true,
  useFirstRowAsHeaders: true
});

if (result.success) {
  console.log('Worksheets:', result.data.sheets.length);
  result.data.sheets.forEach(sheet => {
    console.log('Sheet:', sheet.name);
    sheet.rows.forEach(row => {
      console.log('Row:', row.cells);
    });
  });
}

// Read from file (Node.js only)
const fileResult = await ExcelReader.fromPath('./report.xlsx', {
  outputFormat: OutputFormat.FLAT,
  sheetName: 'Sales'
});

// Read from Blob (browser)
const blob = await fetch('report.xlsx').then(r => r.blob());
const blobResult = await ExcelReader.fromBlob(blob, {
  outputFormat: OutputFormat.DETAILED
});

// Read from Node.js Buffer (useful with multer)
const bufferResult = await ExcelReader.fromNodeBuffer(req.file.buffer, {
  outputFormat: OutputFormat.WORKSHEET
});
```

## Environment Support

### Browser

```typescript
// Generate and download
await builder.generateAndDownload('report.xlsx');

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
await builder.saveToFile('./output/report.xlsx');

// Save to stream
const stream = fs.createWriteStream('./output/report.xlsx');
await builder.saveToStream(stream);

// Get as Buffer
const bufferResult = await builder.toBuffer();
if (bufferResult.success) {
  await fs.writeFile('./output/report.xlsx', Buffer.from(bufferResult.data));
}
```

## Events

Monitor build progress and handle errors.

```typescript
const builder = new ExcelBuilder({
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
console.log('Total worksheets:', stats.totalWorksheets);
console.log('Build time:', stats.buildTime, 'ms');
console.log('File size:', stats.fileSize, 'bytes');
console.log('Total cells:', stats.totalCells);
```

## API Reference

### ExcelBuilder

#### Methods

- `addWorksheet(name: string, config?: Partial<IWorksheetConfig>): IWorksheet` - Add a new worksheet
- `getWorksheet(name: string): IWorksheet | undefined` - Get a worksheet by name
- `removeWorksheet(name: string): boolean` - Remove a worksheet
- `setCurrentWorksheet(name: string): boolean` - Set the current worksheet
- `build(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Build the workbook
- `generateAndDownload(fileName: string, options?: IDownloadOptions): Promise<Result<void>>` - Generate and download (browser)
- `saveToFile(filePath: string, options?: ISaveFileOptions): Promise<Result<void>>` - Save to file (Node.js)
- `saveToStream(writeStream, options?: IBuildOptions): Promise<Result<void>>` - Save to stream (Node.js)
- `toBuffer(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Get as buffer
- `toBlob(options?: IBuildOptions): Promise<Result<Blob>>` - Get as blob
- `validate(): Result<boolean>` - Validate the workbook
- `clear(): void` - Clear all worksheets
- `getStats(): IBuildStats` - Get build statistics
- `addCellStyle(name: string, style: IStyle): this` - Add a predefined cell style
- `getCellStyle(name: string): IStyle | undefined` - Get a cell style by name
- `setTheme(theme: IWorkbookTheme): this` - Set workbook theme
- `getTheme(): IWorkbookTheme | undefined` - Get current theme

### Worksheet

#### Methods

- `addHeader(header: IHeaderCell): this` - Add a header row
- `addSubHeaders(subHeaders: IHeaderCell[]): this` - Add subheaders
- `addRow(row: IDataCell[] | IDataCell): this` - Add a row or rows
- `addFooter(footer: IFooterCell[] | IFooterCell): this` - Add footer(s)
- `addTable(tableConfig?: Partial<ITable>): this` - Add a new table
- `finalizeTable(): this` - Finalize the current table
- `getTable(name: string): ITable | undefined` - Get a table by name
- `addImage(image: IWorksheetImage): this` - Add an image
- `addExcelTable(table: IExcelTable): this` - Add an Excel structured table
- `addPivotTable(pivotTable: IPivotTable): this` - Add a pivot table
- `groupRows(startRow: number, endRow: number, collapsed?: boolean): this` - Group rows
- `groupColumns(startCol: number, endCol: number, collapsed?: boolean): this` - Group columns
- `hideRows(rows: number | number[]): this` - Hide rows
- `showRows(rows: number | number[]): this` - Show rows
- `hideColumns(columns: number | string | (number | string)[]): this` - Hide columns
- `showColumns(columns: number | string | (number | string)[]): this` - Show columns

### ExcelReader

Class for reading Excel files and converting them to JSON.

#### Constructor

```typescript
new ExcelReader(defaultOptions?: IExcelReaderOptions)
```

Creates a new ExcelReader instance with default options that will be used for all read operations.

#### Instance Methods

- `fromBuffer(buffer: ArrayBuffer, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from ArrayBuffer
- `fromBlob(blob: Blob, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from Blob
- `fromFile(file: File, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from File (browser)
- `fromNodeBuffer(buffer: Buffer, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from Node.js Buffer (Node.js only, useful with multer)
- `fromPath(filePath: string, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from file path (Node.js)

#### Static Methods (Convenience)

- `ExcelReader.fromBuffer(buffer: ArrayBuffer, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from buffer
- `ExcelReader.fromBlob(blob: Blob, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from Blob
- `ExcelReader.fromFile(file: File, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from File (browser)
- `ExcelReader.fromNodeBuffer(buffer: Buffer, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from Node.js Buffer (Node.js only, useful with multer)
- `ExcelReader.fromPath(filePath: string, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Read from file path (Node.js)

## TypeScript Support

This package is written in TypeScript and provides full type definitions. All types are exported and can be imported:

```typescript
import type {
  IExcelBuilder,
  IWorksheet,
  IWorksheetConfig,
  IHeaderCell,
  IDataCell,
  IFooterCell,
  IStyle,
  IWorkbookTheme,
  CellType,
  NumberFormat,
  HorizontalAlignment,
  VerticalAlignment
} from '@hannndler/xlsx-builder';
```

## Examples

See the repository for more examples and use cases.

## License

MIT

## Repository

[https://github.com/hannndler/han-documents](https://github.com/hannndler/han-documents)

## Support

For issues and questions, please open an issue on GitHub.
