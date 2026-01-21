/**
 * Style-specific type definitions for PDF Builder
 */

import { Color } from '@hannndler/core';

/**
 * Font configuration interface
 */
export interface IFont {
  /** Font family name (e.g., 'Helvetica', 'Times-Roman') */
  family?: string;
  /** Font size in points */
  size?: number;
  /** Font style */
  style?: 'normal' | 'bold' | 'italic' | 'bolditalic';
  /** Font color */
  color?: Color;
}

/**
 * Border configuration interface
 */
export interface IBorder {
  /** Border width in points */
  width?: number;
  /** Border color */
  color?: Color;
  /** Border style */
  style?: 'solid' | 'dashed' | 'dotted';
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
}

/**
 * Fill configuration interface
 */
export interface IFill {
  /** Fill color */
  color?: Color;
  /** Fill opacity (0-1) */
  opacity?: number;
}

/**
 * Alignment configuration interface
 */
export interface IAlignment {
  /** Horizontal alignment */
  horizontal?: 'left' | 'center' | 'right' | 'justify';
  /** Vertical alignment */
  vertical?: 'top' | 'middle' | 'bottom';
}

/**
 * Main PDF style interface
 */
export interface IPDFStyle {
  /** Font configuration */
  font?: IFont;
  /** Border configuration */
  border?: IBorderSides;
  /** Fill configuration */
  fill?: IFill;
  /** Alignment configuration */
  alignment?: IAlignment;
  /** Line spacing (multiplier) */
  lineSpacing?: number;
  /** Character spacing */
  characterSpacing?: number;
  /** Word spacing */
  wordSpacing?: number;
}

/**
 * PDF theme configuration
 */
export interface IPDFTheme {
  /** Theme name */
  name?: string;
  /** Color scheme */
  colors?: {
    /** Primary color */
    primary?: Color;
    /** Secondary color */
    secondary?: Color;
    /** Background color */
    background?: Color;
    /** Text color */
    text?: Color;
    /** Border color */
    border?: Color;
    /** Header background color */
    headerBackground?: Color;
    /** Footer background color */
    footerBackground?: Color;
  };
  /** Font scheme */
  fonts?: {
    /** Default font family */
    default?: string;
    /** Header font family */
    header?: string;
    /** Body font family */
    body?: string;
    /** Footer font family */
    footer?: string;
  };
  /** Section styles - automatically applied to headers, footers, body */
  sectionStyles?: {
    /** Style for headers */
    header?: IPDFStyle;
    /** Style for body */
    body?: IPDFStyle;
    /** Style for footers */
    footer?: IPDFStyle;
  };
}

/**
 * Style preset types
 */
export enum StylePreset {
  HEADER = 'header',
  BODY = 'body',
  FOOTER = 'footer',
  TITLE = 'title',
  SUBTITLE = 'subtitle',
  CAPTION = 'caption',
  HIGHLIGHT = 'highlight'
}

