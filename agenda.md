# Agenda de Desarrollo - Han Documents Monorepo

## 📋 Índice

1. [Visión General](#visión-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Paquetes](#paquetes)
4. [Configuración del Entorno](#configuración-del-entorno)
5. [Comandos de Desarrollo](#comandos-de-desarrollo)
6. [Arquitectura y Diseño](#arquitectura-y-diseño)
7. [Convenciones de Código](#convenciones-de-código)
8. [Flujo de Trabajo](#flujo-de-trabajo)
9. [Publicación](#publicación)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

Este monorepo contiene una suite de herramientas para generación de documentos (Excel, Word, PDF) con código compartido. Utiliza **Turborepo** para gestión de builds y **pnpm workspaces** para gestión de dependencias.

### Tecnologías Principales

- **TypeScript**: Lenguaje principal
- **Turborepo**: Build system y task orchestration
- **pnpm**: Gestor de paquetes con workspaces
- **Vite**: Build tool para los paquetes
- **Changesets**: Gestión de versiones y changelogs

---

## 📁 Estructura del Proyecto

```
han-documents/
├── packages/
│   ├── han-documents-core/     # @han/core - Código compartido
│   ├── han-excel-builder/      # @han/xlsx-builder - Generador Excel
│   ├── han-word-builder/        # @han/docx-builder - Generador Word
│   └── han-pdf-builder/         # @han/pdf-builder - Generador PDF
├── apps/                        # Aplicaciones (futuro)
├── turbo.json                   # Configuración Turborepo
├── pnpm-workspace.yaml         # Configuración pnpm workspaces
├── tsconfig.json               # Configuración TypeScript base
├── package.json                # Root package.json
└── agenda.md                   # Este archivo
```

---

## 📦 Paquetes

### @han/core

**Propósito**: Paquete compartido con tipos, utilidades y constantes comunes.

**Ubicación**: `packages/han-documents-core/`

**Contenido**:
- Tipos compartidos (`IDocumentMetadata`, `Result<T>`, `Color`, etc.)
- Utilidades (`formatting`, `validation`, `type-inference`, `date-utils`)
- Constantes (`DATE_FORMATS`, `NUMBER_FORMATS`, `PAGE_SIZES`, etc.)

**Dependencias**: Ninguna (solo devDependencies)

**Uso**:
```typescript
import { Result, success, error, IDocumentMetadata } from '@han/core';
```

---

### @han/xlsx-builder

**Propósito**: Generador avanzado de archivos Excel (XLSX) con soporte completo de TypeScript.

**Ubicación**: `packages/han-excel-builder/`

**Dependencias**:
- `@han/core`: Tipos y utilidades compartidas
- `exceljs`: Biblioteca subyacente para Excel
- `file-saver`: Para descargas en navegador

**Características**:
- Múltiples worksheets
- Estilos avanzados (fuentes, colores, bordes, alineación)
- Headers anidados
- Tablas estructuradas
- Filtros automáticos
- Formato condicional
- Validación de datos
- Imágenes
- Tablas dinámicas (pivot tables)
- Temas personalizables

**Uso**:
```typescript
import { ExcelBuilder, CellType } from '@han/xlsx-builder';

const builder = new ExcelBuilder({
  metadata: { title: 'Reporte', author: 'Mi Empresa' }
});

const sheet = builder.addWorksheet('Datos');
sheet.addHeader({ key: 'title', value: 'Título', type: CellType.STRING });

const result = await builder.build();
```

---

### @han/docx-builder

**Propósito**: Generador de documentos Word (DOCX) con TypeScript.

**Ubicación**: `packages/han-word-builder/`

**Dependencias**:
- `@han/core`: Tipos y utilidades compartidas
- `docx`: Biblioteca subyacente para Word

**Estado**: Implementación base (en desarrollo)

**Uso**:
```typescript
import { WordBuilder } from '@han/docx-builder';

const builder = new WordBuilder({
  metadata: { title: 'Documento', author: 'Autor' }
});

builder.addParagraph('Contenido del documento');
const result = await builder.build();
```

---

### @han/pdf-builder

**Propósito**: Generador de documentos PDF con TypeScript.

**Ubicación**: `packages/han-pdf-builder/`

**Dependencias**:
- `@han/core`: Tipos y utilidades compartidas
- `pdfkit`: Biblioteca subyacente para PDF

**Estado**: Implementación base (en desarrollo)

**Uso**:
```typescript
import { PDFBuilder } from '@han/pdf-builder';

const builder = new PDFBuilder({
  metadata: { title: 'PDF', author: 'Autor' }
});

builder.addText('Contenido del PDF');
const result = await builder.build();
```

---

## ⚙️ Configuración del Entorno

### Requisitos

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Git**: Para control de versiones

### Instalación Inicial

```bash
# Clonar el repositorio
git clone <repo-url>
cd han-documents

# Instalar dependencias
pnpm install

# Build inicial
pnpm build
```

---

## 🛠️ Comandos de Desarrollo

### Comandos del Root

```bash
# Instalar dependencias
pnpm install

# Build de todos los paquetes
pnpm build

# Desarrollo en modo watch
pnpm dev

# Linting
pnpm lint

# Type checking
pnpm type-check

# Tests
pnpm test

# Limpiar builds
pnpm clean

# Formatear código
pnpm format
```

### Comandos por Paquete

```bash
# Trabajar en un paquete específico
cd packages/han-excel-builder

# Build del paquete
pnpm build

# Desarrollo con watch
pnpm dev

# Type check
pnpm type-check

# Tests
pnpm test

# Limpiar
pnpm clean
```

### Comandos con Turborepo

Turborepo permite ejecutar comandos en paralelo y con caché:

```bash
# Build solo de paquetes que cambiaron
pnpm build

# Build de un paquete específico y sus dependencias
pnpm build --filter=@han/xlsx-builder

# Build de todos los paquetes excepto uno
pnpm build --filter=!@han/pdf-builder
```

---

## 🏗️ Arquitectura y Diseño

### Principios de Diseño

1. **Código Compartido**: Tipos comunes, utilidades y constantes en `@han/core`
2. **API Unificada**: Todos los builders implementan `IDocumentBuilder<TConfig, TOutput>`
3. **Result Pattern**: Uso de `Result<T>` para manejo de errores consistente
4. **Type Safety**: TypeScript estricto en todos los paquetes
5. **Modularidad**: Cada builder es independiente pero comparte tipos

### Flujo de Datos

```
Usuario
  ↓
Builder (ExcelBuilder/WordBuilder/PDFBuilder)
  ↓
@han/core (tipos, utilidades, validación)
  ↓
Librería subyacente (ExcelJS/docx/pdfkit)
  ↓
Archivo generado (ArrayBuffer/Blob/Buffer)
```

### Estructura de Tipos

```
@han/core
├── types/
│   ├── metadata.types.ts      # IDocumentMetadata, IExcelMetadata, etc.
│   ├── result.types.ts        # Result<T>, success(), error()
│   ├── color.types.ts         # Color type y conversiones
│   └── builder-base.types.ts  # IDocumentBuilder interface base
├── utils/
│   ├── formatting.ts          # Utilidades de formato
│   ├── validation.ts          # Validaciones comunes
│   ├── type-inference.ts      # Inferencia de tipos
│   └── date-utils.ts          # Utilidades de fecha
└── constants/
    ├── formats.ts             # Formatos de fecha/número
    └── sizes.ts               # Tamaños de página
```

### Dependencias entre Paquetes

```
@han/xlsx-builder ──┐
@han/docx-builder ──┼──> @han/core
@han/pdf-builder  ───┘
```

**Regla**: Los builders dependen de `@han/core`, pero `@han/core` NO depende de ningún builder.

---

## 📝 Convenciones de Código

### Nomenclatura

- **Clases**: PascalCase (`ExcelBuilder`, `WordBuilder`)
- **Interfaces**: PascalCase con prefijo `I` (`IExcelBuilder`, `IDocumentMetadata`)
- **Tipos**: PascalCase (`Result<T>`, `Color`)
- **Enums**: PascalCase (`ErrorType`, `CellType`)
- **Funciones**: camelCase (`success()`, `error()`, `formatDate()`)
- **Variables**: camelCase (`workbook`, `worksheet`, `cellValue`)
- **Constantes**: UPPER_SNAKE_CASE (`DATE_FORMATS`, `PAGE_SIZES`)

### Estructura de Archivos

```
packages/[nombre-paquete]/
├── src/
│   ├── core/              # Clases principales
│   ├── types/             # Definiciones de tipos
│   ├── utils/             # Utilidades específicas del paquete
│   ├── styles/            # Estilos (solo Excel)
│   └── index.ts           # Punto de entrada
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Imports

**Orden de imports**:
1. Librerías externas (`exceljs`, `docx`, etc.)
2. Paquetes compartidos (`@han/core`)
3. Imports relativos del mismo paquete

**Ejemplo**:
```typescript
import ExcelJS from 'exceljs';
import { Result, success, error } from '@han/core';
import { Worksheet } from './Worksheet';
import { IExcelBuilderConfig } from '../types/builder.types';
```

### Manejo de Errores

**Siempre usar `Result<T>`**:
```typescript
// ✅ Correcto
async build(): Promise<Result<ArrayBuffer>> {
  try {
    // ... lógica
    return success(buffer);
  } catch (err) {
    return error(ErrorType.BUILD_ERROR, err.message);
  }
}

// ❌ Incorrecto
async build(): Promise<ArrayBuffer> {
  // No usar throw directamente
}
```

### Comentarios

- **JSDoc** para clases públicas y métodos importantes
- **Comentarios inline** para lógica compleja
- **Comentarios TODO** para funcionalidades pendientes

**Ejemplo**:
```typescript
/**
 * Construye el workbook de Excel
 * 
 * @param options - Opciones de construcción
 * @returns Result con el ArrayBuffer del archivo
 */
async build(options: IBuildOptions = {}): Promise<Result<ArrayBuffer>> {
  // ...
}
```

---

## 🔄 Flujo de Trabajo

### Desarrollo de una Nueva Feature

1. **Crear branch**:
   ```bash
   git checkout -b feature/nombre-feature
   ```

2. **Desarrollar en el paquete correspondiente**:
   ```bash
   cd packages/han-excel-builder
   pnpm dev  # Modo watch
   ```

3. **Asegurar que los tipos compartidos estén en `@han/core`**:
   - Si necesitas tipos nuevos, agregarlos primero a `@han/core`
   - Luego importarlos en el builder

4. **Tests**:
   ```bash
   pnpm test
   ```

5. **Type check**:
   ```bash
   pnpm type-check
   ```

6. **Build**:
   ```bash
   pnpm build
   ```

### Agregar un Nuevo Paquete

1. **Crear estructura**:
   ```bash
   mkdir packages/nuevo-paquete
   cd packages/nuevo-paquete
   ```

2. **Inicializar package.json**:
   - Nombre: `@han/[nombre]-builder`
   - Dependencia: `@han/core: workspace:*`
   - Scripts estándar (build, dev, test, etc.)

3. **Configurar TypeScript**:
   - Extender `../../tsconfig.json`
   - Referencia a `@han/core` en `references`

4. **Configurar Vite**:
   - Externalizar `@han/core` y librerías subyacentes
   - Configurar build de librería

5. **Implementar `IDocumentBuilder`**:
   ```typescript
   import { IDocumentBuilder, IBuilderConfig, Result } from '@han/core';
   
   export class NuevoBuilder implements IDocumentBuilder {
     // ...
   }
   ```

---

## 📤 Publicación

### Proceso de Publicación

1. **Crear changeset**:
   ```bash
   pnpm changeset
   ```
   - Seleccionar paquetes afectados
   - Tipo de cambio (major/minor/patch)
   - Descripción del cambio

2. **Versionar paquetes**:
   ```bash
   pnpm version-packages
   ```
   - Actualiza versiones según changesets
   - Genera changelogs

3. **Build**:
   ```bash
   pnpm build
   ```

4. **Publicar**:
   ```bash
   pnpm release
   ```
   - Publica a npm
   - Crea tags de Git
   - Publica changelogs

### Versionado

- **Major**: Cambios incompatibles en API
- **Minor**: Nuevas features compatibles hacia atrás
- **Patch**: Bug fixes compatibles

**Ejemplo**:
- `@han/xlsx-builder`: v2.0.0 (estable)
- `@han/docx-builder`: v0.1.0 (desarrollo inicial)
- `@han/pdf-builder`: v0.1.0 (desarrollo inicial)
- `@han/core`: v0.1.0 (desarrollo inicial)

---

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Cannot find module '@han/core'"

**Solución**:
```bash
# Reinstalar dependencias
pnpm install

# Verificar que el paquete core esté construido
cd packages/han-documents-core
pnpm build
```

#### Error: "Module not found" en TypeScript

**Solución**:
- Verificar que `tsconfig.json` tenga la referencia correcta:
  ```json
  {
    "references": [
      { "path": "../han-documents-core" }
    ]
  }
  ```

#### Build falla con errores de tipos

**Solución**:
```bash
# Limpiar y rebuild
pnpm clean
pnpm build

# Verificar tipos
pnpm type-check
```

#### Caché de Turborepo corrupta

**Solución**:
```bash
# Limpiar caché de Turborepo
pnpm turbo clean

# Rebuild sin caché
pnpm build --force
```

---

## 📚 Recursos Adicionales

### Documentación Externa

- [Turborepo Docs](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)

### Estructura de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(@han/xlsx-builder): agregar soporte para imágenes
fix(@han/core): corregir validación de fechas
docs: actualizar README
refactor(@han/docx-builder): simplificar construcción de párrafos
```

---

## ✅ Checklist de Desarrollo

Antes de hacer commit:

- [ ] Código compila sin errores (`pnpm build`)
- [ ] Type check pasa (`pnpm type-check`)
- [ ] Tests pasan (`pnpm test`)
- [ ] Linting pasa (`pnpm lint`)
- [ ] Documentación actualizada si es necesario
- [ ] Changeset creado si hay cambios públicos

---

## 🎯 Próximos Pasos

### Pendientes

- [ ] Completar implementación de `@han/docx-builder`
- [ ] Completar implementación de `@han/pdf-builder`
- [ ] Agregar tests unitarios completos
- [ ] Documentación API con TypeDoc
- [ ] Ejemplos de uso
- [ ] CI/CD con GitHub Actions
- [ ] API unificada (SaaS)

---

**Última actualización**: 2024

