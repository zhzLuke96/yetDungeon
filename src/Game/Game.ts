import * as ROT from 'rot-js';
import { Event } from '../Event';
import { startScreen, playScreen, loseScreen, winScreen } from './screens';
import { Screen } from './screens/Screen';
import './bindEvents';
import { Entity } from './map/Entity';
import {
  EntityRepository,
  isMessageRecipient,
  isPlayerActor,
} from './map/entities';
import { Map } from './map/Map';
import { Tile } from './map/Tile';
import { shuffle } from './shuffle';
import { ItemRepository } from './item/Item';
import * as _ from 'lodash';

export class Game extends Event {
  static Tiles = {
    null: new Tile(),
    floor: new Tile({
      character: '.',
      walkable: true,
      blocksLight: false,
      describe: '平整的地面，看上去平淡无奇',
    }),
    wall: new Tile({
      character: '#',
      foreground: 'goldenrod',
      diggable: true,
      describe: '粗糙的土墙，看起来坑坑洼洼',
    }),
    stairsUp: new Tile({
      character: '<',
      foreground: 'white',
      walkable: true,
      blocksLight: false,
      describe: '向上的楼梯',
    }),
    stairsDown: new Tile({
      character: '>',
      foreground: 'white',
      walkable: true,
      blocksLight: false,
      describe: '向下的楼梯',
    }),
  };

  static Screens = {
    startScreen,
    playScreen,
    loseScreen,
    winScreen,
  };

  static EntityRepository = EntityRepository;
  static ItemRepository = ItemRepository;

  private display: ROT.Display;
  private currentScreen: Screen;
  private screenWidth: number;
  private screenHeight: number;

  constructor() {
    super();

    this.screenWidth = 80;
    this.screenHeight = 24 * 2;

    // Any necessary initialization will go here.
    this.display = new ROT.Display({
      width: this.screenWidth,
      height: this.screenHeight + 1,
    });
    // Create a helper function for binding to an event
    // and making it send it to the screen
    const game = this; // So that we don't lose this
    const bindEventToScreen = (event: string) => {
      window.addEventListener(event, (e) => {
        if (e.defaultPrevented) {
          return; // Do nothing if the event was already processed
        }
        // When an event is received, send it to the
        // screen if there is one
        if (game.currentScreen !== null) {
          // Send the event type and data to the screen
          game.currentScreen.handleInput(event, e, game);
        }
        // // Cancel the default action to avoid it being handled twice
        // e.preventDefault();
      });
    };
    // Bind keyboard input events
    bindEventToScreen('keydown');
    // bindEventToScreen('keyup');
    bindEventToScreen('keypress');

    // initialization currentScreen
    this.currentScreen = startScreen;
    this.switchScreen(startScreen);
  }

  refresh() {
    // Clear the screen
    this.display.clear();
    // Render the screen
    this.currentScreen.render(this.display, this);
  }

  getDisplay() {
    return this.display;
  }

  getScreenWidth() {
    return this.screenWidth;
  }

  getScreenHeight() {
    return this.screenHeight;
  }

  appendToElement(parentElement: HTMLElement) {
    const container = this.display.getContainer();
    if (container) {
      parentElement.appendChild(container);
    }
  }

  switchScreen(screen: Screen) {
    // If we had a screen before, notify it that we exited
    if (this.currentScreen !== null) {
      this.currentScreen.exit();
    }
    // Clear the display
    this.getDisplay().clear();
    // Update our current screen, notify it we entered
    // and then render it
    this.currentScreen = screen;
    if (!this.currentScreen !== null) {
      this.currentScreen.enter();
      this.refresh();
    }
  }

  static sendMessage(
    recipient: Entity,
    messager: (...args: any) => string,
    args: any[] = []
  ) {
    // Make sure the recipient can receive the message
    // before doing any work.
    if (isMessageRecipient(recipient)) {
      // If args were passed, then we format the message, else
      // no formatting is necessary
      const msg = messager(...args);
      recipient.receiveMessage(msg);
      MainGame.dispatchEvent('sendMessage', msg);
    }
  }

  static sendMessageNearby(
    map: Map,
    centerX: number,
    centerY: number,
    centerZ: number,
    messager: (...args: any) => string,
    args: any[] = []
  ) {
    // If args were passed, then we format the message, else
    // no formatting is necessary
    const message = messager(...args);
    // Get the nearby entities
    const entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    // Iterate through nearby entities, sending the message if
    // they can receive it.
    for (const entity of entities) {
      if (isMessageRecipient(entity)) {
        entity.receiveMessage(message);
        if (isPlayerActor(entity)) {
          MainGame.dispatchEvent('sendMessageNearby', message);
        }
      }
    }
  }

  static getNeighborPositions(x: number, y: number) {
    const tiles = [] as { x: number; y: number }[];
    // Generate all possible offsets
    for (let dX = -1; dX < 2; dX++) {
      for (let dY = -1; dY < 2; dY++) {
        // Make sure it isn't the same tile
        if (dX === 0 && dY === 0) {
          continue;
        }
        tiles.push({ x: x + dX, y: y + dY });
      }
    }
    return shuffle(tiles);
  }

  static lightedColor = cachedFunc((color: string, lightLevel: number) => {
    const colorIns = ROT.Color.fromString(color);
    return ROT.Color.multiply(colorIns, [
      lightLevel * 255,
      lightLevel * 255,
      lightLevel * 255,
    ]);
  }) as (color: string, lightLevel: number) => [number, number, number];

  static lightedColorHex = cachedFunc((color: string, lightLevel: number) => {
    const colorIns = Game.lightedColor(color, lightLevel);
    return ROT.Color.toHex(colorIns);
  }) as (color: string, lightLevel: number) => string;

  dispatchMouseOverTilePosition(tx: number, ty: number) {
    const container = this.display.getContainer();
    if (!container) {
      return Game.Tiles.null;
    }
    const { clientWidth, clientHeight } = container;
    const { screenWidth, screenHeight } = this;
    const [x, y] = [
      (tx / clientWidth) * screenWidth,
      (ty / clientHeight) * screenHeight,
    ].map(Math.floor);
    this.dispatchEvent('MouseOverTilePosition', [x, y]);
  }
}

export const MainGame = new Game();

const isFirstCall = Symbol('isFirstCall');
function cachedFunc(func: (...args: any[]) => any) {
  const hashMap = {} as any;
  return (...args: any[]) => {
    const path = args.map((o) => (o.toString && o.toString()) || '');
    let value = _.get(hashMap, path, isFirstCall);
    if (isFirstCall) {
      value = func(...args);
      _.set(hashMap, path, value);
    }
    return value;
  };
}
