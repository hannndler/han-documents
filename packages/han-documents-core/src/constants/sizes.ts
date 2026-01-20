/**
 * Tamaños de página estándar (en puntos)
 */
export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  LETTER: { width: 612, height: 792 },
  LEGAL: { width: 612, height: 1008 }
} as const;

/**
 * Márgenes estándar (en puntos)
 */
export const MARGINS = {
  NORMAL: { top: 72, right: 72, bottom: 72, left: 72 },
  NARROW: { top: 36, right: 36, bottom: 36, left: 36 },
  WIDE: { top: 144, right: 144, bottom: 144, left: 144 }
} as const;

