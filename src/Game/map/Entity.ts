import { Game } from '../Game';
import { isAttacker, isDestructible, isPlayerActor } from './entities';
import { Glyph, GlyphProperties } from './glyph';
import { Map } from './Map';

export interface EntityProperties extends GlyphProperties {
  name?: string;
  x?: number;
  y?: number;
  z?: number;

  [key: string]: any;
}

export class Entity extends Glyph {
  private name: string;
  private map: Map | null;
  x: number;
  y: number;
  z: number;
  attachedMixins: { [key: string]: boolean };
  attachedMixinGroups: { [key: string]: boolean };

  constructor(properties: EntityProperties) {
    super(properties);

    this.name = properties.name || '';
    this.x = properties.x || 0;
    this.y = properties.y || 0;
    this.z = properties.z || 0;
    this.map = null;

    // Create an object which will keep track what mixins we have
    // attached to this entity based on the name property
    this.attachedMixins = {};
    this.attachedMixinGroups = {};
  }

  setMap(map: Map) {
    this.map = map;
  }

  getMap() {
    return this.map;
  }

  hasMixin(mixinName: string) {
    return (
      this.attachedMixins[mixinName] || this.attachedMixinGroups[mixinName]
    );
  }

  setName(name: string) {
    this.name = name;
  }

  setPosition(x: number, y: number, z: number) {
    const [oldX, oldY, oldZ] = [this.x, this.y, this.z];
    // Update position
    [this.x, this.y, this.z] = [x, y, z];
    // If the entity is on a map, notify the map that the entity has moved.
    if (this.map) {
      this.map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
  }

  setX(x: number) {
    this.x = x;
  }

  setY(y: number) {
    this.y = y;
  }

  setZ(z: number) {
    this.z = z;
  }

  getName() {
    return this.name;
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  getZ() {
    return this.z;
  }

  tryMove(x: number, y: number, z: number, map?: Map) {
    map = map || this.getMap()!;
    // Must use starting z
    const tile = map.getTile(x, y, this.getZ());
    const target = map.getEntityAt(x, y, this.getZ());
    // If our z level changed, check if we are on stair
    if (z < this.getZ()) {
      if (tile !== Game.Tiles.stairsUp) {
        Game.sendMessage(this, () => "You can't go up here!");
      } else {
        Game.sendMessage(this, (z) => `You ascend to level ${z}!`, [z + 1]);
        this.setPosition(x, y, z);
      }
      return false;
    }
    if (z > this.getZ()) {
      if (tile !== Game.Tiles.stairsDown) {
        Game.sendMessage(this, () => "You can't go down here!");
      } else {
        this.setPosition(x, y, z);
        Game.sendMessage(this, (z) => `You descend to level ${z}!`, [z + 1]);
      }
      return false;
    }
    // If an entity was present at the tile
    if (target) {
      // An entity can only attack if the entity has the Attacker mixin and
      // either the entity or the target is the player.
      if (
        isAttacker(this) &&
        isDestructible(target) &&
        (isPlayerActor(this) || isPlayerActor(target))
      ) {
        this.attack(target);
        return true;
      }
      // If not nothing we can do, but we can't
      // move to the tile
      return false;
      // Check if we can walk on the tile
      // and if so simply walk onto it
    } else if (tile.isWalkable()) {
      // Update the entity's position
      this.setPosition(x, y, z);
      return true;
      // Check if the tile is diggable, and
      // if so try to dig it
    } else if (tile.isDiggable()) {
      // Only dig if the the entity is the player
      if (isPlayerActor(this)) {
        map.dig(x, y, z);
        return true;
      }
      // If not nothing we can do, but we can't
      // move to the tile
      return false;
    }
    return false;
  }
}
