/**
 * Style-specific type definitions
 */

import { 
  Color, 
  HorizontalAlignment, 
  VerticalAlignment, 
  BorderStyle, 
  FontStyle 
} from './core.types';

/**
 * Font configuration interface
 */
export interface IFont {
  /** Font name */
  name?: string;
  /** Font size */
  size?: number;
  /** Font style */
  style?: FontStyle;
  /** Font color */
  color?: Color;
  /** Whether the font is bold */
  bold?: boolean;
  /** Whether the font is italic */
  italic?: boolean;
  /** Whether the font is underlined */
  underline?: boolean;
  /** Whether the font is strikethrough */
  strikethrough?: boolean;
  /** Font family */
  family?: string;
  /** Font scheme */
  scheme?: 'major' | 'minor' | 'none';
}

/**
 * Border configuration interface
 */
export interface IBorder {
  /** Border style */
  style?: BorderStyle;
  /** Border color */
  color?: Color;
  /** Border width */
  width?: number;
}

/**
 * Border sides interface
 */
export interface IBorderSides {
  /** Top border */
  top?: IBorder;
  /** Left border */
  left?: IBorder;
  /** Bottom border */
  bottom?: IBorder;
  /** Right border */
  right?: IBorder;
  /** Diagonal border */
  diagonal?: IBorder;
  /** Diagonal direction */
  diagonalDirection?: 'up' | 'down' | 'both';
}

/**
 * Fill pattern interface
 */
export interface IFill {
  /** Fill type */
  type: 'pattern' | 'gradient';
  /** Pattern type (for pattern fills) */
  pattern?: 'none' | 'solid' | 'darkGray' | 'mediumGray' | 'lightGray' | 'gray125' | 'gray0625' | 'darkHorizontal' | 'darkVertical' | 'darkDown' | 'darkUp' | 'darkGrid' | 'darkTrellis' | 'lightHorizontal' | 'lightVertical' | 'lightDown' | 'lightUp' | 'lightGrid' | 'lightTrellis';
  /** Background color */
  backgroundColor?: Color;
  /** Foreground color */
  foregroundColor?: Color;
  /** Gradient type (for gradient fills) */
  gradient?: 'linear' | 'path';
  /** Gradient stops */
  stops?: Array<{
    position: number;
    color: Color;
  }>;
  /** Gradient angle (for linear gradients) */
  angle?: number;
}

/**
 * Alignment configuration interface
 */
export interface IAlignment {
  /** Horizontal alignment */
  horizontal?: HorizontalAlignment;
  /** Vertical alignment */
  vertical?: VerticalAlignment;
  /** Text rotation (0-180 degrees) */
  textRotation?: number;
  /** Whether to wrap text */
  wrapText?: boolean;
  /** Whether to shrink text to fit */
  shrinkToFit?: boolean;
  /** Indent level */
  indent?: number;
  /** Whether to merge cells */
  mergeCell?: boolean;
  /** Reading order */
  readingOrder?: 'left-to-right' | 'right-to-left';
}

/**
 * Protection configuration interface
 */
export interface IProtection {
  /** Whether the cell is locked */
  locked?: boolean;
  /** Whether the cell is hidden */
  hidden?: boolean;
}

/**
 * Conditional formatting interface
 */
export interface IConditionalFormat {
  /** Condition type */
  type: 'cellIs' | 'containsText' | 'beginsWith' | 'endsWith' | 'containsBlanks' | 'notContainsBlanks' | 'containsErrors' | 'notContainsErrors' | 'timePeriod' | 'top' | 'bottom' | 'aboveAverage' | 'belowAverage' | 'duplicateValues' | 'uniqueValues' | 'expression' | 'colorScale' | 'dataBar' | 'iconSet';
  /** Condition operator */
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
  /** Condition values */
  values?: Array<string | number | Date>;
  /** Condition formula */
  formula?: string;
  /** Style to apply when condition is met */
  style?: IStyle;
  /** Priority of the condition */
  priority?: number;
  /** Whether to stop if true */
  stopIfTrue?: boolean;
}

/**
 * Main style interface
 */
export interface IStyle {
  /** Font configuration */
  font?: IFont;
  /** Border configuration */
  border?: IBorderSides;
  /** Fill configuration */
  fill?: IFill;
  /** Alignment configuration */
  alignment?: IAlignment;
  /** Protection configuration */
  protection?: IProtection;
  /** Conditional formatting */
  conditionalFormats?: IConditionalFormat[];
  /** Number format */
  numberFormat?: string;
  /** Whether to apply alternating row colors */
  striped?: boolean;
  /** Custom CSS-like properties */
  custom?: Record<string, unknown>;
}

/**
 * Style preset types
 */
export enum StylePreset {
  HEADER = 'header',
  SUBHEADER = 'subheader',
  DATA = 'data',
  FOOTER = 'footer',
  TOTAL = 'total',
  HIGHLIGHT = 'highlight',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  INFO = 'info'
}

/**
 * Style theme interface
 */
export interface IStyleTheme {
  /** Theme name */
  name: string;
  /** Theme description */
  description?: string;
  /** Color palette */
  colors: {
    primary: Color;
    secondary: Color;
    accent: Color;
    background: Color;
    text: Color;
    border: Color;
    success: Color;
    warning: Color;
    error: Color;
    info: Color;
  };
  /** Font family */
  fontFamily: string;
  /** Base font size */
  fontSize: number;
  /** Style presets */
  presets: Record<StylePreset, IStyle>;
}

/**
 * Style builder interface
 */
export interface IStyleBuilder {
  /** Set font name */
  fontName(name: string): IStyleBuilder;
  /** Set font size */
  fontSize(size: number): IStyleBuilder;
  /** Set font style */
  fontStyle(style: FontStyle): IStyleBuilder;
  /** Set font color */
  fontColor(color: Color): IStyleBuilder;
  /** Make font bold */
  fontBold(): IStyleBuilder;
  /** Make font italic */
  fontItalic(): IStyleBuilder;
  /** Make font underlined */
  fontUnderline(): IStyleBuilder;
  /** Set border */
  border(style: BorderStyle, color?: Color): IStyleBuilder;
  /** Set specific border */
  borderTop(style: BorderStyle, color?: Color): IStyleBuilder;
  borderLeft(style: BorderStyle, color?: Color): IStyleBuilder;
  borderBottom(style: BorderStyle, color?: Color): IStyleBuilder;
  borderRight(style: BorderStyle, color?: Color): IStyleBuilder;
  /** Set background color */
  backgroundColor(color: Color): IStyleBuilder;
  /** Set horizontal alignment */
  horizontalAlign(alignment: HorizontalAlignment): IStyleBuilder;
  /** Set vertical alignment */
  verticalAlign(alignment: VerticalAlignment): IStyleBuilder;
  /** Center align text */
  centerAlign(): IStyleBuilder;
  /** Left align text */
  leftAlign(): IStyleBuilder;
  /** Right align text */
  rightAlign(): IStyleBuilder;
  /** Wrap text */
  wrapText(): IStyleBuilder;
  /** Set number format */
  numberFormat(format: string): IStyleBuilder;
  /** Set striped rows */
  striped(): IStyleBuilder;
  /** Add conditional formatting */
  conditionalFormat(format: IConditionalFormat): IStyleBuilder;
  /** Build the final style */
  build(): IStyle;
}

