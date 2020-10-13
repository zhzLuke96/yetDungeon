import ECS from './ECS';
import { positionSystem } from './systems/besic';
import { getRandomArrayElements } from './utils';
import * as ROT from 'rot-js';
import { Game, MainGame } from './game';
import { destructibleSystem } from './systems/being';

function GameDebuggerInit() {
  (window as any).debug = {
    createBeing(name: string, num = 1) {
      const player = ECS.MainWorld.getVal('player') as ECS.Entity;

      const { x, y, z } = player.getComponent(positionSystem)!;

      const points = getRandomArrayElements(
        ROT.DIRS[8],
        num
      ).map(([x1, y1]) => [x + x1, y + y1]);

      for (const [x1, y1] of points) {
        const being = Game.BeingRepository.create(name);
        being?.updateComponent(positionSystem, { x: x1, y: y1, z });
      }
    },
    updatePlayerComponent({ hp } = {} as any) {
      const player = ECS.MainWorld.getVal('player') as ECS.Entity;
      if (!player) {
        return;
      }
      if (!isNaN(hp)) {
        player.updateComponentKV(destructibleSystem, 'hp', Number(hp));
      }
    },
  };
}

GameDebuggerInit();
