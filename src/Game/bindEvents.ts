import { GlobalUIEvents } from '../UI/components/GlobalUIEvents';
import { Game, MainGame } from './game';
import * as _ from 'lodash';

window.addEventListener('load', initGameEvents);

function initGameEvents() {
  MainGame.addEventListener('goto_win_screen', () => {
    MainGame.switchScreen(Game.Screens.winScreen);
  });
  MainGame.addEventListener('goto_lose_screen', () => {
    MainGame.switchScreen(Game.Screens.loseScreen);
  });
  MainGame.addEventListener('goto_play_screen', () => {
    MainGame.switchScreen(Game.Screens.playScreen);
  });
  MainGame.addEventListener('goto_map_screen', () => {
    MainGame.switchScreen(Game.Screens.mapScreen);
  });
  MainGame.addEventListener('sendMessage', GlobalUIEvents.addLogs);
  MainGame.addEventListener('sendMessageNearby', GlobalUIEvents.addLogs);

  // 这里比较绕，主要是想维持现在的架构
  // 中间的传递和处理数据都通过evbus，如果改成realtime的甚至可以做队列出让这些事件的处理
  MainGame.addEventListener('mouseOverOnTile', GlobalUIEvents.mouseOverOnTile);

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
