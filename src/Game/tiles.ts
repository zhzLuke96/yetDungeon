import ECS from './ECS';
import {
  tileSystem,
  appearanceSystem,
  positionSystem,
  descriptibleSystem,
} from './systems/besic';

interface TitleProps {
  ch: string;
  fg: string;
  bg: string;
  diggable: boolean;
  walkable: boolean;
  blocksLight: boolean;
  describe: string;
}

const createTile = ({
  ch,
  fg,
  bg,
  diggable,
  walkable,
  blocksLight,
  describe,
}: Partial<TitleProps> = {}) =>
  new ECS.Assemblages([
    {
      system: appearanceSystem,
      params: [ch, fg, bg],
    },
    {
      system: tileSystem,
      params: [diggable, walkable, blocksLight],
    },
    {
      system: descriptibleSystem,
      params: [describe],
    },
  ]);

export const Tiles = {
  null: createTile().createInstance(),
  floor: createTile({
    ch: '.',
    diggable: false,
    walkable: true,
    blocksLight: false,
  }).createInstance(),
  wall: createTile({
    ch: '#',
    fg: 'goldenrod',
    walkable: false,
    diggable: true,
    blocksLight: true,
    describe: '粗糙的土墙，看起来坑坑洼洼',
  }).createInstance(),
  stairsUp: createTile({
    ch: '<',
    fg: 'white',
    walkable: true,
    blocksLight: false,
    describe: '向上的楼梯',
  }).createInstance(),
  stairsDown: createTile({
    ch: '>',
    fg: 'white',
    walkable: true,
    blocksLight: false,
    describe: '向下的楼梯',
  }).createInstance(),
};
