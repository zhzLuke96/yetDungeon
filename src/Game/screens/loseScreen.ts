import * as ROT from 'rot-js';
import { Game } from '../Game';
import { Screen } from './Screen';

export class LoseScreen implements Screen {
  // constructor() {
  //
  // }

  enter() {
    console.log('Entered lose screen.');
  }

  exit() {
    console.log('Exited lose screen.');
  }

  render(display: ROT.Display, game: Game) {
    // Render our prompt to the screen
    for (let i = 0; i < 22; i++) {
      display.drawText(2, i + 1, '%b{red}You lose! :(');
    }
  }

  handleInput(inputType: string, inputData: any, game: Game) {
    // Nothing to do here
  }
}
