const redis = require('redis');
const {getLogger} = require('../log');
const log = getLogger('RedisManager');

class StaticRedis {
  constructor() {
    this._classId = 'srs_' + Date.now() + '_' + Math.random();
    this._redisClient = undefined;
    this.onRedisClientChanged = undefined;
  }

  getRedisClient() {
    return this._redisClient;
  }

  destroy() {
    this._printLog('info', 'call destroy');

    this.onRedisClientChanged = undefined;
    this._destroyRedisClient();
  }

  connect(
    host,
    port = 6379,
    password = '',
    onCallback = undefined,
    extendOpts = {}
  ) {
    this._printLog('info', 'call connect');

    this._connect(
      host,
      port,
      password,
      onCallback,
      extendOpts
    );
  }

  _connect(
    host,
    port = 6379,
    password = '',
    onCallback = undefined,
    extendOpts = {}
  ) {
    this._printLog('info', 'exec _connect',
      host, port, password, !!onCallback, extendOpts,
      ' ,hasRedisClient:', !!this._redisClient
    );
    
    if (this._redisClient) {
      this._printLog('info', 'connect redis, but redisClient is exist, need exec _destroyRedisClient',
        host, port, password
      );

      this._destroyRedisClient();
    }

    const opt = {
        host: host,
        port: port
    };

    if (password !== undefined && password !== null && password !== '')
        opt.password = password;

    if (extendOpts && typeof extendOpts.renameCommands === 'object') {
      for (const key in extendOpts.renameCommands) {
        const val = extendOpts.renameCommands[key];
        if (val === undefined)
          continue;

        if (!opt.rename_commands)
            opt.rename_commands = {};

        opt.rename_commands[key] = val;
      }
    }

    if (extendOpts && extendOpts.db !== undefined)
      opt.db = extendOpts.db;

    this._printLog('info', 'create client opt:', opt);
    this._redisClient = redis.createClient(opt);

    this._redisClient.on('ready', () => {
      if (this._redisClient && this._redisClient._failTimer) {
        clearTimeout(this._redisClient._failTimer);
        this._redisClient._failTimer = undefined;
      }

      this._printLog('info', 'connect redis ready');

      onCallback && onCallback(undefined, this._redisClient);
    });

    this._redisClient.on('error', (error) => {
      if (typeof error === 'object' && error.code === 'ERR') {
        this._printLog('error', 'listen redis error:', error);
        return;
      }

      this._printLog('error', 'connect redis error:', error);
      
      onCallback && onCallback(error, undefined);

      if (this._redisClient) {
        this._redisClient._failTimer && clearTimeout(this._redisClient._failTimer);
        this._redisClient._failTimer = setTimeout(() => {
          this._printLog('warn', 'Redis fails for more than 10 minutes without reconnecting and reinitializing the redis client');

          if (this._redisClient && this._redisClient._failTimer) {
            clearTimeout(this._redisClient._failTimer);
            this._redisClient._failTimer = undefined;
          }

          this._destroyRedisClient();

          this._connect(
            host,
            port,
            password,
            onCallback,
            extendOpts
          );

          this.onRedisClientChanged && this.onRedisClientChanged();
        }, 10 * 60 * 1000);
      }
    });
  }

  _destroyRedisClient() {
    this._printLog('info', 'exec _destroyRedisClient, hasRedisClient:', !!this._redisClient);

    try {
      if (this._redisClient) {
        this._redisClient.removeAllListeners();
        this._redisClient.quit();
      }

      this._redisClient = undefined;
    }catch (error) {
      this._printLog('error', '_destroyRedisClient:redis quit error:', error);

      this._redisClient = undefined;
    }
  }

  _printLog (method, ...args) {
    if (log[method]) {
      log[method]('StaticRedis --> ', ...args, ' ,classId:', this._classId);
      return;
    }

    log.error(
      new Error('error stack').stack, '\r\n[logerror] logInstance not find method, methodName:' + method,
      'StaticRedis --> ', ...args,
      ' ,classId:', this._classId
    );
  }
}

module.exports = StaticRedis;