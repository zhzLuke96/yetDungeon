import * as ROT from 'rot-js';
import { Game, MainGame } from '../Game';
import { createPlayer, Player } from '../map/entities';
import { Entity } from '../map/Entity';
import { Map } from '../map/Map';
import { Tile } from '../map/Tile';
import { Screen } from './Screen';
import { Builder } from '../map/Builder';
import { Glyph } from '../map/glyph';
import { GlobalUIEvents } from '../../components/GlobalUIEvents';

const PlayScreenConfig = {
  mapWidth: 100,
  mapHeight: 64,
  mapDepth: 6,
};

export class PlayScreen implements Screen {
  private map = null as null | Map;
  private player = null as null | Player;
  private gameOver = false;

  enter() {
    const { mapWidth, mapHeight, mapDepth } = PlayScreenConfig;

    // Create our map from the tiles and player
    const tiles = new Builder(mapWidth, mapHeight, mapDepth).getTiles();
    this.player = createPlayer();
    this.map = new Map(tiles, this.player);
    // this.map = new Game.Map(map, this.player);
    // Start the map's engine
    this.map.getEngine().start();

    // bind mouse events
    MainGame.addEventListener('MouseOverTilePosition', ([x, y]: number[]) => {
      if (!this.player || !this.map) {
        return;
      }
      const currentDepth = this.player.getZ();
      const [tlx, tly] = this.getTopLeftPosition();
      const tile = this.map.getTile(tlx + x, tly + y, currentDepth);
      const entity = this.map.getEntityAt(tlx + x, tly + y, currentDepth);
      GlobalUIEvents.mouseOverOnTile(
        tile === Game.Tiles.null ? null : tile,
        entity || null
      );
    });
  }

  exit() {
    console.log('Exited paly screen.');
  }

  getTopLeftPosition(
    game: Game = MainGame,
    screenWidth: number = game.getScreenWidth(),
    screenHeight: number = game.getScreenHeight()
  ) {
    if (!this.player) {
      throw Error('Player is not initialized.');
    }
    if (!this.map) {
      throw Error('Map is not initialized.');
    }
    // Make sure the x-axis doesn't go to the left of the left bound
    let topLeftX = Math.max(0, this.player.getX() - screenWidth / 2);
    // Make sure we still have enough space to fit an entire game screen
    topLeftX = Math.min(topLeftX, this.map.getWidth() - screenWidth);
    // Make sure the y-axis doesn't above the top bound
    let topLeftY = Math.max(0, this.player.getY() - screenHeight / 2);
    // Make sure we still have enough space to fit an entire game screen
    topLeftY = Math.min(topLeftY, this.map.getHeight() - screenHeight);
    return [topLeftX, topLeftY];
  }

