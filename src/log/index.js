const utils = require('../helepers/utils');

const LOG_LEVEL_MAP = {
  TRACE: 1,
  DEBUG: 2,
  LOG: 3,
  INFO: 4,
  WARN: 5,
  ERROR: 6,
  FATAL: 7,
  NONE: 8
};

class Log {
  logLevel = 'DEBUG';
  logLevelInt = LOG_LEVEL_MAP.DEBUG;

  constructor (logLevel) {
    if (logLevel !== undefined && LOG_LEVEL_MAP[logLevel] === undefined) {
      this.logLevel = logLevel;
      this.logLevelInt = LOG_LEVEL_MAP[logLevel];
    }
  }

  setLogLevel (logLevel) {
    if (LOG_LEVEL_MAP[logLevel] === undefined)
      return;

    this.logLevel = logLevel;
    this.logLevelInt = LOG_LEVEL_MAP[logLevel];
  }

  trace (...args) {
    if (this.logLevelInt > LOG_LEVEL_MAP.DEBUG)
      return;

    console.trace(
      utils.getCurrFormatTs(),
      'DEBUG',
      ...args,
      new Error('err stack').stack
    );
  }

  debug (...args) {
    if (this.logLevelInt > LOG_LEVEL_MAP.DEBUG)
      return;

    console.debug(utils.getCurrFormatTs(), 'DEBUG', ...args);
  }

  log (...args) {
    console.log(utils.getCurrFormatTs(), 'LOG', ...args);
  }

  info (...args) {
    console.info(utils.getCurrFormatTs(), 'INFO', ...args);
  }

  warn (...args) {
    console.warn(utils.getCurrFormatTs(), 'WARN', ...args);
  }

  error (...args) {
    console.error(utils.getCurrFormatTs(), 'ERROR', ...args);
  }

  fatal (...args) {
    console.fatal(utils.getCurrFormatTs(), 'FATAL', ...args);
  }

  _printLog (method, ...args) {
    const methodUpperCase = method.toUpperCase();
 
    if (this.logLevelInt > LOG_LEVEL_MAP[methodUpperCase])
      return;

    if (method === 'trace') {
      console.trace(
        utils.getCurrFormatTs(),
        methodUpperCase,
        ...args,
        new Error('err stack').stack
      );

      return;
    }

    console[method](
      utils.getCurrFormatTs(),
      methodUpperCase,
      ...args
    );
  }
}

const logInstances = {};
const logLevelConfig = {};

const getLogger = (loggerCategoryName, logLevel) => {
  let logInstance = logInstances[loggerCategoryName];

  if (!logInstance) {
    if (logLevel !== undefined && LOG_LEVEL_MAP[logLevel] === undefined)
      logLevelConfig[loggerCategoryName] = logLevel;

    logInstance = new Log(logLevelConfig[loggerCategoryName]);
    logInstances[loggerCategoryName] = logInstance;
  }

  return logInstance;
}

const updateCategoryLogLevel = (logLevel) => {
  if (LOG_LEVEL_MAP[logLevel] === undefined)
    return;

  const logInstance = logInstances[loggerCategoryName];
  if (!logInstance)
    return;

  logLevelConfig[loggerCategoryName] = logLevel;
  logInstance.setLogLevel(logLevel);  
}

const initLogLevelConfig = (logLevelConfigArg) => {
  for (const key in logLevelConfigArg) {
    const logLevel = logLevelConfigArg[key];
    if (LOG_LEVEL_MAP[logLevel] === undefined)
      continue;

    logLevelConfig[key] = val;
  }
};

module.exports = {
  getLogger,
  updateCategoryLogLevel,
  initLogLevelConfig
};