# @han/pdf-builder

Generador avanzado de documentos PDF con soporte TypeScript, estilos completos y rendimiento optimizado.

## Características

- ✅ **Múltiples Páginas** - Crear PDFs con múltiples páginas
- ✅ **Contenido Rico** - Texto, imágenes, tablas, listas y más
- ✅ **Encabezados y Pies de Página Globales** - Aplicar encabezados y pies a todas las páginas
- ✅ **Estilos y Temas** - Sistema completo de estilos con temas
- ✅ **TypeScript** - Completamente tipado con verificación estricta de tipos
- ✅ **Multiplataforma** - Funciona en navegador y Node.js
- ✅ **Lectura de PDFs** - Extraer contenido de PDFs existentes
- ✅ **Motor de Plantillas** - Llenar formularios PDF y generar desde HTML
- ✅ **Sistema de Eventos** - Monitorear progreso y errores
- ✅ **Monitoreo de Rendimiento** - Rastrear estadísticas de construcción

## Instalación

```bash
npm install @han/pdf-builder
# o
pnpm add @han/pdf-builder
# o
yarn add @han/pdf-builder
```

## Inicio Rápido

### Uso Básico

```typescript
import { PDFBuilder } from '@han/pdf-builder';

// Crear un nuevo constructor de PDF
const builder = new PDFBuilder({
  metadata: {
    title: 'Mi Documento',
    author: 'Juan Pérez',
    subject: 'PDF de Ejemplo'
  }
});

// Agregar una página
const page = builder.addPage('Page1');
page.addText('¡Hola, Mundo!');
page.addText('Este es un documento PDF de ejemplo.');

// Generar PDF (Navegador)
await builder.generateAndDownload('documento.pdf');

// O guardar en archivo (Node.js)
await builder.saveToFile('./output/documento.pdf');
```

### Múltiples Páginas

```typescript
const builder = new PDFBuilder();

// Primera página
const page1 = builder.addPage('Portada');
page1.addText('Página de Portada', {
  font: { size: 24, style: 'bold' }
});

// Segunda página
const page2 = builder.addPage('Contenido');
page2.addText('Página de Contenido');
page2.addText('Más contenido aquí...');

await builder.generateAndDownload('multi-pagina.pdf');
```

## Componentes Principales

### PDFBuilder

Clase principal para crear documentos PDF.

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

Representa una página individual en el documento PDF.

```typescript
const page = builder.addPage('NombrePagina', {
  size?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL' | 'TABLOID' | [number, number];
  orientation?: 'portrait' | 'landscape';
  margins?: { top: number; right: number; bottom: number; left: number };
  backgroundColor?: Color;
  defaultFont?: string;
  defaultFontSize?: number;
});
```

## Tipos de Contenido

### Texto

```typescript
// Texto simple
page.addText('¡Hola, Mundo!');

// Texto con estilo
page.addText('Texto con Estilo', {
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

// Múltiples líneas
page.addText([
  'Línea 1',
  'Línea 2',
  'Línea 3'
]);
```

### Imágenes

```typescript
// Desde ruta de archivo (Node.js)
page.addImage('./ruta/a/imagen.png', {
  position: {
    x: 100,
    y: 100,
    width: 200,
    height: 150
  }
});

// Desde ArrayBuffer
const imageBuffer = await fetch('https://ejemplo.com/imagen.jpg')
  .then(r => r.arrayBuffer());
page.addImage(imageBuffer, {
  position: { x: 0, y: 0, width: 300, height: 200 },
  maintainAspectRatio: true
});
```

### Tablas

```typescript
page.addTable([
  {
    cells: [
      { content: 'Encabezado 1' },
      { content: 'Encabezado 2' },
      { content: 'Encabezado 3' }
    ],
    style: {
      font: { style: 'bold' },
      fill: { color: '#E0E0E0' }
    }
  },
  {
    cells: [
      { content: 'Fila 1, Col 1' },
      { content: 'Fila 1, Col 2' },
      { content: 'Fila 1, Col 3' }
    ]
  },
  {
    cells: [
      { content: 'Fila 2, Col 1' },
      { content: 'Fila 2, Col 2' },
      { content: 'Fila 2, Col 3' }
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

### Listas

```typescript
// Lista desordenada
page.addList([
  { content: 'Elemento 1' },
  { content: 'Elemento 2' },
  { content: 'Elemento 3' }
], {
  listType: 'unordered',
  bullet: '•'
});

