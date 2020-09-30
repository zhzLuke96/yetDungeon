import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'normalize.css';

import React, { useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';
import { GlobalStyle } from './GlobalStyle';
import { BusStop, useBusCallback, useBusState } from './EventBus';
import { TileInfoPanel } from './components/TileInfoPanel';
import { MainGame } from '../Game/game';
import { BasePanel } from './components/basePanel';
import styled from 'styled-components';
import { LogsPanel } from './components/logsPanel';

const mainElement = document.createElement('div');
mainElement.setAttribute('id', 'root');
document.body.appendChild(mainElement);

const App = () => {
  return (
    <>
      <GlobalStyle />
      <BusStop name={'root'}>
        <AppLayout />
      </BusStop>
    </>
  );
};

window.addEventListener('load', () => {
  render(<App />, mainElement);
});

const AppLayout = React.memo(() => {
  const ref = useRef(null as null | HTMLDivElement);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const game = MainGame;
    game.appendToElement(ref.current);
  }, [ref.current]);
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ flex: 8 }}>
        <RowColumn>
          <div style={{ flex: 1, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              }}
              ref={ref}
            >
              {''}
            </div>
          </div>
          <BasePanel style={{ height: '15rem' }} title="Logs">
            <LogsPanel />
          </BasePanel>
        </RowColumn>
      </div>
      <div style={{ flex: 2, position: 'relative' }}>
        <RowColumn>
          <BasePanel style={{ height: '20rem' }} title="What is">
            <TileInfoPanel />
          </BasePanel>
          <BasePanel title="Player"></BasePanel>
          <BasePanel title="Weapons"></BasePanel>
          <BasePanel title="Inventory"></BasePanel>
          <BasePanel title="Actions"></BasePanel>
        </RowColumn>
      </div>
    </div>
  );
});

AppLayout.displayName = 'AppLayout';

const RowColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;
