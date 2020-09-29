import { configure, getLogger } from 'log4js';
import { loggerConfigure } from './const';

configure(loggerConfigure);

export const Logger = getLogger();
