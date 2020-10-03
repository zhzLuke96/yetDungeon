import ECS from '../ECS';
import * as ROT from 'rot-js';
import { Game, MainGame } from '../game';
import { Map as GameMap } from '../map';
import { destructibleSystem, sightSystem } from './being';
import { appearanceSystem, descriptibleSystem, positionSystem } from './besic';

const getTopLeftPosition = (
  player: ECS.Entity,
  map: GameMap,
  game = MainGame,
  screenWidth: number = game.getScreenWidth(),
  screenHeight: number = game.getScreenHeight()
) => {
  if (!player) {
    throw Error('Player is not initialized.');
  }
  const { x, y, z } = player.getComponent(positionSystem)!;
  // Make sure the x-axis doesn't go to the left of the left bound
  let topLeftX = Math.max(0, x - screenWidth / 2);
  // Make sure we still have enough space to fit an entire game screen
  topLeftX = Math.min(topLeftX, map.getWidth() - screenWidth);
  // Make sure the y-axis doesn't above the top bound
  let topLeftY = Math.max(0, y - screenHeight / 2);
  // Make sure we still have enough space to fit an entire game screen
  topLeftY = Math.min(topLeftY, map.getHeight() - screenHeight);
  return [topLeftX, topLeftY];
};

interface wCtx {
  map: GameMap;
  player: ECS.Entity;
  display: ROT.Display;
  mouse: [number, number];
}

class RenderSystem extends ECS.System<null> {
  update(_: ECS.Entity[], ctx: Map<string, any>) {
    if (!ctx.has('player')) {
      throw Error('Player is not initialized.');
    }
    if (!ctx.has('map')) {
      throw Error('Map is not initialized.');
    }
    const map = ctx.get('map') as GameMap;
    const player = ctx.get('player') as ECS.Entity;
    const display = ctx.get('display') as ROT.Display;

    display.clear();

    const screenWidth = MainGame.getScreenWidth();
    const screenHeight = MainGame.getScreenHeight();

    const [topLeftX, topLeftY] = getTopLeftPosition(player, map);

    const playerP = player.getComponent(positionSystem)!;
    // Store this._map and player's z to prevent losing it in callbacks
    const currentDepth = playerP.z;

    // This object will keep track of all visible map cells
    const { visibleCells } = player.getComponent(sightSystem)!;

    // update explored
    for (const point in visibleCells) {
      const [x, y] = point.split(',').map(Number);
      map.setExplored(x, y, playerP.z, true);
    }

    // Iterate through all visible map cells
    for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
      for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
        const lightLevel = visibleCells[x + ',' + y];
        if (lightLevel > 0) {
          // Fetch the glyph for the tile and render it to the screen
          // at the offset position.
          const tile = map.getTile(x, y, playerP.z);
          const { ch, fg, bg } = tile.getComponent(appearanceSystem)!;
          display.draw(
            x - topLeftX,
            y - topLeftY,
            ch,
            Game.lightedColorHex(fg, lightLevel),
            bg
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
          let glyph = map.getTile(x, y, currentDepth);
          const { fg } = glyph.getComponent(appearanceSystem)!;
          let foreground = fg;
          // If we are at a cell that is in the field of vision, we need
          // to check if there are items or entities.
          const lightLevel = visibleCells[x + ',' + y];
          if (lightLevel > 0) {
            // Check for items first, since we want to draw entities
            // over items.
            const items = map.getItemsAt(x, y, currentDepth);
            // If we have items, we want to render the top most item
            if (items.length !== 0) {
              glyph = items[items.length - 1];
            }
            // // Check if we have an entity at the position
            const being = map.getBeingAt(x, y, currentDepth);
            if (being) {
              glyph = being;
            }
            // Update the foreground color in case our glyph changed
            const { fg } = glyph.getComponent(appearanceSystem)!;
            foreground = Game.lightedColorHex(fg, lightLevel);
          } else {
            // Since the tile was previously explored but is not
            // visible, we want to change the foreground color to
            // dark gray.
            // foreground = 'darkGray';
            foreground = Game.lightedColorHex(foreground, 0.1);
          }
          const { ch, bg } = glyph.getComponent(appearanceSystem)!;
          display.draw(x - topLeftX, y - topLeftY, ch, foreground, bg);
        }
      }
    }

    // Render the entities
    const entities = map.getBeings();
    for (const key in entities) {
      const entity = entities[key];
      // Only render the entitiy if they would show up on the screen
      const { x, y, z } = entity.getComponent(positionSystem)!;
      const { ch, fg, bg } = entity.getComponent(appearanceSystem)!;
      if (
        x >= topLeftX &&
        y >= topLeftY &&
        x < topLeftX + screenWidth &&
        y < topLeftY + screenHeight &&
        z === playerP.z
      ) {
        const lightLevel = visibleCells[x + ',' + y];
        if (lightLevel > 0) {
          display.draw(
            x - topLeftX,
            y - topLeftY,
            ch,
            Game.lightedColorHex(fg, lightLevel),
            bg
          );
        }
      }
    }

    // render mouse
    if (ctx.has('mouse')) {
      const [mx, my] = ctx.get('mouse');
      if (mx !== -1 && my !== -1) {
        display.draw(mx, my, 'O', 'green', 'transparent');
      }
    }

    // Render player HP
    const { hp, maxHp } = player.getComponent(destructibleSystem)!;
    const stats = `%c{white}%b{black}HP: ${hp}/${maxHp}`;
    display.drawText(0, screenHeight, stats);
  }
}

export const renderSystem = new RenderSystem();
