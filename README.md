# Han Documents Monorepo

Monorepo para generación de documentos (Excel, Word, PDF) con código compartido.

## Estructura

```
han-documents/
├── packages/
│   ├── han-documents-core/     # Código compartido (@han/core)
│   ├── han-excel-builder/      # Generador de Excel (@han/xlsx-builder)
│   ├── han-word-builder/        # Generador de Word (@han/docx-builder)
│   └── han-pdf-builder/         # Generador de PDF (@han/pdf-builder)
├── apps/
│   └── api/                     # API unificada (futuro)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Instalación

```bash
pnpm install
```

## Build

```bash
pnpm build
```

## Desarrollo

```bash
pnpm dev
```

## Publicación

Los paquetes se publican individualmente usando Changesets:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

## Paquetes

- **@han/core**: Tipos, utilidades y constantes compartidas
- **@han/xlsx-builder**: Generador de archivos Excel (v2.0.0)
- **@han/docx-builder**: Generador de archivos Word (v0.1.0)
- **@han/pdf-builder**: Generador de archivos PDF (v0.1.0)

