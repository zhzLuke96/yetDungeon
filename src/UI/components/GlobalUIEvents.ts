import * as _ from 'lodash';
import { Item } from '../../Game/item';
import { Entity } from '../../Game/entity';
import { Tile } from '../../Game/tile';

const evType = (type: string) => `@root/${type}`;

const dispatch = (type: string, detail: any) => {
  window.dispatchEvent(new CustomEvent(evType(type), { detail }));
};

export const GlobalUIEvents = {
  addLogs(msg: string) {
    dispatch('@InfoPanel/addlogs', msg);
  },
  // containerMouseover: _.throttle((ev: MouseEvent) => {
  //   const { offsetX, offsetY } = ev;
  //   dispatch('@gameContainer/mouseover', { x: offsetX, y: offsetY });
  // }, 300),
  mouseOverOnTile(tile: Tile | null, entity: Entity | null, items: Item[]) {
    // console.log('@gameMap/mouseOverOnTile', { tile, entity });
    dispatch('@gameMap/mouseOverOnTile', { tile, entity, items });
  },
};
