# @han/xlsx-builder

Generador avanzado de archivos Excel con soporte TypeScript, estilos completos y rendimiento optimizado.

## Características

- ✅ **Múltiples Hojas de Cálculo** - Crear libros de trabajo con múltiples hojas
- ✅ **Contenido Rico** - Encabezados, subencabezados, filas, pies de página, tablas, imágenes
- ✅ **Estilos Avanzados** - Fuentes, colores, bordes, alineación, formato condicional
- ✅ **Encabezados Anidados** - Soporte para estructuras de encabezados multinivel
- ✅ **Tablas Estructuradas** - Tablas estructuradas de Excel con auto-filtros
- ✅ **Tablas Dinámicas** - Crear tablas dinámicas para análisis de datos
- ✅ **Validación de Datos** - Validar valores y tipos de celdas
- ✅ **Imágenes** - Agregar imágenes a las hojas de cálculo
- ✅ **Temas** - Sistema completo de temas
- ✅ **TypeScript** - Completamente tipado con verificación estricta de tipos
- ✅ **Multiplataforma** - Funciona en navegador y Node.js
- ✅ **Lectura de Excel** - Leer y extraer datos de archivos Excel
- ✅ **Sistema de Eventos** - Monitorear progreso y errores
- ✅ **Monitoreo de Rendimiento** - Rastrear estadísticas de construcción

## Instalación

```bash
npm install @han/xlsx-builder
# o
pnpm add @han/xlsx-builder
# o
yarn add @han/xlsx-builder
```

## Inicio Rápido

### Uso Básico

```typescript
import { ExcelBuilder, CellType } from '@han/xlsx-builder';

// Crear un nuevo constructor de Excel
const builder = new ExcelBuilder({
  metadata: {
    title: 'Reporte de Ventas',
    author: 'Juan Pérez',
    subject: 'Datos de Ventas Mensuales'
  }
});

// Agregar una hoja de cálculo
const worksheet = builder.addWorksheet('Ventas');

// Agregar encabezado
worksheet.addHeader({
  key: 'title',
  value: 'Reporte de Ventas Mensual',
  type: CellType.STRING
});

// Agregar filas de datos
worksheet.addRow([
  { key: 'producto', value: 'Producto A', type: CellType.STRING },
  { key: 'cantidad', value: 100, type: CellType.NUMBER },
  { key: 'precio', value: 29.99, type: CellType.NUMBER }
]);

// Generar Excel (Navegador)
await builder.generateAndDownload('reporte.xlsx');

// O guardar en archivo (Node.js)
await builder.saveToFile('./output/reporte.xlsx');
```

### Múltiples Hojas de Cálculo

```typescript
const builder = new ExcelBuilder();

// Primera hoja
const hojaVentas = builder.addWorksheet('Ventas');
hojaVentas.addHeader({ key: 'title', value: 'Datos de Ventas', type: CellType.STRING });
hojaVentas.addRow([
  { key: 'mes', value: 'Enero', type: CellType.STRING },
  { key: 'monto', value: 5000, type: CellType.NUMBER }
]);

// Segunda hoja
const hojaResumen = builder.addWorksheet('Resumen');
hojaResumen.addHeader({ key: 'title', value: 'Resumen', type: CellType.STRING });
hojaResumen.addRow([
  { key: 'total', value: 5000, type: CellType.NUMBER }
]);

await builder.generateAndDownload('multi-hoja.xlsx');
```

## Componentes Principales

### ExcelBuilder

Clase principal para crear libros de trabajo Excel.

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

Representa una hoja de cálculo individual en el libro de trabajo.

```typescript
const worksheet = builder.addWorksheet('NombreHoja', {
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

## Tipos de Contenido

### Encabezados

```typescript
// Encabezado simple
worksheet.addHeader({
  key: 'title',
  value: 'Título del Reporte',
  type: CellType.STRING
});

// Encabezado con estilo
worksheet.addHeader({
  key: 'title',
  value: 'Encabezado con Estilo',
  type: CellType.STRING,
  styles: {
    font: { bold: true, size: 16, color: '#FF0000' },
    fill: { fgColor: '#FFFF00' },
    alignment: { horizontal: 'center' }
  }
});
```

### Subencabezados (Anidados)

```typescript
worksheet.addSubHeaders([
  {
    key: 'header1',
    value: 'Encabezado Principal',
    type: CellType.STRING,
    colSpan: 2
  },
  {
    key: 'subheader1',
    value: 'Sub Encabezado 1',
    type: CellType.STRING
  },
  {
    key: 'subheader2',
    value: 'Sub Encabezado 2',
    type: CellType.STRING
  }
]);
```

### Filas

```typescript
// Fila única
worksheet.addRow([
  { key: 'nombre', value: 'Juan Pérez', type: CellType.STRING },
  { key: 'edad', value: 30, type: CellType.NUMBER },
  { key: 'activo', value: true, type: CellType.BOOLEAN }
]);

