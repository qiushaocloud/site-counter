const express = require('express');
const formidable = require('express-formidable');
const apiControllers = require('./src/controllers');
const dotenv = require('dotenv');
const StaticRedis = require('./src/common-modules/static-redis');
const CacheStaticRedis = require('./src/helepers/cache-redis/static-redis');
const {getLogger} = require('./src/log');

const log = getLogger('App');
const expressApp = express();
dotenv.config();

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

if (!API_PORT) {
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
    });

    expressServer.on('error', (err) => {
      log.error('recv server error evt, err:', err);
    });
  }catch (err) {
    log.error('runExpressServer err:', err);
  }
};

runExpressServer();