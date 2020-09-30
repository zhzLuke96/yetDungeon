import { Tile } from './tile';

export const Tiles = {
  null: new Tile(),
  floor: new Tile({
    character: '.',
    walkable: true,
    blocksLight: false,
    describe: '平整的地面，看上去平淡无奇',
  }),
  wall: new Tile({
    character: '#',
    foreground: 'goldenrod',
    diggable: true,
    describe: '粗糙的土墙，看起来坑坑洼洼',
  }),
  stairsUp: new Tile({
    character: '<',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    describe: '向上的楼梯',
  }),
  stairsDown: new Tile({
    character: '>',
    foreground: 'white',
    walkable: true,
    blocksLight: false,
    describe: '向下的楼梯',
  }),
};
