import * as path from 'path';

import React, { useMemo, useState } from 'react';
import { useBusEffect } from '../../EventBus';

interface TabType {
  dirpath: string;
  tags?: string[];
}

export const InfoPanel: React.FC = React.memo(() => {
  const [history, sethistory] = useState([] as string[]);
  useBusEffect(
    '@InfoPanel/addhistory',
    (msg: string) => {
      if (history.length >= 100) {
        history.shift();
      }
      sethistory([...history, msg]);
    },
    [sethistory, history]
  );
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {[...history].reverse().map((t, idx) => (
        <p key={idx}>{t}</p>
      ))}
    </div>
  );
});

InfoPanel.displayName = 'InfoPanel';
