import { forIn } from 'lodash';
import * as ROT from 'rot-js';
import { Game } from '../game';
import { MainWorldMap } from '../worldMap/worldMap';
import { Screen } from './screen';

const noise = new ROT.Noise.Simplex(2048);

const sigmoid = (t: number) => 1 / (1 + Math.exp(-t));

const getRegionColor = (h: number) => {
  if (h < 0.3) return 'rgb(65, 104, 193)';
  if (h < 0.4) return 'rgb(67, 101, 181)';
  if (h < 0.45) return 'rgb(207, 209, 123)';
  if (h < 0.55) return 'rgb(84, 149, 22)';
  if (h < 0.6) return 'rgb(65, 107, 19)';
  if (h < 0.7) return 'rgb(93, 68, 63)';
  if (h < 0.9) return 'rgb(76, 60, 58)';
  return 'rgb(255, 255, 255)';
};

const colors = [
  'rgb(65, 104, 193)',
  'rgb(67, 101, 181)',
  'rgb(207, 209, 123)',
  'rgb(84, 149, 22)',
  'rgb(65, 107, 19)',
  'rgb(93, 68, 63)',
  'rgb(76, 60, 58)',
  'rgb(255, 255, 255)',
];

export class MapScreen implements Screen {
  private x = 50;
  private y = 50;

  private max = 4;
  private min = -2;
  // constructor() {
  //
  // }

  exit() {
    console.log('Exited start screen.');
  }

  render(display: ROT.Display, game: Game) {
    const h = game.getScreenHeight();
    const w = game.getScreenWidth();
    this.drawMap(display, h, w);

    display.drawText(0, h, '[ECS] to back.[Enter] random map. [↑↓←→] to move.');
  }

  drawMap(display: ROT.Display, h: number, w: number) {
    const [max, min] = [this.max, this.min];
    const map = MainWorldMap.getNormalizationMap(
      this.x,
      this.y,
      this.x + w,
      this.y + h,
      max,
      min
      // [0.3, 0.4, 0.45, 0.55, 0.6, 0.7, 0.9]
    );

    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const val = map[j][i];
        const blockVal = ~~(val * 36);
        display.draw(
          i,
          j,
          blockVal.toString(36),
          'black',
          // 'rgb(' + r + ',' + r + ',' + r + ',' + r + ')'
          getRegionColor(val)
          // colors[val]
        );
      }
    }
  }

  handleInput(inputType: string, inputData: any, game: Game) {
    // When [Enter] is pressed, go to the play screen
    if (inputType === 'keydown') {
      console.log(inputData.key);
      // if (inputData.key === '+') {
      //   // game.dispatchEvent('goto_play_screen');
      //   if (this.scale > 1) {
      //     this.scale = ~~(this.scale + 1);
      //   } else {
      //     this.scale += 0.1;
      //   }
      //   game.refresh();
      // }
      // if (inputData.key === '-') {
      //   if (this.scale > 1) {
      //     this.scale = ~~(this.scale - 1);
      //   } else {
      //     this.scale = Math.max(0.1, this.scale - 0.1);
      //   }
      //   game.refresh();
      // }
      if (inputData.key === 'ArrowUp') {
        this.y--;
        game.refresh();
      }
      if (inputData.key === 'ArrowDown') {
        this.y++;
        game.refresh();
      }
      if (inputData.key === 'ArrowLeft') {
        this.x--;
        game.refresh();
      }
      if (inputData.key === 'ArrowRight') {
        this.x++;
        game.refresh();
      }
      if (inputData.key === 'Enter') {
        MainWorldMap.updateSeed(Math.floor(Math.random() * 65535));
        game.refresh();
      }
      if (inputData.key === 'Escape') {
        game.dispatchEvent('goto_start_screen');
      }
    }
  }

  enter() {
    console.log('Entered start screen.');
  }
}
