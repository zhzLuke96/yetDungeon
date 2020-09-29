import * as ROT from 'rot-js';
import { Game } from '../Game';
import { Screen } from './Screen';

export class StartScreen implements Screen {
  // constructor() {
  //
  // }

  exit() {
    console.log('Exited start screen.');
  }

  render(display: ROT.Display, game: Game) {
    // Render our prompt to the screen
    display.drawText(1, 1, '%c{yellow}Javascript Roguelike');
    display.drawText(1, 2, 'Press [Enter] to start!');
  }

  handleInput(inputType: string, inputData: any, game: Game) {
    // When [Enter] is pressed, go to the play screen
    if (inputType === 'keydown') {
      if (inputData.key === 'Enter') {
        game.dispatchEvent('goto_play_screen');
      }
    }
  }

  enter() {
    console.log('Entered start screen.');
  }
}
