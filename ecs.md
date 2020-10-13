# ECS

本来的有个非常好的选择，[ECSY](https://github.com/ecsyjs/ecsy)，是 Mozilla 为了 VR 游戏出的一个前端 ECS 库，非常强，有很多社区维护，和开发套件，甚至可以逐 Tick 调试 ecs 系统

但是问题就是有一定学习成本，如果针对rougelike游戏做封装，感觉不如自己搞一个简单的

于是就有了现在这套更简单的

如果非要说简单到哪里呢？看用法就知道了

# how to code

> src\Game\systems\besic.ts 1adc7dd832560563e53009a0047300fe764395e0

```ts
class PositionSystem extends ECS.System<{ x: number; y: number; z: number }> {
  createComponent(x = -1, y = -1, z = -1) {
    return {
      x,
      y,
      z,
    };
  }
}
export const positionSystem = new PositionSystem();
```

PositionSystem

createComponent 中定义组件原型

> src\Game\systems\being.ts 1adc7dd832560563e53009a0047300fe764395e0

```ts
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
    entity.addEventListener('moveto', (_, x: number, y: number, z: number) => {
      GlobalSounds.smallSlimeSound(x, y, z);
    });
  }
}
export const smallSlimeSystem = new SmallSlimeSystem();
```

mountEntity 里面定义一些初始化实体的行为，显而易见，事件调度是内化到我们的 ECS 之中的

也有 unmountEntity 入口，必要的时候需要添加销毁行为

> src\Game\systems\being.ts 1adc7dd832560563e53009a0047300fe764395e0

```ts
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
```

update 更新行为，entites 接收的是挂载了这个系统的实体集合

# System

这些就是基本的定义用法了，还是很简单的，整个 ECS 中其实就只有 E 和 S，component 完全弱化到了整个系统中，所以我们定义任何一个功能的时候，只用添加系统就行了

当然，显而易见的，system 在这里有很多形式

## tag system

```ts
class IsBeingSystem extends ECS.System<null> {}
export const isBeingSystem = new IsBeingSystem();
```

## only component system

> src\Game\systems\besic.ts 1adc7dd832560563e53009a0047300fe764395e0

```ts
class PositionSystem extends ECS.System<{ x: number; y: number; z: number }> {
  createComponent(x = -1, y = -1, z = -1) {
    return {
      x,
      y,
      z,
    };
  }
}
export const positionSystem = new PositionSystem();
```

## component actor system

> src\Game\systems\being.ts 1adc7dd832560563e53009a0047300fe764395e0

```ts
class DestructibleSystem extends ECS.System<{
  hp: number;
  maxHp: number;
  defense: number;
}> {
  createComponent(hp = 2, maxHp = 10, defense = 0) {
    // ...
  }

  update(entities: ECS.Entity[], ctx: Map<string, any>) {
    // ...
  }
}
```

## Component actor event system

> src\Game\systems\being.ts 1adc7dd832560563e53009a0047300fe764395e0

```ts
class FungusSystem extends ECS.System<{ growthsRemaining: number }> {
  createComponent(growthsRemaining = 5) {
    // ...
  }

  mountEntity(entity: ECS.Entity) {
    // ...
  }

  update(entities: ECS.Entity[], ctx: any) {
    // ...
  }
  // ...
}
```

等等也有其他的组合就不列举了

虽然和 ECS 解构的思想稍微有点背道而驰了，但是整体表现还是拥有更高的渲染性能和一定程度的解耦能力

(毕竟我引入 ecs 的初衷只是为了不用考虑一个逻辑判断应该放在哪个模块里，应该何时激活它)

# World

world 的概念其实就是 system manager，并且管理 tick，传递 context

## World context

update 中拿到的 world context 是一个 `Map<string,any>` 类型

```ts
update(entities: ECS.Entity[], ctx: Map<string,any>) {
  // ...
}
```

它的设置通过 world.setVal

```ts
const map = new GameMap();
MainWorld.setVal('map', map);
```

TODO:

- world context 类型推导

# Component

一个隐藏在系统中的幽灵

```ts
entities.forEach((entity) => {
  const { hp } = entity.getComponent(destructibleSystem)!;
  // ...
});
```

通过 entity.getComponent 获取已经挂载的 component 数据，当然是有可能为 null，必要的情况需要注意
