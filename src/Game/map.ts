import { Tile } from './tile';
import * as ROT from 'rot-js';
import { Entity } from './entity';
import { createBat, createFungus, createNewt, Player } from './entities';
import { Game, MainGame } from './game';
import { Item } from './Item';

const s = () => new ROT.Scheduler.Simple();
type Scheduler = ReturnType<typeof s>;

export class Map {
  private tiles: Tile[][][];
  private width: number;
  private height: number;
  private depth: number;
  private entities: { [key: string]: Entity };
  private items: { [key: string]: Item[] };
  private engine: ROT.Engine;
  private scheduler: Scheduler;
  private explored: boolean[][][];

  constructor(tiles: Tile[][][], player: Player) {
    this.tiles = tiles;

    // cache the width and height based
    // on the length of the dimensions of
    // the tiles array
    this.depth = tiles.length;
    this.width = tiles[0].length;
    this.height = tiles[0][0]?.length || 0;
    // create a list which will hold the entities
    this.entities = {};
    // Create a table which will hold the items
    this.items = {};
    // create the engine and scheduler
    this.scheduler = new ROT.Scheduler.Simple();
    this.engine = new ROT.Engine(this.scheduler);

    // add the player
    this.addEntityAtRandomPosition(player, 0);
    // Add random enemies to each floor.
    for (let z = 0; z < this.depth; z++) {
      // 15 entities per floor
      if (!Game.EntityRepository.isEmpty()) {
        for (let i = 0; i < 15; i++) {
          // Add a random entity
          this.addEntityAtRandomPosition(
            Game.EntityRepository.createRandom()!,
            z
          );
        }
      }
      if (!Game.ItemRepository.isEmpty()) {
        // 10 items per floor
        for (let i = 0; i < 15; i++) {
          // Add a random entity
          this.addItemAtRandomPosition(Game.ItemRepository.createRandom()!, z);
        }
      }
    }

    // Setup the explored array
    this.explored = new Array(this.depth);
    this.setupExploredArray();
  }

  getEngine() {
    return this.engine;
  }

  getEntities() {
    return this.entities;
  }

  getEntityAt(x: number, y: number, z: number): Entity | null {
    // Get the entity based on position key
    return this.entities[x + ',' + y + ',' + z] || null;
  }

  getItemsAt(x: number, y: number, z: number) {
    return this.items[x + ',' + y + ',' + z] || [];
  }

  setItemsAt(x: number, y: number, z: number, items: Item[]) {
    // If our items array is empty, then delete the key from the table.
    const key = x + ',' + y + ',' + z;
    if (items.length === 0) {
      if (this.items[key]) {
        delete this.items[key];
      }
      return;
    }
    // Simply update the items at that key
    this.items[key] = items;
  }

  addItem(x: number, y: number, z: number, item: Item) {
    // If we already have items at that position, simply append the item to the
    // list of items.
    const key = x + ',' + y + ',' + z;
    if (this.items[key]) {
      this.items[key].push(item);
    } else {
      this.items[key] = [item];
    }
  }

  addItemAtRandomPosition(item: Item, z: number) {
    const position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
  }

  getAt(x: number, y: number, z: number) {
    const tile = this.getTile(x, y, z);
    const entity = this.getEntityAt(x, y, z);
    const items = this.getItemsAt(x, y, z);
    return { tile, entity, items };
  }

  // Standard getters
  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getDepth() {
    return this.depth;
  }

  // Gets the tile for a given coordinate set
  getTile(x: number, y: number, z: number) {
    // Make sure we are inside the bounds. If we aren't, return
    // null tile.
    if (
      x < 0 ||
      x >= this.width ||
      y < 0 ||
      y >= this.height ||
      z < 0 ||
      z >= this.depth
    ) {
      return Game.Tiles.null;
    } else {
      return this.tiles[z][x][y] || Game.Tiles.null;
    }
  }

  dig(x: number, y: number, z: number) {
    // If the tile is diggable, update it to a floor
    if (this.getTile(x, y, z).isDiggable()) {
      this.tiles[z][x][y] = Game.Tiles.floor;
    }
  }

