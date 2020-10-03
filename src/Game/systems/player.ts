import ECS from '../ECS';
import { MainGame } from '../game';
import { descriptibleSystem } from './besic';

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
