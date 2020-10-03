import { Entity, EntityProperties } from './entity';
import { Repository } from './repository';
import { Mixins } from './mixins';
import ECS from './ECS';
import {
  appearanceSystem,
  descriptibleSystem,
  positionSystem,
} from './systems/besic';
import {
  attackSystem,
  destructibleSystem,
  fungusSystem,
  movementSystem,
  perceptionSystem,
  playerSystem,
  sightSystem,
} from './systems/being';
import { messageLoggerSystem } from './systems/player';

// 👇 beings 👇

export const createPlayer = () =>
  new ECS.Assemblages([
    { system: playerSystem, params: [] },
    {
      system: descriptibleSystem,
      params: ['you', '这就是你，兄弟！'],
    },
    {
      system: appearanceSystem,
      params: ['@', 'white', 'black'],
    },
    {
      system: sightSystem,
      params: [15],
    },
    {
      system: positionSystem,
      params: [], // [-1,-1,-1]
    },
    {
      system: destructibleSystem,
      params: [40, 40],
    },
    {
      system: attackSystem,
      params: [10],
    },
    {
      system: perceptionSystem,
      params: [],
    },
    {
      system: messageLoggerSystem,
      params: [],
    },
  ]).createInstance('player');

// BeingRepository

export const BeingRepository = new Repository(
  'entities',
  (beingAssemblages: ECS.Assemblages) => beingAssemblages.createInstance()
);

BeingRepository.define(
  'fungus',
  new ECS.Assemblages([
    {
      system: descriptibleSystem,
      params: ['Fungus', '🌱藤曼，它在地牢疯狂生长'],
    },
    {
      system: appearanceSystem,
      params: ['F', 'green'],
    },
    {
      system: positionSystem,
      params: [], // [-1,-1,-1]
    },
    {
      system: destructibleSystem,
      params: [10, 10],
    },
    {
      system: fungusSystem,
      params: [5],
    },
    {
      system: perceptionSystem,
      params: [],
    },
  ])
);
BeingRepository.define(
  'Bat',
  new ECS.Assemblages([
    {
      system: descriptibleSystem,
      params: ['Bat', '🦇蝙蝠，没什么攻击性'],
    },
    {
      system: appearanceSystem,
      params: ['B', 'white'],
    },
    {
      system: destructibleSystem,
      params: [3, 3],
    },
    {
      system: attackSystem,
      params: [2],
    },
    {
      system: movementSystem,
      params: ['random'],
    },
    {
      system: perceptionSystem,
      params: [],
    },
  ])
);
BeingRepository.define(
  'Newt',
  new ECS.Assemblages([
    {
      system: descriptibleSystem,
      params: ['Newt', '🦎一种地牢里独特的爬虫'],
    },
    {
      system: appearanceSystem,
      params: [':', 'yellow'],
    },
    {
      system: destructibleSystem,
      params: [5, 5],
    },
    {
      system: attackSystem,
      params: [4],
    },
    {
      system: movementSystem,
      params: ['random'],
    },
    {
      system: perceptionSystem,
      params: [],
    },
  ])
);