  render(display: ROT.Display, game: Game = MainGame) {
    if (!this.player) {
      throw Error('Player is not initialized.');
    }
    if (!this.map) {
      throw Error('Map is not initialized.');
    }
    const screenWidth = game.getScreenWidth();
    const screenHeight = game.getScreenHeight();
    const [topLeftX, topLeftY] = this.getTopLeftPosition(
      game,
      screenWidth,
      screenHeight
    );

    // Store this._map and player's z to prevent losing it in callbacks
    const map = this.map;
    const currentDepth = this.player.getZ();

    // This object will keep track of all visible map cells
    const visibleCells = map.computeLights(
      this.player.getX(),
      this.player.getY(),
      currentDepth,
      (x, y) => {
        // Mark cell as explored
        map.setExplored(x, y, currentDepth, true);
      }
    );

    // Iterate through all visible map cells
    for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
      for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
        const lightLevel = visibleCells[x + ',' + y];
        if (lightLevel > 0) {
          // Fetch the glyph for the tile and render it to the screen
          // at the offset position.
          const tile = this.map.getTile(x, y, this.player.getZ());
          display.draw(
            x - topLeftX,
            y - topLeftY,
            tile.getChar(),
            Game.lightedColorHex(tile.getForeground(), lightLevel),
            tile.getBackground()
          );
        }
      }
    }
    // Render the explored map cells
    for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
      for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
        if (map.isExplored(x, y, currentDepth)) {
          // Fetch the glyph for the tile and render it to the screen
          // at the offset position.
          let glyph: Glyph = this.map.getTile(x, y, currentDepth);
          let foreground = glyph.getForeground();
          // If we are at a cell that is in the field of vision, we need
          // to check if there are items or entities.
          const lightLevel = visibleCells[x + ',' + y];
          if (lightLevel > 0) {
            // Check for items first, since we want to draw entities
            // over items.
            const items = map.getItemsAt(x, y, currentDepth);
            // If we have items, we want to render the top most item
            if (items) {
              glyph = items[items.length - 1];
            }
            // Check if we have an entity at the position
            if (map.getEntityAt(x, y, currentDepth)) {
              glyph = map.getEntityAt(x, y, currentDepth);
            }
            // Update the foreground color in case our glyph changed
            foreground = glyph.getForeground();
            foreground = Game.lightedColorHex(foreground, lightLevel);
          } else {
            // Since the tile was previously explored but is not
            // visible, we want to change the foreground color to
            // dark gray.
            // foreground = 'darkGray';
            foreground = Game.lightedColorHex(foreground, 0.1);
          }
          display.draw(
            x - topLeftX,
            y - topLeftY,
            glyph.getChar(),
            foreground,
            glyph.getBackground()
          );
        }
      }
    }

    // Render the entities
    const entities = this.map.getEntities();
    for (const key in entities) {
      const entity = entities[key];
      // Only render the entitiy if they would show up on the screen
      if (
        entity.getX() >= topLeftX &&
        entity.getY() >= topLeftY &&
        entity.getX() < topLeftX + screenWidth &&
        entity.getY() < topLeftY + screenHeight &&
        entity.getZ() === this.player.getZ()
      ) {
        const lightLevel = visibleCells[entity.getX() + ',' + entity.getY()];
        if (lightLevel > 0) {
          display.draw(
            entity.getX() - topLeftX,
            entity.getY() - topLeftY,
            entity.getChar(),
            Game.lightedColorHex(entity.getForeground(), lightLevel),
            entity.getBackground()
          );
        }
      }
    }

    // Get the messages in the player's queue and render them
    const messages = this.player.getMessages();
    let messageY = 0;
    for (let i = 0; i < messages.length; i++) {
      // Draw each message, adding the number of lines
      messageY += display.drawText(
        0,
        messageY,
        '%c{white}%b{black}' + messages[i]
      );
    }

    // Render player HP
    const stats = `%c{white}%b{black}HP: ${this.player.getHp()}/${this.player.getMaxHp()}`;
    display.drawText(0, screenHeight, stats);
  }

  handleInput(inputType: string, inputData: KeyboardEvent, game: Game) {
    const unlock = () => this.map?.getEngine().unlock();
    if (!this.map) {
      throw Error('Map is not initialized.');
    }
    // If the game is over, enter will bring the user to the losing screen.
    if (this.gameOver) {
      if (inputType === 'keydown' && inputData.keyCode === ROT.KEYS.VK_RETURN) {
        MainGame.dispatchEvent('goto_lose_screen');
      }
      // Return to make sure the user can't still play
      return;
    }

    if (inputType === 'keypress') {
      const keyChar = String.fromCharCode(inputData.charCode);
      if (keyChar === '>') {
        this.move(0, 0, 1);
        return unlock();
      } else if (keyChar === '<') {
        this.move(0, 0, -1);
        return unlock();
      }
    }
    if (inputType === 'keydown') {
      switch (inputData.code) {
        // If enter is pressed, go to the win screen
        case 'Enter': {
          game.dispatchEvent('goto_win_screen');
          break;
        }
        // If escape is pressed, go to lose screen
        case 'Escape': {
          game.dispatchEvent('goto_lose_screen');
          break;
        }
        // Movement
        case 'Numpad4':
        case 'ArrowLeft': {
          this.move(-1, 0);
          break;
        }
        case 'Numpad6':
        case 'ArrowRight': {
          this.move(1, 0);
          break;
        }
        case 'Numpad8':
        case 'ArrowUp': {
          this.move(0, -1);
          break;
        }
        case 'Numpad2':
        case 'ArrowDown': {
          this.move(0, 1);
          break;
        }
        case 'Numpad1': {
          this.move(-1, 1);
          break;
        }
        case 'Numpad3': {
          this.move(1, 1);
          break;
        }
        case 'Numpad7': {
          this.move(-1, -1);
          break;
        }
        case 'Numpad9': {
          this.move(1, -1);
          break;
        }
        case 'Numpad5': {
          // waiting
          break;
        }
        default: {
          return;
        }
      }
      // Unlock the engine
      unlock();
    }
  }

  move(dX: number, dY: number, dZ = 0) {
    if (!this.player) {
      throw Error('Player is not initialized.');
    }
    if (!this.map) {
      throw Error('Map is not initialized.');
    }
    const newX = this.player.getX() + dX;
    const newY = this.player.getY() + dY;
    const newZ = this.player.getZ() + dZ;
    // Try to move to the new cell
    this.player.tryMove(newX, newY, newZ, this.map);
  }

  setGameOver(gameOver: boolean) {
    this.gameOver = gameOver;
  }
}
