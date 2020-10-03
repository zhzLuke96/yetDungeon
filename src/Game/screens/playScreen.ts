import * as ROT from 'rot-js';
import { Game, MainGame } from '../game';
import { createPlayer } from '../beings';
import { Map } from '../map';
import { Screen } from './screen';
import { Builder } from '../builder';
import { Glyph } from '../glyph';
import { MainSoundEngine } from '../soundEngine';
import ECS from '../ECS';
import { positionSystem } from '../systems/besic';
import { sightSystem } from '../systems/being';
import { tryMove } from '../systems/utils';
import { renderSystem } from '../systems/render';

const PlayScreenConfig = {
  mapWidth: 100,
  mapHeight: 64,
  mapDepth: 3,
};

export class PlayScreen implements Screen {
  private map = null as null | Map;
  private player = null as null | ECS.Entity;
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

    // MainSoundEngine.setPlayer(this.player);

    // init World context
    ECS.MainWorld.setVal('map', this.map);
    ECS.MainWorld.setVal('player', this.player);
    ECS.MainWorld.addSingletonSystem(renderSystem);
    // ECS.MainWorld.startIntervalTick(100);
    setTimeout(() => ECS.MainWorld.Tick(), 1);
  }

  exit() {
    console.log('Exited paly screen.');
  }

  render(display: ROT.Display, game: Game) {
    // nothing
  }

  handleInput(
    inputType: string,
    inputData: KeyboardEvent,
    game: Game = MainGame
  ) {
    const unlock = () => {
      // this.map?.getEngine().unlock();
      ECS.MainWorld.Tick();
    };
    const setSightDIR = (dir: number) => {
      this.player?.updateComponentKV(sightSystem, 'sightDIR', dir);
    };
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
          setSightDIR(6);
          this.move(-1, 0);
          break;
        }
        case 'Numpad6':
        case 'ArrowRight': {
          setSightDIR(2);
          this.move(1, 0);
          break;
        }
        case 'Numpad8':
        case 'ArrowUp': {
          setSightDIR(0);
          this.move(0, -1);
          break;
        }
        case 'Numpad2':
        case 'ArrowDown': {
          setSightDIR(4);
          this.move(0, 1);
          break;
        }
        case 'Numpad1': {
          setSightDIR(5);
          this.move(-1, 1);
          break;
        }
        case 'Numpad3': {
          setSightDIR(3);
          this.move(1, 1);
          break;
        }
        case 'Numpad7': {
          setSightDIR(7);
          this.move(-1, -1);
          break;
        }
        case 'Numpad9': {
          setSightDIR(1);
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
    const { x, y, z } = this.player.getComponent(positionSystem)!;
    const newX = x + dX;
    const newY = y + dY;
    const newZ = z + dZ;
    // Try to move to the new cell
    tryMove(this.player, newX, newY, newZ);
  }

  setGameOver(gameOver: boolean) {
    this.gameOver = gameOver;
  }
}
