const MAX_CACHE_DURATION = 10000;

class CacheStaticRedis {
  constructor (staticRedis) {
    this._cacheCammonds = {}; // { commondId: {args, onCbs?: [] } }
    this._cacheReqs = {}; // { commondId: {reqId, reqTs} }
    this._staticRedis = staticRedis;
  }

  destroy () {
    this._staticRedis = undefined;
    this._cacheCammonds = {};
  }

  hgetAsync (
    keyName,
    fieldName
  ) {
    return new Promise((resolve, reject) => {
      const commondId = 'hgetAsync:' + keyName + fieldName;
      const redisMethod = 'HGET';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, fieldName]);
      
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  hmgetAsync (
    keyName,
    fieldNames
  ) {
    return new Promise((resolve, reject) => {
      const commondId = 'hgetAsync:' + keyName + fieldNames.toString();
      const redisMethod = 'HMGET';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, fieldNames]);
      
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  hincrAsync (
    keyName,
    fieldName
  ) {
    return new Promise((resolve, reject) => {
      const commondId = 'hincrAsync:' + keyName + fieldName;
      const redisMethod = 'HINCRBY';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, fieldName, 0]);
      
      cacheCammond.args[cacheCammond.args.length -1] += 1;
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  hincrbyAsync (
    keyName,
    fieldName,
    incrNum
  ) {
    return new Promise((resolve, reject) => {
      const commondId = 'hincrbyAsync:' + keyName + fieldName;
      const redisMethod = 'HINCRBY';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, fieldName, 0]);
      
      cacheCammond.args[cacheCammond.args.length -1] += incrNum;
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  getAsync (keyName) {
    return new Promise((resolve, reject) => {
      const commondId = 'getAsync:' + keyName;
      const redisMethod = 'GET';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName]);
      
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  incrAsync (keyName) {
    return new Promise((resolve, reject) => {
      const commondId = 'incrAsync:' + keyName;
      const redisMethod = 'INCRBY';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, 0]);
      
      cacheCammond.args[cacheCammond.args.length -1] += 1;
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  incrbyAsync (keyName, incrNum) {
    return new Promise((resolve, reject) => {
      const commondId = 'incrbyAsync:' + keyName;
      const redisMethod = 'INCRBY';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, 0]);
      
      cacheCammond.args[cacheCammond.args.length -1] += incrNum;
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  setAsync (keyName, value, expire) {
    return new Promise((resolve, reject) => {
      const commondId ='setAsync:' + keyName;
      const redisMethod = 'SET';
      const cacheCammond = this._getOrInitCacheCommond(commondId, redisMethod, [keyName, value, -1]);
      
      cacheCammond.args[cacheCammond.args.length -2] = value;
      expire !== undefined && (cacheCammond.args[cacheCammond.args.length -1] = expire);
      cacheCammond.onCbs.push((err, res) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(res);
      });

      this._execCommond(commondId);
    });
  }

  _execCommond (commondId) {
    const cacheCammond = this._cacheCammonds[commondId];
    if (!cacheCammond)
      return;

    const nowTs = Date.now();
    const reqTs = this._cacheReqs[commondId] && this._cacheReqs[commondId].reqTs;
    
    if (reqTs && (nowTs - reqTs) < MAX_CACHE_DURATION)
      return;

    const {method, args, onCbs} = cacheCammond;
    delete this._cacheCammonds[commondId];
 
    const redisClient = this._staticRedis && this._staticRedis.getRedisClient();
    if (!redisClient || !redisClient[method])
      return;

    const reqId = nowTs + '_' + Math.random();
    this._cacheReqs[commondId] = {reqTs: nowTs, reqId};

    redisClient[method](...args, (err, ...resArgs) => {
      if (this._cacheReqs[commondId] && this._cacheReqs[commondId].reqId === reqId)
        delete this._cacheReqs[commondId];

      for (const onCb of onCbs) {
        try {
          onCb(err, ...resArgs);
        }catch (err) {
          console.error('_execCommond onCb err:', err);
        }
      }

      if (this._cacheCammonds[commondId])
        this._execCommond(commondId);
    });
  }

  _getOrInitCacheCommond (commondId, method, args) {
    let cacheCammond = this._cacheCammonds[commondId];
    if (!cacheCammond) {
      cacheCammond = {
        method,
        args,
        onCbs: []
      }

      this._cacheCammonds[commondId] = cacheCammond;
    }

    return cacheCammond;
  }
}

module.exports = CacheStaticRedis;