// Lista ordenada
page.addList([
  { content: 'Primer elemento' },
  { content: 'Segundo elemento' },
  { content: 'Tercer elemento' }
], {
  listType: 'ordered'
});

// Lista anidada
page.addList([
  {
    content: 'Elemento padre',
    items: [
      { content: 'Elemento hijo 1' },
      { content: 'Elemento hijo 2' }
    ]
  }
]);
```

## Encabezados y Pies de Página Globales

Aplicar encabezados y pies de página a todas las páginas automáticamente.

```typescript
const builder = new PDFBuilder();

// Establecer encabezado global
builder.setGlobalHeader({
  type: 'text',
  text: 'Nombre de la Empresa - Confidencial',
  style: {
    font: { size: 10, color: '#666666' },
    alignment: { horizontal: 'center' }
  }
});

// Establecer pie de página global
builder.setGlobalFooter({
  type: 'text',
  text: 'Página {{pageNumber}} de {{totalPages}}',
  style: {
    font: { size: 9, color: '#999999' },
    alignment: { horizontal: 'center' }
  }
});

// Todas las páginas incluirán automáticamente estos encabezados/pies
const page1 = builder.addPage('Page1');
const page2 = builder.addPage('Page2');
```

## Estilos

### Estilos Predefinidos

```typescript
// Agregar un estilo
builder.addStyle('titulo', {
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

// Usar el estilo
const style = builder.getStyle('titulo');
page.addText('Título', style);
```

### Temas

```typescript
builder.setTheme({
  name: 'Corporativo',
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

## Lectura de PDFs

Extraer contenido de archivos PDF existentes.

```typescript
import { PDFReader } from '@han/pdf-builder';

// Leer desde buffer
const buffer = await fetch('documento.pdf').then(r => r.arrayBuffer());
const result = await PDFReader.fromBuffer(buffer, {
  outputFormat: 'pages',
  extractImages: true,
  extractLinks: true
});

if (result.success) {
  console.log('Total de páginas:', result.data.totalPages);
  result.data.pages.forEach(page => {
    console.log('Página', page.pageNumber, ':', page.content.text);
  });
}

// Leer desde archivo (solo Node.js)
const fileResult = await PDFReader.fromFile('./documento.pdf', {
  outputFormat: 'flat' // Obtener texto plano
});

if (fileResult.success) {
  console.log('Texto del PDF:', fileResult.data.text);
}
```

## Motor de Plantillas

### Llenar Formularios PDF

```typescript
import { TemplateEngine } from '@han/pdf-builder';

// Llenar campos de formulario en una plantilla PDF
const result = await TemplateEngine.fillPDFTemplate(
  './plantilla.pdf', // Ruta al PDF con campos de formulario
  {
    fields: {
      'nombre': 'Juan Pérez',
      'email': 'juan@ejemplo.com',
      'fecha': '2024-01-01',
      'acepta': true
    }
  }
);

if (result.success) {
  // Guardar PDF llenado
  await fs.writeFile('./llenado.pdf', Buffer.from(result.data.buffer));
}
```

### Generar desde HTML

```typescript
// Generar PDF desde HTML (solo Node.js)
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
        <h1>{{titulo}}</h1>
        <p>{{contenido}}</p>
      </body>
    </html>
  `,
  data: {
    fields: {
      titulo: 'Mi Documento',
      contenido: 'Este es el contenido'
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
  await fs.writeFile('./desde-html.pdf', Buffer.from(result.data));
}
```

## Soporte de Entornos

### Navegador

```typescript
// Generar y descargar
await builder.generateAndDownload('documento.pdf');

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
await builder.saveToFile('./output/documento.pdf');

// Guardar en stream
const stream = fs.createWriteStream('./output/documento.pdf');
await builder.saveToStream(stream);

// Obtener como Buffer
const bufferResult = await builder.toBuffer();
if (bufferResult.success) {
  await fs.writeFile('./output/documento.pdf', Buffer.from(bufferResult.data));
}
```

## Eventos

Monitorear el progreso de construcción y manejar errores.

```typescript
const builder = new PDFBuilder({
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
console.log('Total de páginas:', stats.totalPages);
console.log('Tiempo de construcción:', stats.buildTime, 'ms');
console.log('Tamaño del archivo:', stats.fileSize, 'bytes');
console.log('Bloques de contenido:', stats.totalContentBlocks);
```

## Referencia de API

### PDFBuilder

#### Métodos

- `addPage(name: string, config?: Partial<IPDFPageConfig>): IPDFPage` - Agregar una nueva página
- `getPage(name: string): IPDFPage | undefined` - Obtener una página por nombre
- `removePage(name: string): boolean` - Eliminar una página
- `setCurrentPage(name: string): boolean` - Establecer la página actual
- `build(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Construir el PDF
- `generateAndDownload(fileName: string, options?: IDownloadOptions): Promise<Result<void>>` - Generar y descargar (navegador)
- `saveToFile(filePath: string, options?: ISaveFileOptions): Promise<Result<void>>` - Guardar en archivo (Node.js)
- `saveToStream(writeStream, options?: IBuildOptions): Promise<Result<void>>` - Guardar en stream (Node.js)
- `toBuffer(options?: IBuildOptions): Promise<Result<ArrayBuffer>>` - Obtener como buffer
- `toBlob(options?: IBuildOptions): Promise<Result<Blob>>` - Obtener como blob
- `validate(): Result<boolean>` - Validar el documento
- `clear(): void` - Limpiar todas las páginas
- `getStats(): IPDFStats` - Obtener estadísticas de construcción
- `addStyle(name: string, style: IPDFStyle): this` - Agregar un estilo predefinido
- `getStyle(name: string): IPDFStyle | undefined` - Obtener un estilo por nombre
- `setTheme(theme: IPDFTheme): this` - Establecer tema del PDF
- `getTheme(): IPDFTheme | undefined` - Obtener tema actual
- `setGlobalHeader(content: IPDFContentBlock | IPDFContentBlock[]): this` - Establecer encabezado global
- `setGlobalFooter(content: IPDFContentBlock | IPDFContentBlock[]): this` - Establecer pie de página global
- `getGlobalHeader(): IPDFContentBlock[]` - Obtener encabezado global
- `getGlobalFooter(): IPDFContentBlock[]` - Obtener pie de página global

### PDFPage

#### Métodos

- `addHeader(content: IPDFContentBlock | IPDFContentBlock[]): this` - Agregar contenido de encabezado
- `addFooter(content: IPDFContentBlock | IPDFContentBlock[]): this` - Agregar contenido de pie de página
- `addContent(content: IPDFContentBlock | IPDFContentBlock[]): this` - Agregar contenido al cuerpo
- `addText(text: string | string[], style?: IPDFStyle): this` - Agregar texto
- `addImage(source: string | ArrayBuffer | Uint8Array, options?: Partial<IImageContent>): this` - Agregar imagen
- `addTable(rows: ITableRow[], options?: Partial<Omit<ITableContent, 'type' | 'rows'>>): this` - Agregar tabla
- `addList(items: IListItem[], options?: Partial<Omit<IListContent, 'type' | 'items'>>): this` - Agregar lista

### PDFReader

#### Métodos Estáticos

- `fromBuffer(buffer: ArrayBuffer, options?: IPDFReaderOptions): Promise<PDFReaderResult>` - Leer desde buffer
- `fromFile(filePath: string, options?: IPDFReaderOptions): Promise<PDFReaderResult>` - Leer desde archivo (Node.js)

### TemplateEngine

#### Métodos Estáticos

- `fillPDFTemplate(templateSource: string | ArrayBuffer | Uint8Array, data: ITemplateData): Promise<Result<ITemplateFillResult>>` - Llenar formulario PDF
- `generatePDFFromHTML(template: IHTMLTemplate): Promise<Result<ArrayBuffer>>` - Generar desde HTML (Node.js)
- `fillTemplate(config: ITemplateConfig, data: ITemplateData): Promise<Result<ArrayBuffer>>` - Llenar plantilla (wrapper)

## Soporte TypeScript

Este paquete está escrito en TypeScript y proporciona definiciones de tipos completas. Todos los tipos se exportan y se pueden importar:

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

## Ejemplos

Ver el directorio `examples/` para más ejemplos:

- `generate-pdf.ts` - Ejemplo básico de generación de PDF

## Licencia

MIT

## Repositorio

[https://github.com/hannndler/han-documents](https://github.com/hannndler/han-documents)

## Soporte

Para problemas y preguntas, por favor abre un issue en GitHub.
