import { Entity } from './entity';
import { TypelessEvent } from './typelessEvent';

export namespace ECS {
  const requestInterval = (fn: FrameRequestCallback, delay: number) => {
    const requestAnimFrame =
      window.requestAnimationFrame ||
      ((callback: FrameRequestCallback) => setTimeout(callback, 1000 / 60));
    let start = new Date().getTime();
    const handle = { value: 0 as number | void };
    function loop() {
      handle.value = requestAnimFrame(loop);
      const current = new Date().getTime();
      const delta = current - start;
      if (delta >= delay) {
        fn(0);
        start = new Date().getTime();
      }
    }
    handle.value = requestAnimFrame(loop);
    return handle;
  };

  const uniqid = () => Math.random().toString(36).substr(2);
  const createEmpty = () => Object.create(null);
  const createObject = <Obj>(obj: Obj) => {
    const empty = createEmpty();
    for (const key in obj) {
      empty[key] = obj[key];
    }
    return empty as Obj;
  };

  export class System<ComponentType, WorldContext = any> {
    // abstract method
    createComponent(...params: any[]): ComponentType {
      return {} as ComponentType;
    }

    // abstract method
    update(entities: Entity[], worldCtx: WorldContext): void {
      return;
    }

    // abstract method
    mountEntity(entity: Entity, component: any) {
      return;
    }

    // abstract method
    unmountEntity(entity: Entity) {
      return;
    }
  }

  export class Entity extends TypelessEvent {
    private sys2Component: WeakMap<System<any>, any>;
    _id: string; // uniqid

    constructor(id = uniqid()) {
      super();
      this._id = id;
      this.sys2Component = new WeakMap<System<any>, any>();
    }

    mountComponent(sys: System<any>, ...params: any[]) {
      const component = createObject(sys.createComponent(...params));
      this.sys2Component.set(sys, component);
      sys.mountEntity(this, component);
    }

    updateComponent(sys: System<any>, component: any) {
      this.sys2Component.set(sys, component);
    }

    updateComponentKV(sys: System<any>, key: string, val: any) {
      const component = this.sys2Component.get(sys);
      component[key] = val;
      this.sys2Component.set(sys, component);
    }

    unmountComponent(sys: System<any>) {
      this.sys2Component.delete(sys);
      sys.unmountEntity(this);
    }

    hasSystem(sys: System<any>) {
      return this.sys2Component.has(sys);
    }

    getComponent<ComponentType>(sys: System<ComponentType>) {
      return (this.sys2Component.get(sys) || null) as ComponentType | null;
    }
  }

  interface SystemProperties {
    system: System<any>;
    params?: any[];
  }

  class World {
    private sys2entities = new WeakMap<System<any>, Entity[]>();
    private systems = new Set<System<any>>();
    private entityCount = 0;
    private worldCtx = new Map<string, any>();

    startIntervalTick(ms = 1000) {
      requestInterval(this.Tick.bind(this), ms);
    }

    getVal(key: string) {
      return this.worldCtx.get(key) || null;
    }

    setVal(key: string, val: any) {
      return this.worldCtx.set(key, val);
    }

    Tick() {
      for (const sys of Array.from(this.systems)) {
        const entities = this.sys2entities.get(sys) || [];
        sys.update(entities, this.worldCtx);
      }
    }

    addSingletonSystem(sys: System<any>) {
      this.systems.add(sys);
    }

    getEntityCount() {
      return this.entityCount;
    }

    createEntity(id?: string, ...systems: SystemProperties[]): Entity {
      this.entityCount++;
      const entity = new Entity(id);
      systems.forEach(({ system, params }) =>
        MainWorld.mountSystem(entity, system, ...params)
      );
      return entity;
    }

    mountSystem(entity: Entity, sys: System<any>, ...params: any[]) {
      if (entity.hasSystem(sys)) {
        return;
      }
      // add to set
      this.systems.add(sys);
      const entities = this.sys2entities.get(sys) || [];
      this.sys2entities.set(sys, [...entities, entity]);
      entity.mountComponent(sys, ...params);
    }

    unmountSystem(entity: Entity, sys: System<any>) {
      if (!entity.hasSystem(sys)) {
        return;
      }
      entity.unmountComponent(sys);
      const entities = this.sys2entities.get(sys) || [];
      const idx = entities.indexOf(entity);
      entities.splice(idx, 1);
      this.sys2entities.set(sys, [...entities]);
    }

    destroyEntity(entity: Entity) {
      for (const sys of this.systems) {
        this.unmountSystem(entity, sys);
      }
      entity.clearListeners();
    }

    getQueries({
      isSys = [],
      notSys = [],
    }: {
      isSys?: System<any>[];
      notSys?: System<any>[];
    }) {
      const result = [] as (Entity | null)[];
      for (const sys of isSys) {
        result.push(...(this.sys2entities.get(sys) || []));
      }
      for (const sys of notSys) {
        for (const idx in result) {
          const entity = result[idx];
          if (entity && entity.hasSystem(sys)) {
            result[idx] = null;
          }
        }
      }
      return result.filter(Boolean) as Entity[];
    }
  }

  export const MainWorld = new World();

  export class Assemblages {
    private systems: SystemProperties[];
    constructor(systems = [] as SystemProperties[]) {
      this.systems = systems;
    }

    extends(systems = [] as SystemProperties[]) {
      return new Assemblages([...this.systems, ...systems]);
    }

    createInstance(id?: string) {
      return MainWorld.createEntity(id, ...this.systems);
    }
  }
}

export default ECS;

// class CountLogSystem implements System {
//   createComponent(initialValue = 0) {
//     return {
//       count: initialValue,
//     };
//   }

//   update(entities: Entity[], ctx) {
//     entities.forEach(this.logmsg.bind(this));
//   }

//   logmsg(entity: Entity) {
//     const component = entity.getComponent(this);
//     console.log(component.count);
//     entity.mountComponent(this, { count: component.count + 1 });
//   }
// }

// const countSys = new CountLogSystem();

// MainWorld.createEntity([countSys, [10]]);
// MainWorld.createEntity([countSys, [5]]);
// MainWorld.createEntity();

// MainWorld.startIntervalTick();
