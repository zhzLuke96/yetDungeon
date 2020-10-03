import ECS from '../ECS';
import { MainSoundEngine } from '../soundEngine';
import { appearanceSystem, positionSystem, tileSystem } from './besic';
import { broadcastMessage, canPerception, tryMove } from './utils';
import * as ROT from 'rot-js';
import { GameMap } from '../map';
import { Game, MainGame } from '../game';
import { GlobalSounds } from '../sounds';
import { getRandomArrayElements } from '../utils';

class DestructibleSystem extends ECS.System<{
  hp: number;
  maxHp: number;
  defense: number;
}> {
  createComponent(hp = 2, maxHp = 10, defense = 0) {
    return {
      hp,
      maxHp,
      defense,
    };
  }

  update(entities: ECS.Entity[], ctx: Map<string, any>) {
    const map = ctx.get('map') as GameMap;
    if (!map) {
      return;
    }
    entities.forEach((entity) => {
      const { hp } = entity.getComponent(this)!;
      if (hp <= 0) {
        entity.dispatchEvent('@DestructibleSystem/death');
        map.removeBeing(entity);
      }
    });
  }
}
export const destructibleSystem = new DestructibleSystem();

class AttackSystem extends ECS.System<{
  attack: number;
}> {
  createComponent(attack = 1) {
    return {
      attack,
    };
  }
}
export const attackSystem = new AttackSystem();

// 主要是控制游戏进程，触发一些只有player才会触发的东西
// 状态和效果不应该在这里
class PlayerSystem extends ECS.System<null> {
  update([entity]: ECS.Entity[], ctx: any) {
    const { hp } = entity.getComponent(destructibleSystem)!;
    if (hp <= 0) {
      // game over
      MainGame.dispatchEvent('goto_lose_screen');
    }
  }

  mountEntity(entity: ECS.Entity) {
    entity.addEventListener('messages', this.listenMessage);
  }

  unmountEntity(entity: ECS.Entity) {
    entity.removeEventListener('messages', this.listenMessage);
  }

  listenMessage({
    messages,
    entity: source,
  }: {
    messages: Message[];
    entity: ECS.Entity;
  }) {
    // dispatch MAIN GAME
    for (const message of messages) {
      const { msg, type } = message as Message;
      switch (type) {
        case 'sounds':
          // play audio
          break;
        case 'seen':
          // add logs
          break;
        default:
          // other
          break;
      }
    }
  }
}
export const playerSystem = new PlayerSystem();

interface Message {
  msg: string;
  type: string;
}

class PerceptionSystem extends ECS.System<{ radius: number }> {
  createComponent(radius = 5) {
    return { radius };
  }
}
export const perceptionSystem = new PerceptionSystem();

const fixed = (n: number, p = 2) =>
  Math.floor(n * Math.pow(10, p)) / Math.pow(10, p);

const d = () => new ROT.FOV.PreciseShadowcasting((x, y) => false, {});
type PreciseShadowcasting = ReturnType<typeof d>;
class SightSystem extends ECS.System<{
  fov: PreciseShadowcasting | null;
  radius: number;
  visibleCells: { [key: string]: number };
  sightDIR: number;
  lastSightPosition: number[];
}> {
  createComponent(radius = 10) {
    return {
      fov: null,
      radius,
      visibleCells: {} as { [key: string]: number },
      sightDIR: 0,
      lastSightPosition: [-1, -1, -1],
    };
  }

  tryInitFov(entity: ECS.Entity) {
    const { fov } = entity.getComponent(this)!;
    if (fov) {
      return fov;
    }
    entity.updateComponentKV(
      this,
      'fov',
      new ROT.FOV.PreciseShadowcasting(
        (x, y) => {
          const map = ECS.MainWorld.getVal('map') as GameMap | null;
          if (!map) {
            return false;
          }
          const { z } = entity.getComponent(positionSystem)!;
          const tile = map.getTile(x, y, z);
          const { blocksLight } = tile.getComponent(tileSystem)!;
          return !blocksLight;
        },
        { topology: 8 }
      )
    );
  }

  update(entities: ECS.Entity[], ctx: any) {
    entities.forEach(this.tryInitFov.bind(this));
    entities.forEach((entity) => {
      // TODO: 带方向判定的视角系统
      const {
        fov,
        radius,
        sightDIR,
        lastSightPosition: lp,
      } = entity.getComponent(this)!;
      const { x, y, z } = entity.getComponent(positionSystem)!;
      if (lp[0] === x && lp[1] === y && lp[2] === z) {
        // 不需要更新
        // FIXME: 这里其实也需要更新，只是应该没什么大不了的
        return;
      }
      const newVisiblesCells = this.computeVisiblesCells(x, y, z, radius, fov!);
      entity.updateComponent(this, {
        fov,
        radius,
        visibleCells: newVisiblesCells,
        sightDIR,
        lastSightPosition: [x, y, z],
      });
    });
  }

  computeVisiblesCells(
    x: number,
    y: number,
    z: number,
    radius: number,
    fov: PreciseShadowcasting
  ) {
    const DIST = radius;
    const lights = {} as {
      [key: string]: number;
    };
    const getDist = (x1: number, y1: number, x2: number, y2: number) => {
      const d = Math.abs(x1 - x2) + Math.abs(y1 - y2);
      return Math.sqrt(Math.min(1, Math.max(0, 1 - d / DIST)));
    };
    // fov.compute90(x, y, DIST, this.sightDIR, (x2, y2, r, visibility) => {
    fov.compute(x, y, DIST, (x2, y2, r, visibility) => {
      // [zhzluke96]:
      // ** fixed() reduces number of digits, making the cacher easier to hit
      lights[x2 + ',' + y2] = fixed(
        0.1 + visibility * getDist(x, y, x2, y2),
        2
      );
    });
    return lights;
  }
}

