import { Game, MainGame } from './game';
import { Item } from './item';
import { Entity, EntityProperties } from './entity';
import { AudioSpeaker } from './audioSpeaker';
import * as ROT from 'rot-js';

type MixinConstructor<T = Entity> = new (...args: any[]) => T;

// 👇 mixins 👇

function PlayerActor<TBase extends MixinConstructor>(Base: TBase) {
  return class PlayerActorCls extends Base {
    isPlayerActor = true;

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.PlayerActor = true;
      this.attachedMixinGroups.Actor = true;
    }

    act() {
      // Detect if the game is over
      if (isDestructible(this) && this.getHp() < 1) {
        Game.Screens.playScreen.setGameOver(true);
        // Send a last message to the player
        Game.sendMessage(
          this,
          () => 'You have died... Press [Enter] to continue!'
        );
      }
      // Re-render the screen
      MainGame.refresh();
      // Lock the engine and wait asynchronously
      // for the player to press a key.
      this.getMap()?.getEngine().lock();
      // Clear the message queue
      if (isMessageRecipient(this)) {
        this.clearMessages();
      }
    }
  };
}

const PlayerActorEntityFn = () => new (PlayerActor(Entity))({});
type PlayerActorEntity = ReturnType<typeof PlayerActorEntityFn>;

export function isPlayerActor(entity: Entity): entity is PlayerActorEntity {
  return (entity as any).isPlayerActor;
}

function FungusActor<TBase extends MixinConstructor>(Base: TBase) {
  return class FungusActorCls extends Base {
    growthsRemaining: number;
    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.FungusActor = true;
      this.attachedMixinGroups.Actor = true;

      this.growthsRemaining = 5;
    }

    act() {
      // Check if we are going to try growing this turn
      if (this.growthsRemaining === 0) {
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
      // Check if we can actually spawn at that location, and if so
      // then we grow!
      if (
        !this.getMap()?.isEmptyFloor(
          this.getX() + xOffset,
          this.getY() + yOffset,
          this.getZ()
        )
      ) {
        return;
      }
      const entity = Game.EntityRepository.create('fungus');
      if (!entity) {
        return;
      }
      entity.setPosition(
        this.getX() + xOffset,
        this.getY() + yOffset,
        this.getZ()
      );
      this.getMap()?.addEntity(entity);
      this.growthsRemaining--;

      if (isMessageRecipient(this)) {
        // Send a message nearby!
        Game.sendMessageNearby(
          this.getMap()!,
          entity.getX(),
          entity.getY(),
          this.getZ(),
          () => 'The fungus is spreading!'
        );
      }
    }
  };
}

function Destructible<TBase extends MixinConstructor>(Base: TBase) {
  return class DestructibleCls extends Base {
    private hp: number;
    private maxHp: number;
    private defenseValue: number;

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.Destructible = true;

      const { hp, maxHp = 10, defenseValue = 0 } = params[0] || {};
      // We allow taking in health from the template incase we want
      // the entity to start with a different amount of HP than the
      // max specified.
      this.maxHp = maxHp;
      this.hp = hp || maxHp;
      this.defenseValue = defenseValue;
    }

    getHp() {
      return this.hp;
    }

    getMaxHp() {
      return this.maxHp;
    }

    getDefenseValue() {
      return this.defenseValue;
    }

    takeDamage(attacker: Entity, damage: number) {
      this.hp -= damage;
      // If have 0 or less HP, then remove ourseles from the map
      if (this.hp <= 0) {
        if (isMessageRecipient(attacker)) {
          Game.sendMessage(attacker, (n) => `You kill the ${n}!`, [
            this.getName(),
          ]);
          // Check if the player died, and if so call their act method to prompt the user.
          if (isPlayerActor(this)) {
            this.act();
          } else {
            this.getMap()?.removeEntity(this);
          }
        }

        this.getMap()?.removeEntity(this);
      }
    }
  };
}

const DestructibleEntityFn = () => new (Destructible(Entity))({});
type DestructibleEntity = ReturnType<typeof DestructibleEntityFn>;

export function isDestructible(entity: Entity): entity is DestructibleEntity {
  return entity.hasMixin('Destructible');
}

