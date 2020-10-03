// 显示tile详情
// 没选择的时候显示人物状态

import React, { useMemo, useState } from 'react';
import { useBusEffect } from '../EventBus';
import ECS from '../../Game/ECS';
import { descriptibleSystem, positionSystem } from '../../Game/systems/besic';

export const TileInfoPanel: React.FC = React.memo(() => {
  const [currentTile, setcurrentTile] = useState(null as null | ECS.Entity);
  const [currentEntity, setcurrentEntity] = useState(null as null | ECS.Entity);
  const [currentItems, setcurrentItems] = useState([] as ECS.Entity[]);
  useBusEffect(
    '@gameMap/mouseOverOnTile',
    ({
      tile,
      entity,
      items,
    }: {
      tile: ECS.Entity;
      entity: ECS.Entity;
      items: ECS.Entity[];
    }) => {
      setcurrentTile(tile);
      setcurrentEntity(entity);
      setcurrentItems(items);
    },
    []
  );

  const entityDescription = useMemo(() => {
    if (!currentEntity) {
      return '';
    }
    const { description } = currentEntity.getComponent(descriptibleSystem)!;
    return description;
  }, [currentEntity]);
  const tileDescription = useMemo(() => {
    if (!currentTile) {
      return '';
    }
    const { description } = currentTile.getComponent(descriptibleSystem)!;
    return description;
  }, [currentTile]);
  const itemsDescription = useMemo(() => {
    if (!currentItems || currentItems.length === 0) {
      return [];
    }
    return currentItems.map((item) => {
      const { description, name } = item.getComponent(descriptibleSystem)!;
      return [description, name];
    });
  }, [currentItems]);
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
      <div>{entityDescription || tileDescription}</div>
      <div>
        {!!itemsDescription.length && <div>🔸地上还有些...</div>}
        {itemsDescription?.map(([description], idx) => (
          <div key={idx}>{description}</div>
        ))}
      </div>
    </div>
  );
});

TileInfoPanel.displayName = 'TileInfoPanel';
