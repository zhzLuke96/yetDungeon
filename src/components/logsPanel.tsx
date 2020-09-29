// 显示事件记录
import * as path from 'path';

import React, { useMemo, useState } from 'react';
import { useBusEffect } from '../EventBus';

interface TabType {
  dirpath: string;
  tags?: string[];
}

export const LogsPanel: React.FC = React.memo(() => {
  const [logs, setlogs] = useState([] as string[]);
  const [logsMax, setLogsMax] = useState(256);
  useBusEffect(
    '@InfoPanel/addlogs',
    (msg: string) => {
      if (logs.length >= logsMax) {
        logs.shift();
      }
      setlogs([...logs, msg]);
    },
    [setlogs, logs, logsMax]
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
      {[...logs].reverse().map((t, idx) => (
        <p key={idx}>{t}</p>
      ))}
    </div>
  );
});

LogsPanel.displayName = 'LogsPanel';