export const sightSystem = new SightSystem();

type MoveType = 'random' | 'seeker';
class MovementSystem extends ECS.System<{ movetype: string }> {
  createComponent(movetype = 'random') {
    return {
      movetype,
    };
  }

  update(entities: ECS.Entity[], ctx: any) {
    entities.forEach((entity) => {
      const { movetype } = entity.getComponent(this)!;
      switch (movetype) {
        case 'random':
          return this.randomMove(entity);
        default:
          break;
      }
    });
  }

  // 随机一个方向
  randomMove(entity: ECS.Entity) {
    const { x, y, z } = entity.getComponent(positionSystem)!;
    const [dx, dy] = [...ROT.DIRS[8], [0, 0]][Math.floor(Math.random() * 9)];
    tryMove(entity, x + dx, y + dy, z);
  }
}
export const movementSystem = new MovementSystem();

class FungusSystem extends ECS.System<{ growthsRemaining: number }> {
  createComponent(growthsRemaining = 5) {
    return {
      // growthsRemaining: 1 + Math.floor(Math.random() * growthsRemaining - 1),
      growthsRemaining,
    };
  }

  mountEntity(entity: ECS.Entity) {
    entity.addEventListener('@DestructibleSystem/death', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.grassDiggedSound(x, y, z);
    });
  }

  update(entities: ECS.Entity[], ctx: any) {
    entities.forEach((entity) => {
      const { growthsRemaining } = entity.getComponent(this)!;
      // Check if we are going to try growing this turn
      if (growthsRemaining === 0) {
        return;
      }
      if (Math.random() > 0.02) {
        return;
      }
      // Generate the coordinates of a random adjacent square by
      // generating an offset between [-1, 0, 1] for both the x and
      // y directions. To do this, we generate a number from 0-2 and then
      // subtract 1.
      const xOffset = Math.floor(Math.random() * 3) - 1;
      const yOffset = Math.floor(Math.random() * 3) - 1;
      // Make sure we aren't trying to spawn on the same tile as us
      if (xOffset === 0 && yOffset === 0) {
        return;
      }
      const { x, y, z } = entity.getComponent(positionSystem)!;
      // Check if we can actually spawn at that location, and if so
      // then we grow!
      if (
        !ECS.MainWorld.getVal('map')?.isEmptyFloor(x + xOffset, y + yOffset, z)
      ) {
        return;
      }
      // TODO: EntityRepository 还没重构，这里是错误的
      const fungus = Game.BeingRepository.create('fungus') as ECS.Entity;
      if (!fungus) {
        return;
      }

      fungus.updateComponent(positionSystem, {
        x: x + xOffset,
        y: y + yOffset,
        z,
      });

      // play sound
      GlobalSounds.grassDiggedSound(x + xOffset, y + yOffset, z);

      ECS.MainWorld.getVal('map').addBeing(fungus);
      entity.updateComponent(this, { growthsRemaining: growthsRemaining - 1 });

      // 向周围广播
      broadcastMessage(fungus, 'message', ['The fungus is spreading!']);
    });
  }
}
export const fungusSystem = new FungusSystem();