function Attacker<TBase extends MixinConstructor>(Base: TBase) {
  return class AttackerCls extends Base {
    isAttacker = true;
    attackValue: number;

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.Attacker = true;
      this.attachedMixinGroups.Attacker = true;

      const { attackValue = 1 } = params[0] || {};
      this.attackValue = attackValue;
    }

    getAttackValue() {
      return this.attackValue;
    }

    attack(target: Entity) {
      // If the target is destructible, calculate the damage
      // based on attack and defense value
      if (isDestructible(target)) {
        const attack = this.getAttackValue();
        const defense = target.getDefenseValue();
        const max = Math.max(0, attack - defense);
        const damage = 1 + Math.floor(Math.random() * max);

        if (isMessageRecipient(target)) {
          Game.sendMessage(
            this,
            (s, d) => `You strike the ${s} for ${d} damage!`,
            [target.getName(), damage]
          );
          Game.sendMessage(
            target,
            (s, d) => `The ${s} strikes you for ${d} damage!`,
            [this.getName(), damage]
          );
        }
        target.takeDamage(this, damage);
      }
    }
  };
}

const AttackerEntityFn = () => new (Attacker(Entity))({});
type AttackerEntity = ReturnType<typeof AttackerEntityFn>;

export function isAttacker(entity: Entity): entity is AttackerEntity {
  return (entity as any).isAttacker;
}

function MessageRecipient<TBase extends MixinConstructor>(Base: TBase) {
  return class MessageRecipientCls extends Base {
    isMessageRecipient = true;
    private messages: string[];

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.MessageRecipient = true;

      const {} = params[0] || {};
      this.messages = [];
    }

    receiveMessage(message: string) {
      this.messages.push(message);
    }

    getMessages() {
      return this.messages;
    }

    clearMessages() {
      this.messages = [];
    }
  };
}

const MessageRecipientEntityFn = () => new (MessageRecipient(Entity))({});
type MessageRecipientEntity = ReturnType<typeof MessageRecipientEntityFn>;

export function isMessageRecipient(
  entity: Entity
): entity is MessageRecipientEntity {
  return (entity as any).isMessageRecipient;
}

const d = () => new ROT.FOV.PreciseShadowcasting((x, y) => false, {});
type PreciseShadowcasting = ReturnType<typeof d>;

const fixed = (n: number, p = 2) =>
  Math.floor(n * Math.pow(10, p)) / Math.pow(10, p);
function Sight<TBase extends MixinConstructor>(Base: TBase) {
  return class SightCls extends Base {
    isSight = true;
    private sightRadius: number;
    private fov: PreciseShadowcasting;
    private visiblesCells: { [key: string]: number };
    private lastSightPosition: number[];
    private sightDIR: number;

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.Sight = true;

      const { sightRadius = 10 } = params[0] || {};
      this.sightRadius = sightRadius;

      this.fov = new ROT.FOV.PreciseShadowcasting(
        (x, y) => {
          const map = this.getMap();
          if (!map) {
            return false;
          }
          // TODO: entity should be block ligths maybe?
          return !map.getTile(x, y, this.z).isBlockingLight();
        },
        { topology: 8 }
      );
      this.lastSightPosition = [];
      this.sightDIR = 0;
      this.visiblesCells = this.computeVisiblesCells();
    }

    private canCachedVisibles() {
      return (
        this.lastSightPosition[0] === this.x &&
        this.lastSightPosition[1] === this.y &&
        this.lastSightPosition[2] === this.z
      );
    }

    setSightDIR(dir: number) {
      this.sightDIR = dir;
    }

    getSightRadius() {
      return this.sightRadius;
    }

    computeVisiblesCells(
      callback?: (x: number, y: number, r: number, visibility: number) => void
    ) {
      if (this.canCachedVisibles()) {
        return this.visiblesCells;
      }
      this.lastSightPosition = [this.x, this.y, this.z];
      const { x, y } = this;
      const DIST = this.sightRadius;
      const fov = this.fov;
      const lights = {} as {
        [key: string]: number;
      };
      const getDist = (x1: number, y1: number, x2: number, y2: number) => {
        const d = Math.abs(x1 - x2) + Math.abs(y1 - y2);
        return Math.sqrt(Math.min(1, Math.max(0, 1 - d / DIST)));
      };
      // fov.compute90(x, y, DIST, this.sightDIR, (x2, y2, r, visibility) => {
      fov.compute(x, y, DIST, (x2, y2, r, visibility) => {
        lights[x2 + ',' + y2] = fixed(0.1 + visibility * getDist(x, y, x2, y2));
        callback && callback(x2, y2, r, visibility);
      });
      this.visiblesCells = lights;
      return lights;
    }
  };
}

