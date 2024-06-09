require('dotenv').config();
const express = require('express');
const formidable = require('express-formidable');
const apiControllers = require('./src/controllers');
const StaticRedis = require('./src/common-modules/static-redis');
const CacheStaticRedis = require('./src/helepers/cache-redis/static-redis');
const {getLogger} = require('./src/log');
const dbServiceInstance = require('./src/services/db-service');

const log = getLogger('App');
const expressApp = express();
const PID = process.pid;

// 监听未捕获的异常
process.on('uncaughtException', (err) => {
  const errMsg = (err && typeof err === 'object') ? {
      message: err.message,
      name: err.name,
      stack: err.stack
  } : '';

  log.error('uncaughtException exception',
    ' ,err:', err,
    ' ,errMsg:', errMsg
  );
});

// 监听未捕获的异常
process.on('unhandledRejection', (err, promise) => {
  const errMsg = (err && typeof err === 'object') ? {
      message: err.message,
      name: err.name,
      stack: err.stack
  } : '';

  log.error('unhandledRejection exception',
    ' ,err:', err,
    ' ,promise:', promise,
    ' ,errMsg:', errMsg
  );
});

expressApp.use(formidable());
expressApp.use(apiControllers);

const {
  API_PORT,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWD,
  REDIS_DB
} = process.env;

const processDelayExit = (code=0) => {
  log.info('call processDelayExit, code:', code);
  setTimeout(() => {
    log.info('processDelayExit process.exit, code:', code);
    process.exit(code);
  }, 2000);
};

if (!API_PORT) {
  processDelayExit(1);
  throw new Error('.env is not exist or config err');
}

const initStaticRedis = () => {
  return new Promise((resolve, reject) => {
    global.staticRedis = new StaticRedis();
    global.cacheStaticRedis = new CacheStaticRedis(global.staticRedis);

    global.staticRedis.connect(
      REDIS_HOST,
      REDIS_PORT,
      REDIS_PASSWD,
      (error) => {
        if (error) {
          log.error('initStaticRedis error:', error);
          reject(error);
          return;
        }

        log.info('initStaticRedis success');
        resolve();
      },
      {
        db: REDIS_DB
      }
    );
  });
};

const runExpressServer = async () => {
  try {
    if (REDIS_HOST)
      await initStaticRedis();

    log.info('run expressServer API_PORT:', API_PORT, ' ,PID:', PID);

    const expressServer = expressApp.listen(API_PORT);

    expressServer.on('listening',  () => {
      log.info('recv server listening evt');

      dbServiceInstance.cleanExpiredSiteCounterIpRecords();
      setInterval(() => {
        dbServiceInstance.cleanExpiredSiteCounterIpRecords();
      }, 1000 * 60 * 60 * 24); // 每天清理一次过期的记录
    });

    expressServer.on('error', (err) => {
      log.error('recv server error evt, err:', err);
      processDelayExit(1);
    });
  }catch (err) {
    log.error('runExpressServer err:', err);
    processDelayExit(1);
  }
};

runExpressServer();