// Múltiples filas
worksheet.addRow([
  { key: 'producto', value: 'Producto A', type: CellType.STRING },
  { key: 'precio', value: 29.99, type: CellType.NUMBER }
]);
worksheet.addRow([
  { key: 'producto', value: 'Producto B', type: CellType.STRING },
  { key: 'precio', value: 39.99, type: CellType.NUMBER }
]);
```

### Tablas

```typescript
// Agregar una tabla estructurada
worksheet.addTable({
  name: 'TablaVentas',
  headers: [
    { key: 'producto', value: 'Producto', type: CellType.STRING },
    { key: 'cantidad', value: 'Cantidad', type: CellType.NUMBER },
    { key: 'precio', value: 'Precio', type: CellType.NUMBER }
  ],
  body: [
    [
      { key: 'producto', value: 'Producto A', type: CellType.STRING },
      { key: 'cantidad', value: 100, type: CellType.NUMBER },
      { key: 'precio', value: 29.99, type: CellType.NUMBER }
    ],
    [
      { key: 'producto', value: 'Producto B', type: CellType.STRING },
      { key: 'cantidad', value: 200, type: CellType.NUMBER },
      { key: 'precio', value: 39.99, type: CellType.NUMBER }
    ]
  ],
  showBorders: true,
  showStripes: true,
  autoFilter: true
});
```

### Pies de Página

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

## Estilos

### Estilos de Celdas

```typescript
// Agregar un estilo predefinido
builder.addCellStyle('encabezado', {
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

// Usar el estilo
const style = builder.getCellStyle('encabezado');
worksheet.addHeader({
  key: 'title',
  value: 'Título',
  type: CellType.STRING,
  styles: style
});
```

### Formato Condicional

```typescript
worksheet.addRow([
  {
    key: 'valor',
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

### Temas

```typescript
builder.setTheme({
  name: 'Corporativo',
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

## Características Avanzadas

### Validación de Datos

```typescript
worksheet.addRow([
  {
    key: 'estado',
    value: 'Activo',
    type: CellType.STRING,
    validation: {
      type: 'list',
      formulae: ['Activo', 'Inactivo', 'Pendiente']
    }
  },
  {
    key: 'edad',
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

### Imágenes

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

### Tablas Dinámicas

```typescript
worksheet.addPivotTable({
  name: 'PivotVentas',
  sourceRange: 'A1:D10',
  rows: ['Producto'],
  columns: ['Mes'],
  values: [
    { name: 'Total', formula: 'SUM(Monto)' }
  ],
  filters: ['Región']
});
```

### Tablas Estructuradas de Excel

```typescript
worksheet.addExcelTable({
  name: 'DatosVentas',
  range: {
    start: 'A1',
    end: 'C10'
  },
  style: 'TableStyleMedium2',
  headerRow: true,
  totalRow: true,
  columns: [
    { name: 'Producto', totalsRowLabel: 'Total' },
    { name: 'Cantidad', totalsRowFunction: 'sum' },
    { name: 'Precio', totalsRowFunction: 'sum' }
  ]
});
```

## Lectura de Excel

Extraer datos de archivos Excel existentes.

```typescript
import { ExcelReader, OutputFormat } from '@han/xlsx-builder';

// Leer desde buffer
const buffer = await fetch('reporte.xlsx').then(r => r.arrayBuffer());
const result = await ExcelReader.fromBuffer(buffer, {
  outputFormat: OutputFormat.WORKSHEET,
  includeFormatting: true,
  useFirstRowAsHeaders: true
});

if (result.success) {
  console.log('Hojas de cálculo:', result.data.worksheets.length);
  result.data.worksheets.forEach(sheet => {
    console.log('Hoja:', sheet.name);
    sheet.rows.forEach(row => {
      console.log('Fila:', row.cells);
    });
  });
}

// Leer desde archivo (solo Node.js)
const fileResult = await ExcelReader.fromFile('./reporte.xlsx', {
  outputFormat: OutputFormat.FLAT, // Obtener texto plano
  sheetName: 'Ventas' // Leer hoja específica
});

if (fileResult.success) {
  console.log('Texto de la hoja:', fileResult.data.text);
}
```

## Soporte de Entornos

### Navegador

```typescript
// Generar y descargar
await builder.generateAndDownload('reporte.xlsx');

// Obtener como Blob
const blobResult = await builder.toBlob();
if (blobResult.success) {
  const url = URL.createObjectURL(blobResult.data);
  // Usar la URL
}
```

### Node.js

```typescript
// Guardar en archivo
await builder.saveToFile('./output/reporte.xlsx');

// Guardar en stream
const stream = fs.createWriteStream('./output/reporte.xlsx');
await builder.saveToStream(stream);

// Obtener como Buffer
const bufferResult = await builder.toBuffer();
if (bufferResult.success) {
  await fs.writeFile('./output/reporte.xlsx', Buffer.from(bufferResult.data));
}
```

## Eventos

Monitorear el progreso de construcción y manejar errores.

```typescript
const builder = new ExcelBuilder({
  enableEvents: true
});

// Escuchar eventos (si EventEmitter está expuesto)
// builder.on('buildStarted', () => console.log('Construcción iniciada'));
// builder.on('buildCompleted', (data) => console.log('Construcción completada', data));
// builder.on('buildError', (error) => console.error('Error de construcción', error));
```

## Estadísticas

Obtener estadísticas de construcción.

```typescript
const stats = builder.getStats();
console.log('Total de hojas:', stats.totalWorksheets);
console.log('Tiempo de construcción:', stats.buildTime, 'ms');
console.log('Tamaño del archivo:', stats.fileSize, 'bytes');
console.log('Total de celdas:', stats.totalCells);
```

## Referencia de API

### ExcelBuilder

#### Métodos

- `addWorksheet(name: string, config?: Partial<IWorksheetConfig>): IWorksheet` - Agregar una nueva hoja de cálculo
- `getWorksheet(name: string): IWorksheet | undefined` - Obtener una hoja por nombre
- `removeWorksheet(name: string): boolean` - Eliminar una hoja de cálculo
- `setCurrentWorksheet(name: string): boolean` - Establecer la hoja actual
- `build(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Construir el libro de trabajo
- `generateAndDownload(fileName: string, options?: IDownloadOptions): Promise<Result<void>>` - Generar y descargar (navegador)
- `saveToFile(filePath: string, options?: ISaveFileOptions): Promise<Result<void>>` - Guardar en archivo (Node.js)
- `saveToStream(writeStream, options?: IBuildOptions): Promise<Result<void>>` - Guardar en stream (Node.js)
- `toBuffer(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Obtener como buffer
- `toBlob(options?: IBuildOptions): Promise<Result<Blob>>` - Obtener como blob
- `validate(): Result<boolean>` - Validar el libro de trabajo
- `clear(): void` - Limpiar todas las hojas de cálculo
- `getStats(): IBuildStats` - Obtener estadísticas de construcción
- `addCellStyle(name: string, style: IStyle): this` - Agregar un estilo de celda predefinido
- `getCellStyle(name: string): IStyle | undefined` - Obtener un estilo de celda por nombre
- `setTheme(theme: IWorkbookTheme): this` - Establecer tema del libro de trabajo
- `getTheme(): IWorkbookTheme | undefined` - Obtener tema actual

### Worksheet

#### Métodos

- `addHeader(header: IHeaderCell): this` - Agregar una fila de encabezado
- `addSubHeaders(subHeaders: IHeaderCell[]): this` - Agregar subencabezados
- `addRow(row: IDataCell[] | IDataCell): this` - Agregar una fila o filas
- `addFooter(footer: IFooterCell[] | IFooterCell): this` - Agregar pie(s) de página
- `addTable(tableConfig?: Partial<ITable>): this` - Agregar una nueva tabla
- `finalizeTable(): this` - Finalizar la tabla actual
- `getTable(name: string): ITable | undefined` - Obtener una tabla por nombre
- `addImage(image: IWorksheetImage): this` - Agregar una imagen
- `addExcelTable(table: IExcelTable): this` - Agregar una tabla estructurada de Excel
- `addPivotTable(pivotTable: IPivotTable): this` - Agregar una tabla dinámica
- `groupRows(startRow: number, endRow: number, collapsed?: boolean): this` - Agrupar filas
- `groupColumns(startCol: number, endCol: number, collapsed?: boolean): this` - Agrupar columnas
- `hideRows(rows: number | number[]): this` - Ocultar filas
- `showRows(rows: number | number[]): this` - Mostrar filas
- `hideColumns(columns: number | string | (number | string)[]): this` - Ocultar columnas
- `showColumns(columns: number | string | (number | string)[]): this` - Mostrar columnas

### ExcelReader

#### Métodos Estáticos

- `fromBuffer(buffer: ArrayBuffer, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Leer desde buffer
- `fromFile(filePath: string, options?: IExcelReaderOptions): Promise<ExcelReaderResult>` - Leer desde archivo (Node.js)

## Soporte TypeScript

Este paquete está escrito en TypeScript y proporciona definiciones de tipos completas. Todos los tipos se exportan y se pueden importar:

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
} from '@han/xlsx-builder';
```

## Ejemplos

Ver el repositorio para más ejemplos y casos de uso.

## Licencia

MIT

## Repositorio

[https://github.com/hannndler/han-documents](https://github.com/hannndler/han-documents)

## Soporte

Para problemas y preguntas, por favor abre un issue en GitHub.