export class InventoryHolderSystem extends ECS.System<{
  size: number;
  items: (ECS.Entity | null)[];
}> {
  createComponent(size = 10) {
    return { size, items: [] as (ECS.Entity | null)[] };
  }
}
export const inventoryHolderSystem = new InventoryHolderSystem();
export const inventoryHolderActions = {
  getItems(entity: ECS.Entity) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return [];
    }
    const { items } = entity.getComponent(inventoryHolderSystem)!;
    return items;
  },

  getItem(entity: ECS.Entity, i: number) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return null;
    }
    const { items } = entity.getComponent(inventoryHolderSystem)!;
    return items[i];
  },

  addItem(entity: ECS.Entity, item: ECS.Entity) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return false;
    }
    const { size, items } = entity.getComponent(inventoryHolderSystem)!;
    // Try to find a slot, returning true only if we could add the item.
    for (let i = 0; i < size; i++) {
      if (!items[i]) {
        items[i] = item;
        entity.updateComponentKV(inventoryHolderSystem, 'items', items);
        return true;
      }
    }
    return false;
  },

  removeItem(entity: ECS.Entity, i: number) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return;
    }
    const { items } = entity.getComponent(inventoryHolderSystem)!;
    items[i] = null;
    entity.updateComponentKV(inventoryHolderSystem, 'items', items);
  },

  canAddItem(entity: ECS.Entity) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return false;
    }
    const { size, items } = entity.getComponent(inventoryHolderSystem)!;
    // Try to find a slot, returning true only if we could add the item.
    for (let i = 0; i < size; i++) {
      if (!items[i]) {
        return true;
      }
    }
    return false;
  },

  pickupItems(entity: ECS.Entity, indices: number[]) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return false;
    }
    const map = ECS.MainWorld.getVal('map') as GameMap;
    if (!map) {
      // TODO: Error manage
      return;
    }
    const { x, y, z } = entity.getComponent(positionSystem)!;
    // Allows the user to pick up items from the map, where indices is
    // the indices for the array returned by map.getItemsAt
    // FIXME: 重构结束这段代码才能正常
    const mapItems = (map.getItemsAt(x, y, z) as any) as ECS.Entity[];
    let added = 0;
    // Iterate through all indices.
    for (let i = 0; i < indices.length; i++) {
      // Try to add the item. If our inventory is not full, then splice the
      // item out of the list of items. In order to fetch the right item, we
      // have to offset the number of items already added.
      if (
        inventoryHolderActions.addItem(entity, mapItems[indices[i] - added])
      ) {
        mapItems.splice(indices[i] - added, 1);
        added++;
      } else {
        // Inventory is full
        break;
      }
    }
    // Update the map items
    // FIXME: 重构之后才能正常运行
    map.setItemsAt(x, y, z, mapItems as any);
    // Return true only if we added all items
    return added === indices.length;
  },

  dropItem(entity: ECS.Entity, i: number) {
    if (!entity.hasSystem(inventoryHolderSystem)) {
      return;
    }
    const map = ECS.MainWorld.getVal('map') as GameMap;
    if (!map) {
      // TODO: Error manage
      return;
    }
    const { size, items } = entity.getComponent(inventoryHolderSystem)!;
    const { x, y, z } = entity.getComponent(positionSystem)!;
    // Drops an item to the current map tile
    if (items[i]) {
      if (map && items[i] !== null) {
        // FIXME: 重构完成之后才能用
        map.addItem(x, y, z, items[i]!);
      }
      inventoryHolderActions.removeItem(entity, i);
    }
  },
};

class BatSystem extends ECS.System<null> {
  mountEntity(entity: ECS.Entity) {
    entity.addEventListener('damaged', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.batHurtSound(x, y, z);
    });
    entity.addEventListener('@DestructibleSystem/death', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.batDeathSound(x, y, z);
    });
  }

  update(entities: ECS.Entity[], ctx: any) {
    entities.forEach((entity) => {
      if (Math.random() * 100 > 10) {
        return;
      }
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.batIdleSound(x, y, z);
    });
  }
}
export const batSystem = new BatSystem();

class BigSlimeSystem extends ECS.System<null> {
  mountEntity(entity: ECS.Entity) {
    entity.addEventListener('damaged', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.bigSlimeSound(x, y, z);
    });
    entity.addEventListener('@DestructibleSystem/death', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.slimeSound(x, y, z);

      const smalls = getRandomArrayElements(
        [...ROT.DIRS[8], [0, 0]],
        3
      ).map(([x1, y1]) => [x + x1, y + y1]);

      for (const [x1, y1] of smalls) {
        const smallSlime = Game.BeingRepository.create('SmallSlime')!;
        smallSlime?.updateComponent(positionSystem, { x: x1, y: y1, z });
      }
    });
    entity.addEventListener('moveto', (x: number, y: number, z: number) => {
      GlobalSounds.bigSlimeSound(x, y, z);
    });
  }
}
export const bigSlimeSystem = new BigSlimeSystem();

class SmallSlimeSystem extends ECS.System<null> {
  mountEntity(entity: ECS.Entity) {
    entity.addEventListener('damaged', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.smallSlimeSound(x, y, z);
    });
    entity.addEventListener('@DestructibleSystem/death', () => {
      const { x, y, z } = entity.getComponent(positionSystem)!;
      GlobalSounds.slimeSound(x, y, z);
    });
    entity.addEventListener('moveto', (x: number, y: number, z: number) => {
      GlobalSounds.smallSlimeSound(x, y, z);
    });
  }
}
export const smallSlimeSystem = new SmallSlimeSystem();
