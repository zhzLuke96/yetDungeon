import * as ROT from 'rot-js';
import { Game } from '../Game';

export interface Screen {
  enter: () => void;
  exit: () => void;
  render: (display: ROT.Display, game: Game) => void;
  handleInput: (inputType: string, inputData: any, game: Game) => void;
}
