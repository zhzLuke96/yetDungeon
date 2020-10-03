import ECS from './ECS';
import { Repository } from './repository';
import {
  appearanceSystem,
  descriptibleSystem,
  itemSystem,
} from './systems/besic';

export const ItemRepository = new Repository(
  'items',
  (itemAssemblages: ECS.Assemblages) => itemAssemblages.createInstance()
);

ItemRepository.define(
  'apple',
  new ECS.Assemblages([
    {
      system: itemSystem,
      params: ['apple'],
    },
    {
      system: appearanceSystem,
      params: ['%', 'red'],
    },
    {
      system: descriptibleSystem,
      params: ['apple', '🍎苹果，吃了可以饱腹'],
    },
  ])
);

ItemRepository.define(
  'apple',
  new ECS.Assemblages([
    {
      system: itemSystem,
      params: ['rock'],
    },
    {
      system: appearanceSystem,
      params: ['*', 'white'],
    },
    {
      system: descriptibleSystem,
      params: ['rock', '一块小石头'],
    },
  ])
);
