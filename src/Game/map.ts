import * as ROT from 'rot-js';
import { Game, MainGame } from './game';
import ECS from './ECS';
import { positionSystem, tileSystem } from './systems/besic';

const s = () => new ROT.Scheduler.Simple();
type Scheduler = ReturnType<typeof s>;

type Tile = ECS.Entity;
type Item = ECS.Entity;
type Being = ECS.Entity;

export class Map {
  private tiles: Tile[][][];
  private width: number;
  private height: number;
  private depth: number;
  private beings: { [key: string]: Being };
  private items: { [key: string]: Item[] };
  private engine: ROT.Engine;
  private scheduler: Scheduler;
  private explored: boolean[][][];

  constructor(tiles: Tile[][][], player: ECS.Entity) {
    this.tiles = tiles;

    // cache the width and height based
    // on the length of the dimensions of
    // the tiles array
    this.depth = tiles.length;
    this.width = tiles[0].length;
    this.height = tiles[0][0]?.length || 0;
    // create a list which will hold the entities
    this.beings = {};
    // Create a table which will hold the items
    this.items = {};
    // create the engine and scheduler
    this.scheduler = new ROT.Scheduler.Simple();
    this.engine = new ROT.Engine(this.scheduler);

    // add the player
    this.addBeingAtRandomPosition(player, 0);
    // Add random enemies to each floor.
    for (let z = 0; z < this.depth; z++) {
      // 15 entities per floor
      if (!Game.BeingRepository.isEmpty()) {
        for (let i = 0; i < 15; i++) {
          // Add a random being
          this.addBeingAtRandomPosition(
            Game.BeingRepository.createRandom()!,
            z
          );
        }
      }
      if (!Game.ItemRepository.isEmpty()) {
        // 10 items per floor
        for (let i = 0; i < 15; i++) {
          // Add a random being
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

  getBeings() {
    return this.beings;
  }

  getBeingAt(x: number, y: number, z: number): Being | null {
    // Get the being based on position key
    return this.beings[x + ',' + y + ',' + z] || null;
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
    const being = this.getBeingAt(x, y, z);
    const items = this.getItemsAt(x, y, z);
    return { tile, being, items };
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
    const tile = this.getTile(x, y, z);
    // If the tile is diggable, update it to a floor
    const { diggable } = tile.getComponent(tileSystem)!;
    if (diggable) {
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

  addBeing(being: Being) {
    // Update the map with the being's position
    this.updateBeingPosition(being);
  }

  addBeingAtRandomPosition(being: Being, z: number) {
    const { x, y } = this.getRandomFloorPosition(z);
    being.updateComponent(positionSystem, { x, y, z });
    this.addBeing(being);
  }

  removeBeing(being: Being) {
    const { x, y, z } = being.getComponent(positionSystem)!;
    // Remove the being from the map
    const key = x + ',' + y + ',' + z;
    if (this.beings[key] === being) {
      delete this.beings[key];
    }
    ECS.MainWorld.destroyEntity(being);
  }

  isEmptyFloor(x: number, y: number, z: number) {
    // Check if the tile is floor and also has no being
    return (
      this.getTile(x, y, z) === Game.Tiles.floor && !this.getBeingAt(x, y, z)
    );
  }

  getEntitiesWithinRadius(
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number
  ) {
    const results = [] as Being[];
    // Determine our bounds
    const leftX = centerX - radius;
    const rightX = centerX + radius;
    const topY = centerY - radius;
    const bottomY = centerY + radius;
    // Iterate through our beings, adding any which are within the bounds
    for (const key in this.beings) {
      const being = this.beings[key];
      const { x, y, z } = being.getComponent(positionSystem)!;
      if (
        x >= leftX &&
        x <= rightX &&
        y >= topY &&
        y <= bottomY &&
        z === centerZ
      ) {
        results.push(being);
      }
    }
    return results;
  }

  updateBeingPosition(
    being: Being,
    oldX?: number,
    oldY?: number,
    oldZ?: number
  ) {
    // Delete the old key if it is the same being and we have old positions.
    if (typeof oldX !== 'undefined') {
      const oldKey = oldX + ',' + oldY + ',' + oldZ;
      if (this.beings[oldKey] === being) {
        delete this.beings[oldKey];
      }
    }
    const { x, y, z } = being.getComponent(positionSystem)!;
    // Make sure the being's position is within bounds
    if (
      x < 0 ||
      x >= this.width ||
      y < 0 ||
      y >= this.height ||
      z < 0 ||
      z >= this.depth
    ) {
      throw new Error("being's position is out of bounds.");
    }
    // Sanity check to make sure there is no being at the new position.
    const key = x + ',' + y + ',' + z;
    if (this.beings[key]) {
      throw new Error('Tried to add an being at an occupied position.');
    }
    // Add the being to the table of beings
    this.beings[key] = being;
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