const SightEntityFn = () => new (Sight(Entity))({});
type SightEntity = ReturnType<typeof SightEntityFn>;

export function isSight(entity: Entity): entity is SightEntity {
  return (entity as any).isSight;
}

function WanderActor<TBase extends MixinConstructor>(Base: TBase) {
  return class WanderActorCls extends Base {
    isWanderActor = true;

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixinGroups.Actor = true;
    }

    act() {
      // Flip coin to determine if moving by 1 in the positive or negative direction
      const moveOffset = Math.round(Math.random()) === 1 ? 1 : -1;
      // Flip coin to determine if moving in x direction or y direction
      if (Math.round(Math.random()) === 1) {
        this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
      } else {
        this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
      }
    }
  };
}

const WanderActorEntityFn = () => new (WanderActor(Entity))({});
type WanderActorEntity = ReturnType<typeof WanderActorEntityFn>;

export function isWanderActor(entity: Entity): entity is WanderActorEntity {
  return (entity as any).isWanderActor;
}

function InventoryHolder<TBase extends MixinConstructor>(Base: TBase) {
  return class InventoryHolderCls extends Base {
    isInventoryHolder = true;
    private items: (Item | null)[];

    constructor(...params: any[]) {
      super(...params);
      this.attachedMixins.InventoryHolder = true;

      const { inventorySlots = 10 } = params[0] || {};
      // Set up an empty inventory.
      this.items = new Array(inventorySlots);
    }

    getItems() {
      return this.items;
    }

    getItem(i: number) {
      return this.items[i];
    }

    addItem(item: Item) {
      // Try to find a slot, returning true only if we could add the item.
      for (let i = 0; i < this.items.length; i++) {
        if (!this.items[i]) {
          this.items[i] = item;
          return true;
        }
      }
      return false;
    }

    removeItem(i: number) {
      // Simply clear the inventory slot.
      this.items[i] = null;
    }

    canAddItem() {
      // Check if we have an empty slot.
      for (let i = 0; i < this.items.length; i++) {
        if (!this.items[i]) {
          return true;
        }
      }
      return false;
    }

    pickupItems(indices: number[]) {
      const map = this.getMap();
      if (!map) {
        // TODO: Error manage
        return;
      }
      // Allows the user to pick up items from the map, where indices is
      // the indices for the array returned by map.getItemsAt
      const mapItems = map.getItemsAt(this.getX(), this.getY(), this.getZ());
      let added = 0;
      // Iterate through all indices.
      for (let i = 0; i < indices.length; i++) {
        // Try to add the item. If our inventory is not full, then splice the
        // item out of the list of items. In order to fetch the right item, we
        // have to offset the number of items already added.
        if (this.addItem(mapItems[indices[i] - added])) {
          mapItems.splice(indices[i] - added, 1);
          added++;
        } else {
          // Inventory is full
          break;
        }
      }
      // Update the map items
      map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
      // Return true only if we added all items
      return added === indices.length;
    }

    dropItem(i: number) {
      // Drops an item to the current map tile
      if (this.items[i]) {
        const map = this.getMap();
        if (map && this.items[i] !== null) {
          map.addItem(this.getX(), this.getY(), this.getZ(), this.items[i]!);
        }
        this.removeItem(i);
      }
    }
  };
}

const InventoryHolderEntityFn = () => new (InventoryHolder(Entity))({});
type InventoryHolderEntity = ReturnType<typeof InventoryHolderEntityFn>;

export function isInventoryHolder(
  entity: Entity
): entity is InventoryHolderEntity {
  return (entity as any).isInventoryHolder;
}

// ================================

export const Mixins = {
  PlayerActor,
  FungusActor,
  WanderActor,
  Destructible,
  Attacker,
  MessageRecipient,
  Sight,
  InventoryHolder,
};
