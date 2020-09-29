import * as _ from 'lodash';
import { Entity } from '../Game/map/Entity';
import { Tile } from '../Game/map/Tile';

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
  mouseOverOnTile(tile: Tile | null, entity: Entity | null) {
    // console.log('@gameMap/mouseOverOnTile', { tile, entity });
    dispatch('@gameMap/mouseOverOnTile', { tile, entity });
  },
};
