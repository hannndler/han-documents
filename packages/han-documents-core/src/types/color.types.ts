/**
 * Tipo de color - compatible con todos los formatos
 */
export type Color = 
  | string                    // Hex: '#FF0000' o 'FF0000'
  | { r: number; g: number; b: number }  // RGB
  | { theme: number }         // Color de tema (Excel)
  | { c: number; m: number; y: number; k: number }  // CMYK (PDF)

/**
 * Convierte color a formato hex
 */
export function colorToHex(color: Color): string {
  if (typeof color === 'string') {
    return color.startsWith('#') ? color : `#${color}`;
  }
  if ('r' in color && 'g' in color && 'b' in color) {
    const r = color.r.toString(16).padStart(2, '0');
    const g = color.g.toString(16).padStart(2, '0');
    const b = color.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#000000'; // Default
}

/**
 * Convierte color a RGB
 */
export function colorToRgb(color: Color): { r: number; g: number; b: number } {
  if (typeof color === 'string') {
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  if ('r' in color && 'g' in color && 'b' in color) {
    return color;
  }
  return { r: 0, g: 0, b: 0 }; // Default
}

