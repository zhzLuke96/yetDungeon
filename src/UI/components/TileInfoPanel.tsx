// 显示tile详情
// 没选择的时候显示人物状态

import React, { useMemo, useState } from 'react';
import { useBusEffect } from '../EventBus';
import { Entity } from '../../Game/entity';
import { Tile } from '../../Game/tile';
import { Item } from '../../Game/item';

export const TileInfoPanel: React.FC = React.memo(() => {
  const [currentTile, setcurrentTile] = useState(null as null | Tile);
  const [currentEntity, setcurrentEntity] = useState(null as null | Entity);
  const [currentItems, setcurrentItems] = useState([] as Item[]);
  useBusEffect(
    '@gameMap/mouseOverOnTile',
    ({
      tile,
      entity,
      items,
    }: {
      tile: Tile;
      entity: Entity;
      items: Item[];
    }) => {
      setcurrentTile(tile);
      setcurrentEntity(entity);
      setcurrentItems(items);
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
      <div>
        {currentEntity?.properties?.describe ||
          currentTile?.properties?.describe}
      </div>
      <div>
        {!!currentItems.length && <div>🔸地上还有些...</div>}
        {currentItems?.map((item, idx) => (
          <div key={idx}>{item?.properties?.describe}</div>
        ))}
      </div>
    </div>
  );
});

TileInfoPanel.displayName = 'TileInfoPanel';
