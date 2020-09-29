import { Glyph, GlyphProperties } from './glyph';

export interface TileProperties extends GlyphProperties {
  diggable?: boolean;
  walkable?: boolean;
  blocksLight?: boolean;
}

export class Tile extends Glyph {
  private _isDiggable: boolean;
  private _isWalkable: boolean;
  private _isBlockingLight: boolean;

  constructor(properties: TileProperties = {}) {
    super(properties);

    this._isDiggable = properties.diggable || false;
    this._isWalkable = properties.walkable || false;
    this._isBlockingLight =
      properties.blocksLight !== undefined ? properties.blocksLight : true;
  }

  isDiggable() {
    return this._isDiggable;
  }

  isWalkable() {
    return this._isWalkable;
  }

  isBlockingLight() {
    return this._isBlockingLight;
  }
}
