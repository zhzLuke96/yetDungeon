import ECS from '../ECS';
import { MainGame } from '../game';
import { descriptibleSystem, positionSystem } from './besic';
import { GameMap } from '../map';

class MessageLoggerSystem extends ECS.System<null> {
  mountEntity(entity: ECS.Entity) {
    // bind attack
    entity.addEventListener('attack', (target: ECS.Entity, damage: number) => {
      const { name } = target.getComponent(descriptibleSystem)!;
      MainGame.dispatchEvent(
        'sendMessage',
        `你痛击了 ${name}，造成了 ${damage} 点伤害。`
      );
    });
    entity.addEventListener('damaged', (source: ECS.Entity, damage: number) => {
      const { name } = source.getComponent(descriptibleSystem)!;
      MainGame.dispatchEvent(
        'sendMessage',
        `${name} 攻击了你，造成了 ${damage} 点伤害。`
      );
    });

    // listene message
    entity.addEventListener(
      'message',
      (source: ECS.Entity, messages: string[]) => {
        // const { name } = source.getComponent(descriptibleSystem)!;
        messages.forEach((message) =>
          MainGame.dispatchEvent('sendMessage', message)
        );
      }
    );
  }
}
export const messageLoggerSystem = new MessageLoggerSystem();

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
