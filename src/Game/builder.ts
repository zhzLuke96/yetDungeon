import * as ROT from 'rot-js';
import { Game } from './game';
import { shuffle } from './utils';
import { Tile } from './tile';

export class Builder {
  private width: number;
  private height: number;
  private depth: number;
  private tiles: Tile[][][];
  private regions: number[][][];

  constructor(width: number, height: number, depth: number) {
    this.height = height;
    this.width = width;
    this.depth = depth;
    this.tiles = new Array(depth);
    this.regions = new Array(depth);

    // Instantiate the arrays to be multi-dimension
    for (let z = 0; z < depth; z++) {
      // Create a new cave at each level
      this.tiles[z] = this.generateLevel();
      // Setup the regions array for each depth
      this.regions[z] = new Array(width);
      for (let x = 0; x < width; x++) {
        this.regions[z][x] = new Array(height);
        // Fill with zeroes
        for (let y = 0; y < height; y++) {
          this.regions[z][x][y] = 0;
        }
      }
    }

    for (let z = 0; z < this.depth; z++) {
      this.setupRegions(z);
    }
    this.connectAllRegions();
  }

  getTiles() {
    return this.tiles;
  }

  getDepth() {
    return this.depth;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  private generateLevel() {
    // Create the empty map
    const map = new Array<Tile[]>(this.width);
    for (let w = 0; w < this.width; w++) {
      map[w] = new Array(this.height);
    }
    // Setup the cave generator
    const generator = new ROT.Map.Cellular(this.width, this.height);
    generator.randomize(0.5);
    const totalIterations = 3;
    // Iteratively smoothen the map
    for (let i = 0; i < totalIterations - 1; i++) {
      generator.create();
    }
    // Smoothen it one last time and then update our map
    generator.create(function (x, y, v) {
      if (v === 1) {
        map[x][y] = Game.Tiles.floor;
      } else {
        map[x][y] = Game.Tiles.wall;
      }
    });
    return map;
  }

  private canFillRegion(x: number, y: number, z: number) {
    // Make sure the tile is within bounds
    if (
      x < 0 ||
      y < 0 ||
      z < 0 ||
      x >= this.width ||
      y >= this.height ||
      z >= this.depth
    ) {
      return false;
    }
    // Make sure the tile does not already have a region
    if (this.regions[z][x][y] !== 0) {
      return false;
    }
    // Make sure the tile is walkable
    return this.tiles[z][x][y].isWalkable();
  }

  private fillRegion(region: number, x: number, y: number, z: number) {
    let tilesFilled = 1;
    const tiles = [{ x, y }];
    let tile: { x: number; y: number };
    let neighbors: { x: number; y: number }[];
    // Update the region of the original tile
    this.regions[z][x][y] = region;
    // Keep looping while we still have tiles to process
    while (tiles.length > 0) {
      tile = tiles.pop()!;
      // Get the neighbors of the tile
      neighbors = Game.getNeighborPositions(tile.x, tile.y);
      // Iterate through each neighbor, checking if we can use it to fill
      // and if so updating the region and adding it to our processing
      // list.
      while (neighbors.length > 0) {
        tile = neighbors.pop()!;
        if (this.canFillRegion(tile.x, tile.y, z)) {
          this.regions[z][tile.x][tile.y] = region;
          tiles.push(tile);
          tilesFilled++;
        }
      }
    }
    return tilesFilled;
  }

  // This removes all tiles at a given depth level with a region number.
  // It fills the tiles with a wall tile.
  private removeRegion(region: number, z: number) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.regions[z][x][y] === region) {
          // Clear the region and set the tile to a wall tile
          this.regions[z][x][y] = 0;
          this.tiles[z][x][y] = Game.Tiles.wall;
        }
      }
    }
  }

  // This sets up the regions for a given depth level.
  private setupRegions(z: number) {
    let region = 1;
    let tilesFilled: number;
    // Iterate through all tiles searching for a tile that
    // can be used as the starting point for a flood fill
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.canFillRegion(x, y, z)) {
          // Try to fill
          tilesFilled = this.fillRegion(region, x, y, z);
          // If it was too small, simply remove it
          if (tilesFilled <= 20) {
            this.removeRegion(region, z);
          } else {
            region++;
          }
        }
      }
    }
  }

  // This fetches a list of points that overlap between one
  // region at a given depth level and a region at a level beneath it.
  private findRegionOverlaps(z: number, r1: number, r2: number) {
    const matches = [] as { x: number; y: number }[];
    // Iterate through all tiles, checking if they respect
    // the region constraints and are floor tiles. We check
    // that they are floor to make sure we don't try to
    // put two stairs on the same tile.
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (
          this.tiles[z][x][y] === Game.Tiles.floor &&
          this.tiles[z + 1][x][y] === Game.Tiles.floor &&
          this.regions[z][x][y] === r1 &&
          this.regions[z + 1][x][y] === r2
        ) {
          matches.push({ x, y });
        }
      }
    }
    // We shuffle the list of matches to prevent bias
    return shuffle(matches);
  }

  // This tries to connect two regions by calculating
  // where they overlap and adding stairs
  private connectRegions(z: number, r1: number, r2: number) {
    const overlap = this.findRegionOverlaps(z, r1, r2);
    // Make sure there was overlap
    if (overlap.length === 0) {
      return false;
    }
    // Select the first tile from the overlap and change it to stairs
    const point = overlap[0];
    this.tiles[z][point.x][point.y] = Game.Tiles.stairsDown;
    this.tiles[z + 1][point.x][point.y] = Game.Tiles.stairsUp;
    return true;
  }

  // This tries to connect all regions for each depth level,
  // starting from the top most depth level.
  private connectAllRegions() {
    for (let z = 0; z < this.depth - 1; z++) {
      // Iterate through each tile, and if we haven't tried
      // to connect the region of that tile on both depth levels
      // then we try. We store connected properties as strings
      // for quick lookups.
      const connected = {} as { [key: string]: boolean };
      let key;
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          key = this.regions[z][x][y] + ',' + this.regions[z + 1][x][y];
          if (
            this.tiles[z][x][y] === Game.Tiles.floor &&
            this.tiles[z + 1][x][y] === Game.Tiles.floor &&
            !connected[key]
          ) {
            // Since both tiles are floors and we haven't
            // already connected the two regions, try now.
            this.connectRegions(
              z,
              this.regions[z][x][y],
              this.regions[z + 1][x][y]
            );
            connected[key] = true;
          }
        }
      }
    }
  }
}
