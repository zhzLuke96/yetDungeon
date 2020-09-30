import { Entity, EntityProperties } from './entity';
import { Repository } from './repository';
import { Mixins } from './mixins';

const {
  PlayerActor,
  FungusActor,
  WanderActor,
  Destructible,
  Attacker,
  MessageRecipient,
  Sight,
  InventoryHolder,
  WalkSpeaker,
} = Mixins;

// 👇 entitys 👇

const PlayerConstructor = WalkSpeaker(
  InventoryHolder(
    Sight(MessageRecipient(Destructible(Attacker(PlayerActor(Entity)))))
  )
);
export const createPlayer = () =>
  new PlayerConstructor({
    character: '@',
    foreground: 'white',
    background: 'black',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 6,
    describe: '这就是你，兄弟！',
    walkAudios: [
      require('./assets/sounds/step/sand1.ogg'),
      require('./assets/sounds/step/sand2.ogg'),
      require('./assets/sounds/step/sand3.ogg'),
      require('./assets/sounds/step/sand4.ogg'),
      require('./assets/sounds/step/sand5.ogg'),
    ],
  });
export type Player = ReturnType<typeof createPlayer>;

const FungusConstructor = MessageRecipient(Destructible(FungusActor(Entity)));
export const createFungus = () =>
  new FungusConstructor({
    name: 'Fungus',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    describe: '🌱藤曼，它在地牢疯狂生长',
  });
export type Fungus = ReturnType<typeof createFungus>;

const BatConstructor = WanderActor(Destructible(Attacker(Entity)));
export const createBat = () =>
  new BatConstructor({
    name: 'Bat',
    character: 'B',
    foreground: 'white',
    maxHp: 5,
    attackValue: 4,
    describe: '🦇蝙蝠，没什么攻击性',
  });
export type Bat = ReturnType<typeof createBat>;

const NewtConstructor = WanderActor(Destructible(Attacker(Entity)));
export const createNewt = () =>
  new NewtConstructor({
    name: 'Newt',
    character: ':',
    foreground: 'yellow',
    maxHp: 3,
    attackValue: 2,
    describe: '🦎一种地牢里独特的爬虫',
  });
export type Newt = ReturnType<typeof createNewt>;

// 👇EntityRepository👇

export const EntityRepository = new Repository(
  'entities',
  (creator: () => Entity) => creator()
);

EntityRepository.define('fungus', createFungus);
EntityRepository.define('Bat', createBat);
EntityRepository.define('Newt', createNewt);
