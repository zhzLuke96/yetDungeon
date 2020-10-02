import { forIn } from 'lodash';
import * as ROT from 'rot-js';
import { Game } from '../game';
import { Screen } from './screen';

export class StartScreen implements Screen {
  // constructor() {
  //
  // }

  exit() {
    console.log('Exited start screen.');
  }

  render(display: ROT.Display, game: Game) {
    this.drawTitle(
      display,
      5,
      10,
      `.__ __    ___ ______      ___    __ __  ____    ____    ___   ___   ____  
      |  |  |  /  _]      |    |   \\  |  |  ||    \\  /    |  /  _] /   \\ |    \\ 
      |  |  | /  [_|      |    |    \\ |  |  ||  _  ||   __| /  [_ |     ||  _  |
      |  ~  ||    _]_|  |_|    |  D  ||  |  ||  |  ||  |  ||    _]|  O  ||  |  |
      |___, ||   [_  |  |      |     ||  :  ||  |  ||  |_ ||   [_ |     ||  |  |
      |     ||     | |  |      |     ||     ||  |  ||     ||     ||     ||  |  |
      |____/ |_____| |__|      |_____| \\__,_||__|__||___,_||_____| \\___/ |__|__|
                                                                                `
    );
  }

  private drawTitle(
    display: ROT.Display,
    startX: number,
    startY: number,
    title: string
  ) {
    const lines = title.split('\n');
    let i = 0;
    for (; i < lines.length; i++) {
      const line = lines[i];
      display.drawText(startX, startY + Number(i), `%c{yellow}${line}`);
    }
    display.drawText(startX + 4, startY + i + 2, 'Press [Enter] to start!');
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
