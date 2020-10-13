import { Repository } from './repository';
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
  batSystem,
  bigSlimeSystem,
  smallSlimeSystem,
  legsSystem,
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
      params: [5],
    },
    {
      system: perceptionSystem,
      params: [],
    },
    {
      system: messageLoggerSystem,
      params: [],
    },
    {
      system: legsSystem,
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
    { system: batSystem, params: [] },
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
      params: [10, 10],
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
    {
      system: legsSystem,
      params: [],
    },
  ])
);

BeingRepository.define(
  'BigSlime',
  new ECS.Assemblages([
    { system: bigSlimeSystem, params: [] },
    {
      system: descriptibleSystem,
      params: ['BigSlime', '大型史莱姆'],
    },
    {
      system: appearanceSystem,
      params: ['O', 'green'],
    },
    {
      system: destructibleSystem,
      params: [15, 15],
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

BeingRepository.define(
  'SmallSlime',
  new ECS.Assemblages([
    { system: smallSlimeSystem, params: [] },
    {
      system: descriptibleSystem,
      params: ['SmallSlime', '小型史莱姆'],
    },
    {
      system: appearanceSystem,
      params: ['o', 'green'],
    },
    {
      system: destructibleSystem,
      params: [5, 5],
    },
    {
      system: attackSystem,
      params: [1],
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
