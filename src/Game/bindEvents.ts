import { GlobalUIEvents } from '../components/GlobalUIEvents';
import { MainGame } from './Game';
import { loseScreen, winScreen, playScreen } from './screens';
import * as _ from 'lodash';

window.addEventListener('load', initGameEvents);

function initGameEvents() {
  MainGame.addEventListener('goto_win_screen', () => {
    MainGame.switchScreen(winScreen);
  });
  MainGame.addEventListener('goto_lose_screen', () => {
    MainGame.switchScreen(loseScreen);
  });
  MainGame.addEventListener('goto_play_screen', () => {
    MainGame.switchScreen(playScreen);
  });
  MainGame.addEventListener('sendMessage', GlobalUIEvents.addLogs);
  MainGame.addEventListener('sendMessageNearby', GlobalUIEvents.addLogs);

  // bind mouse events
  const container = MainGame.getDisplay().getContainer();
  if (!container) {
    return;
  }
  // container.addEventListener('mouseover', GlobalUIEvents.containerMouseover);
  container.addEventListener(
    'mousemove',
    _.throttle((ev) => {
      const { offsetX, offsetY } = ev;
      MainGame.dispatchMouseOverTilePosition(offsetX, offsetY);
    }, 100)
  );
}
