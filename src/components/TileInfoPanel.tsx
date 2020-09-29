// 显示tile详情
// 没选择的时候显示人物状态

import React, { useMemo, useState } from 'react';
import { useBusEffect } from '../EventBus';
import { Entity } from '../Game/map/Entity';
import { Tile } from '../Game/map/Tile';

export const TileInfoPanel: React.FC = React.memo(() => {
  const [currentTile, setcurrentTile] = useState(null as null | Tile);
  const [currentEntity, setcurrentEntity] = useState(null as null | Entity);
  useBusEffect(
    '@gameMap/mouseOverOnTile',
    ({ tile, entity }: { tile: Tile; entity: Entity }) => {
      setcurrentTile(tile);
      setcurrentEntity(entity);
    },
    []
  );
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        fontFamily: 'Consolas, monospace',
        fontWeight: 'bolder',
        padding: '0.5rem',
      }}
    >
      {currentEntity?.properties.describe || currentTile?.properties.describe}
    </div>
  );
});

TileInfoPanel.displayName = 'TileInfoPanel';
