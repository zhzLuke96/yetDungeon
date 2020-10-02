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

export class System<ComponentType = any, WorldContext = any> {
  // abstract method
  createComponent(...params: any[]): ComponentType {
    return {} as ComponentType;
  }

  // abstract method
  update(entities: Entity[], worldCtx: WorldContext): void {
    return;
  }
}

class Entity {
  private sys2Component: WeakMap<System, any>;
  private _id: string; // uniqid

  constructor() {
    this._id = uniqid();
    this.sys2Component = new WeakMap<System, any>();
  }

  mountComponent(sys: System, component: any) {
    this.sys2Component.set(sys, component);
  }

  unmountComponent(sys: System) {
    this.sys2Component.delete(sys);
  }

  hasSystem(sys: System) {
    return this.sys2Component.has(sys);
  }

  getComponent(sys: System) {
    return this.sys2Component.get(sys) || null;
  }
}

export class World<WorldContext = any> {
  private sys2entities = new WeakMap<System, Entity[]>();
  private systems = new Set<System>();
  private entityCount = 0;
  private worldCtx = {} as WorldContext;

  updateWorldContext(ctx: WorldContext) {
    this.worldCtx = ctx;
  }

  startIntervalTick(ms = 1000) {
    requestInterval(this.Tick.bind(this), ms);
  }

  Tick() {
    for (const sys of Array.from(this.systems)) {
      const entities = this.sys2entities.get(sys);
      sys.update(entities, this.worldCtx);
    }
  }

  getEntityCount() {
    return this.entityCount;
  }

  createEntity(...systems: [System, any[]][]): Entity {
    this.entityCount++;
    const entity = new Entity();
    systems.forEach(([system, params]) =>
      MainWorld.mountSystem(entity, system, ...params)
    );
    return entity;
  }

  mountSystem(entity: Entity, sys: System, ...params: any[]) {
    if (entity.hasSystem(sys)) {
      return;
    }
    // add to set
    this.systems.add(sys);
    const component = createObject(sys.createComponent(...params));
    const entities = this.sys2entities.get(sys) || [];
    this.sys2entities.set(sys, [...entities, entity]);
    entity.mountComponent(sys, component);
  }

  unmountSystem(entity: Entity, sys: System) {
    if (!entity.hasSystem(sys)) {
      return;
    }
    entity.unmountComponent(sys);
    const entities = this.sys2entities.get(sys) || [];
    const idx = entities.indexOf(entity);
    entities.splice(idx, 1);
    this.sys2entities.set(sys, [...entities]);
  }
}

export const MainWorld = new World();

class CountLogSystem implements System {
  createComponent(initialValue = 0) {
    return {
      count: initialValue,
    };
  }

  update(entities: Entity[], ctx) {
    entities.forEach(this.logmsg.bind(this));
  }

  logmsg(entity: Entity) {
    const component = entity.getComponent(this);
    console.log(component.count);
    entity.mountComponent(this, { count: component.count + 1 });
  }
}

const countSys = new CountLogSystem();

MainWorld.createEntity([countSys, [10]]);
MainWorld.createEntity([countSys, [5]]);
MainWorld.createEntity();

MainWorld.startIntervalTick();