  getRandomFloorPosition(z: number) {
    let depth = 0;
    // Randomly generate a tile which is a floor
    let x, y;
    do {
      if (depth >= 1024) {
        throw Error('Cant get random floor position.');
      }
      depth++;
      x = Math.floor(Math.random() * this.width);
      y = Math.floor(Math.random() * this.height);
    } while (!this.isEmptyFloor(x, y, z));
    return { x, y, z };
  }

  addEntity(entity: Entity) {
    // Update the entity's map
    entity.setMap(this);
    // Update the map with the entity's position
    this.updateEntityPosition(entity);
    // Check if this entity is an actor, and if so add
    // them to the scheduler
    if (entity.hasMixin('Actor')) {
      this.scheduler.add(entity, true);
    }
  }

  addEntityAtRandomPosition(entity: Entity, z: number) {
    const { x, y } = this.getRandomFloorPosition(z);
    entity.setPosition(x, y, z);
    this.addEntity(entity);
  }

  removeEntity(entity: Entity) {
    // Remove the entity from the map
    const key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this.entities[key] === entity) {
      delete this.entities[key];
    }
    // If the entity is an actor, remove them from the scheduler
    if (entity.hasMixin('Actor')) {
      this.scheduler.remove(entity);
    }
  }

  isEmptyFloor(x: number, y: number, z: number) {
    // Check if the tile is floor and also has no entity
    return (
      this.getTile(x, y, z) === Game.Tiles.floor && !this.getEntityAt(x, y, z)
    );
  }

  getEntitiesWithinRadius(
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number
  ) {
    const results = [] as Entity[];
    // Determine our bounds
    const leftX = centerX - radius;
    const rightX = centerX + radius;
    const topY = centerY - radius;
    const bottomY = centerY + radius;
    // Iterate through our entities, adding any which are within the bounds
    for (const key in this.entities) {
      const entity = this.entities[key];
      if (
        entity.getX() >= leftX &&
        entity.getX() <= rightX &&
        entity.getY() >= topY &&
        entity.getY() <= bottomY &&
        entity.getZ() === centerZ
      ) {
        results.push(entity);
      }
    }
    return results;
  }

  updateEntityPosition(
    entity: Entity,
    oldX?: number,
    oldY?: number,
    oldZ?: number
  ) {
    // Delete the old key if it is the same entity and we have old positions.
    if (typeof oldX !== 'undefined') {
      const oldKey = oldX + ',' + oldY + ',' + oldZ;
      if (this.entities[oldKey] === entity) {
        delete this.entities[oldKey];
      }
    }
    // Make sure the entity's position is within bounds
    if (
      entity.getX() < 0 ||
      entity.getX() >= this.width ||
      entity.getY() < 0 ||
      entity.getY() >= this.height ||
      entity.getZ() < 0 ||
      entity.getZ() >= this.depth
    ) {
      throw new Error("Entity's position is out of bounds.");
    }
    // Sanity check to make sure there is no entity at the new position.
    const key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this.entities[key]) {
      throw new Error('Tried to add an entity at an occupied position.');
    }
    // Add the entity to the table of entities
    this.entities[key] = entity;
  }

  private setupExploredArray() {
    for (let z = 0; z < this.depth; z++) {
      this.explored[z] = new Array(this.width);
      for (let x = 0; x < this.width; x++) {
        this.explored[z][x] = new Array(this.height);
        for (let y = 0; y < this.height; y++) {
          this.explored[z][x][y] = false;
        }
      }
    }
  }

  setExplored(x: number, y: number, z: number, state: boolean) {
    // Only update if the tile is within bounds
    if (this.getTile(x, y, z) !== Game.Tiles.null) {
      this.explored[z][x][y] = state;
    }
  }

  isExplored(x: number, y: number, z: number) {
    // Only return the value if within bounds
    if (this.getTile(x, y, z) !== Game.Tiles.null) {
      return this.explored[z][x][y];
    }
    return false;
  }
}
