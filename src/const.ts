import { Configuration } from 'log4js';

export const loggerConfigure: Configuration = {
  appenders: {
    console: { type: 'console' },
    file: {
      type: 'file',
      filename: 'err.log',
      layout: { type: 'pattern', pattern: '%d{yyyyMMdd hh:mm:ss} [%p]' },
    },
    dayfile: { type: 'dateFile', filename: 'all.log', pattern: '.yyyyMMdd' },
  },
  categories: {
    default: { appenders: ['console', 'dayfile'], level: 'debug' },
    error: { appenders: ['console', 'dayfile'], level: 'error' },
  },
};
