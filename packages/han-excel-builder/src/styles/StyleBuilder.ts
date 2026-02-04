/**
 * StyleBuilder - Fluent API for creating Excel styles
 */

import {
  IStyle,
  IBorder,
  IConditionalFormat,
  IStyleBuilder as IStyleBuilderInterface
} from '../types/style.types';
import { 
  Color, 
  HorizontalAlignment,
  VerticalAlignment,
  BorderStyle, 
  FontStyle 
} from '../types/core.types';

/**
 * StyleBuilder class providing a fluent API for creating Excel styles
 */
export class StyleBuilder implements IStyleBuilderInterface {
  private style: Partial<IStyle> = {};

  constructor() {
    this.style.alignment = {
      horizontal: HorizontalAlignment.CENTER,
      vertical: VerticalAlignment.MIDDLE,
      wrapText: true,
      shrinkToFit: true
    };
  }

  static create(): StyleBuilder {
    return new StyleBuilder();
  }

  fontName(name: string): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.name = name;
    return this;
  }

  fontSize(size: number): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.size = size;
    return this;
  }

  fontStyle(style: FontStyle): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.style = style;
    return this;
  }

  fontColor(color: Color): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.color = color;
    return this;
  }

  fontBold(): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.bold = true;
    return this;
  }

  fontItalic(): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.italic = true;
    return this;
  }

  fontUnderline(): StyleBuilder {
    if (!this.style.font) {
      this.style.font = {};
    }
    this.style.font.underline = true;
    return this;
  }

  border(style: BorderStyle, color?: Color): StyleBuilder {
    if (!this.style.border) {
      this.style.border = {};
    }
    const border: IBorder = { style };
    if (color) border.color = color;
    this.style.border.top = border;
    this.style.border.bottom = border;
    this.style.border.left = border;
    this.style.border.right = border;
    return this;
  }

  borderTop(style: BorderStyle, color?: Color): StyleBuilder {
    if (!this.style.border) {
      this.style.border = {};
    }
    this.style.border.top = { style, color };
    return this;
  }

  borderLeft(style: BorderStyle, color?: Color): StyleBuilder {
    if (!this.style.border) {
      this.style.border = {};
    }
    this.style.border.left = { style, color };
    return this;
  }

  borderBottom(style: BorderStyle, color?: Color): StyleBuilder {
    if (!this.style.border) {
      this.style.border = {};
    }
    this.style.border.bottom = { style, color };
    return this;
  }

  borderRight(style: BorderStyle, color?: Color): StyleBuilder {
    if (!this.style.border) {
      this.style.border = {};
    }
    this.style.border.right = { style, color };
    return this;
  }

  backgroundColor(color: Color): StyleBuilder {
    if (!this.style.fill) {
      this.style.fill = { type: 'pattern' };
    }
    this.style.fill.backgroundColor = color;
    this.style.fill.pattern = 'solid';
    return this;
  }

  horizontalAlign(alignment: HorizontalAlignment): StyleBuilder {
    if (!this.style.alignment) {
      this.style.alignment = {};
    }
    this.style.alignment.horizontal = alignment;
    return this;
  }

  verticalAlign(alignment: VerticalAlignment): StyleBuilder {
    if (!this.style.alignment) {
      this.style.alignment = {};
    }
    this.style.alignment.vertical = alignment;
    return this;
  }

  centerAlign(): StyleBuilder {
    return this.horizontalAlign(HorizontalAlignment.CENTER);
  }

  leftAlign(): StyleBuilder {
    return this.horizontalAlign(HorizontalAlignment.LEFT);
  }

  rightAlign(): StyleBuilder {
    return this.horizontalAlign(HorizontalAlignment.RIGHT);
  }

  wrapText(): StyleBuilder {
    if (!this.style.alignment) {
      this.style.alignment = {};
    }
    this.style.alignment.wrapText = true;
    return this;
  }

  /** Enable or disable shrink-to-fit */
  shrinkToFit(enabled: boolean = true): StyleBuilder {
    if (!this.style.alignment) {
      this.style.alignment = {};
    }
    this.style.alignment.shrinkToFit = Boolean(enabled);
    return this;
  }

  numberFormat(format: string): StyleBuilder {
    this.style.numberFormat = format;
    return this;
  }

  striped(): StyleBuilder {
    this.style.striped = true;
    return this;
  }

  conditionalFormat(format: IConditionalFormat): StyleBuilder {
    if (!this.style.conditionalFormats) {
      this.style.conditionalFormats = [];
    }
    this.style.conditionalFormats.push(format);
    return this;
  }

  build(): IStyle {
    return this.style as IStyle;
  }
}

