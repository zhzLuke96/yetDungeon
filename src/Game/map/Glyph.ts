export interface GlyphProperties {
  character?: string;
  foreground?: string;
  background?: string;
  [key: string]: any;
}

export class Glyph {
  private char: string;
  private foreground: string;
  private background: string;
  properties: GlyphProperties;

  constructor(properties: GlyphProperties) {
    const {
      character = ' ',
      foreground = 'white',
      background = 'black',
    } = properties;
    this.char = character;
    this.foreground = foreground;
    this.background = background;
    this.properties = properties;
  }

  getChar() {
    return this.char;
  }

  getForeground() {
    return this.foreground;
  }

  getBackground() {
    return this.background;
  }
}
