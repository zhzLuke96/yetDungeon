import ECS from '../ECS';
import {
  attackSystem,
  destructibleSystem,
  perceptionSystem,
  playerSystem,
} from './being';
import { positionSystem, tileSystem } from './besic';
import { GameMap } from '../map';
import { Game } from '../game';
import { GlobalSounds } from '../sounds';

export const canPerception = (self: ECS.Entity, target: ECS.Entity) => {
  if (self === target) {
    return false;
  }
  if (!target.hasSystem(positionSystem)) {
    return false;
  }
  const { x: x1, y: y1, z: z1 } = self.getComponent(positionSystem)!;
  const { x: x2, y: y2, z: z2 } = target.getComponent(positionSystem)!;
  if (z1 !== z2) {
    return false;
  }
  const { radius } = target.getComponent(perceptionSystem)!;
  // if (Math.abs(x2 - x1) > radius || Math.abs(y2 - y1) > radius) {
  //   return false;
  // }
  // return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <= radius;
  return (
    z2 === z1 &&
    x2 < x1 + radius &&
    y2 < y1 + radius &&
    x2 >= x1 - radius &&
    y2 >= y1 - radius
  );
};

export const tryMove = (
  entity: ECS.Entity,
  x: number,
  y: number,
  z: number
) => {
  const map = ECS.MainWorld.getVal('map') as GameMap | null;
  if (!map) {
    return;
  }
  const { being, tile, items } = map.getAt(x, y, z);
  if (being) {
    if (being === entity) {
      // ❗ random walker maybe to [0,0]
      return;
    }
    return tryTouch(entity, being);
  }
  if (!tile) {
    // nothing here
    return;
  }
  if (tile === Game.Tiles.null) {
    return;
  }
  const { walkable, diggable } = tile.getComponent(tileSystem)!;
  if (entity.hasSystem(playerSystem) && diggable) {
    GlobalSounds.stoneDiggedSound(x, y, z);
    return map.dig(x, y, z);
  }
  if (walkable) {
    const old = entity.getComponent(positionSystem)!;
    tile.dispatchEvent('trampled', entity);
    entity.dispatchEvent('moveto', { tile, items }, x, y, z);
    entity.updateComponent(positionSystem, { x, y, z });
    return map.updateBeingPosition(entity, old.x, old.y, old.z);
  }
};

const tryTouch = (entity: ECS.Entity, target: ECS.Entity) => {
  if (!entity.hasSystem(playerSystem) && !target.hasSystem(playerSystem)) {
    // ❗ peace between monsters
    return;
  }
  if (entity.hasSystem(attackSystem) && target.hasSystem(destructibleSystem)) {
    tryAttack(entity, target);
  } else {
    target.dispatchEvent('touch', entity);
  }
};

const tryAttack = (entity: ECS.Entity, target: ECS.Entity) => {
  const { attack } = entity.getComponent(attackSystem)!;
  const { hp, defense } = target.getComponent(destructibleSystem)!;
  const damage = Math.max(0, attack - defense);
  target.updateComponentKV(destructibleSystem, 'hp', hp - damage);
  entity.dispatchEvent('attack', target, damage);
  target.dispatchEvent('damaged', entity, damage);
};

export const broadcastMessage = (
  entity: ECS.Entity,
  type: string,
  messages: string[]
) => {
  if (!entity.hasSystem(perceptionSystem)) {
    return;
  }
  const entities = ECS.MainWorld.getQueries({ isSys: [perceptionSystem] });

  entities.forEach(
    (target) =>
      canPerception(entity, target) &&
      target.dispatchEvent(type, entity, messages)
  );
};
