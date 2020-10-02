import { Glyph, GlyphProperties } from './glyph';
import { MainSoundEngine } from './soundEngine';

interface SoundsInfo {
  name: string; // speaker name
  type: string; // mount event name
  audios: string[]; // audio paths
}

export interface TileProperties extends GlyphProperties {
  diggable?: boolean;
  walkable?: boolean;
  blocksLight?: boolean;

  sounds?: SoundsInfo[];
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

    this.setupSoundEvents(properties.sounds);
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

  setupSoundEvents(sounds?: SoundsInfo[]) {
    if (!sounds) {
      return;
    }
    sounds.forEach(({ name, type, audios }) => {
      MainSoundEngine.listenRandomOn(this, type, { name, audios });
    });
  }
}
