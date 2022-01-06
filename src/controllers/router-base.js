const crypto = require('crypto');
const express = require('express');
const router = express.Router();

const {
  API_SIGN_SECRET_KEY = 'QIU_SHAO_CLOUD_SECRET_KEY',
  API_SIGN_KEY_NAME = 'sign',
  API_SIGN_NONCE_TS_KEY_NAME = 'nonce_ts'
} = process.env;

const CHECK_CACHE_SIGN_INTERVAL = 30 * 60 * 1000;
const MAX_SAVE_SIGN_DURATION = 4 * CHECK_CACHE_SIGN_INTERVAL;

const cacheSigns = {};
const runApiTs = Date.now();
let apiCount = 0;
let oldCheckCacheSignTs = 0;

const generateExpressReqInfo = (expressReq) => {
  const {
    ip,
    method,
    query,
    body,
    fields
  } = expressReq;

  const reqInfo = {
    ip,
    method: method.toLowerCase(),
    query,
    body,
    fields
  };
  return reqInfo;
};

const productGetRouter = (
  router,
  apiUrl,
  onCallback,
  options = {}
) => {
  const {
    allowOrigin = true
  } = options;

  router.get(apiUrl, (expressReq, expressRes) => {
    if (allowOrigin) {
        expressRes.header('Access-Control-Allow-Credentials', 'true'); // 服务端允许携带cookie
        expressRes.header('Access-Control-Allow-Origin', expressReq.headers.origin); // 允许的访问域
        expressRes.header('Access-Control-Allow-Headers', 'X-Requested-With'); // 访问头
        expressRes.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS'); // 访问方法
        expressRes.header('X-Powered-By', ' Express');
        // expressRes.header('Content-Type', 'application/json;charset=utf-8');
    }

    if (expressReq.method === 'OPTIONS') {
        expressRes.header('Access-Control-Max-Age', '86400');
        expressRes.sendStatus(204); // 让options请求快速返回.
        return;
    }

    onCallback(runApiTs + '_' + (++apiCount), expressReq, expressRes);
  });
};

const productPostRouter = (
  router,
  apiUrl,
  onCallback,
  options = {}
) => {
  const {
    allowOrigin = true
  } = options;

  router.post(apiUrl, (expressReq, expressRes) => {
    if (allowOrigin) {
        expressRes.header('Access-Control-Allow-Credentials', 'true'); // 服务端允许携带cookie
        expressRes.header('Access-Control-Allow-Origin', expressReq.headers.origin); // 允许的访问域
        expressRes.header('Access-Control-Allow-Headers', 'X-Requested-With'); // 访问头
        expressRes.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS'); // 访问方法
        expressRes.header('X-Powered-By', ' Express');
        // expressRes.header('Content-Type', 'application/json;charset=utf-8');
    }

    if (expressReq.method === 'OPTIONS') {
        expressRes.header('Access-Control-Max-Age', '86400');
        expressRes.sendStatus(204); // 让options请求快速返回.
        return;
    }

    onCallback(runApiTs + '_' + (++apiCount), expressReq, expressRes);
  });
};

const productPutRouter = (
  router,
  apiUrl,
  onCallback,
  options = {}
) => {
  const {
    allowOrigin = true
  } = options;

  router.put(apiUrl, (expressReq, expressRes) => {
    if (allowOrigin) {
        expressRes.header('Access-Control-Allow-Credentials', 'true'); // 服务端允许携带cookie
        expressRes.header('Access-Control-Allow-Origin', expressReq.headers.origin); // 允许的访问域
        expressRes.header('Access-Control-Allow-Headers', 'X-Requested-With'); // 访问头
        expressRes.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS'); // 访问方法
        expressRes.header('X-Powered-By', ' Express');
        // expressRes.header('Content-Type', 'application/json;charset=utf-8');
    }

    if (expressReq.method === 'OPTIONS') {
        expressRes.header('Access-Control-Max-Age', '86400');
        expressRes.sendStatus(204); // 让options请求快速返回.
        return;
    }

    onCallback(runApiTs + '_' + (++apiCount), expressReq, expressRes);
  });
};

const productGetAndPostRouter = (
  router,
  apiUrl,
  onCallback,
  options = {}
) => {
  const {
    allowOrigin = true
  } = options;

  router.get(apiUrl, (expressReq, expressRes) => {
    if (allowOrigin) {
        expressRes.header('Access-Control-Allow-Credentials', 'true'); // 服务端允许携带cookie
        expressRes.header('Access-Control-Allow-Origin', expressReq.headers.origin); // 允许的访问域
        expressRes.header('Access-Control-Allow-Headers', 'X-Requested-With'); // 访问头
        expressRes.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS'); // 访问方法
        expressRes.header('X-Powered-By', ' Express');
        // expressRes.header('Content-Type', 'application/json;charset=utf-8');
    }

    if (expressReq.method === 'OPTIONS') {
        expressRes.header('Access-Control-Max-Age', '86400');
        expressRes.sendStatus(204); // 让options请求快速返回.
        return;
    }

    onCallback(runApiTs + '_' + (++apiCount), expressReq, expressRes);
  });

  router.post(apiUrl, (expressReq, expressRes) => {
    if (allowOrigin) {
        expressRes.header('Access-Control-Allow-Credentials', 'true'); // 服务端允许携带cookie
        expressRes.header('Access-Control-Allow-Origin', expressReq.headers.origin); // 允许的访问域
        expressRes.header('Access-Control-Allow-Headers', 'X-Requested-With'); // 访问头
        expressRes.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS'); // 访问方法
        expressRes.header('X-Powered-By', ' Express');
        // expressRes.header('Content-Type', 'application/json;charset=utf-8');
    }

    if (expressReq.method === 'OPTIONS') {
        expressRes.header('Access-Control-Max-Age', '86400');
        expressRes.sendStatus(204); // 让options请求快速返回.
        return;
    }

    onCallback(runApiTs + '_' + (++apiCount), expressReq, expressRes);
  });
};

const getReqParams = (
  expressReq,
  key
) => {
  const {
    method,
    query,
    body,
    fields
  } = expressReq;

  const reqMethod = method.toLowerCase();

  if (reqMethod === 'get') {
    const val = (query ? query[key] : undefined);
    if (val !== undefined)
      return val;

    return (body ? body[key] : undefined);
  }
  else if (reqMethod === 'post') {
    let val = (body ? body[key] : undefined);
    if (val !== undefined)
      return val;

    val = (fields ? fields[key] : undefined);
    if (val !== undefined)
      return val;

    return (query ? query[key] : undefined);
  }
};

const getAllReqParams = (expressReq) => {
  const {
    query,
    body,
    fields
  } = expressReq;

  return Object.assign({}, query || {}, fields || {}, body || {});
};


function customEncrypt (str, secretKey, customEncryptTs) {
  ranNum = customEncryptTs ? Number(customEncryptTs) : 1234567890123;

  for (var i = 0; i < str.length; i++) {
    var character = str.charCodeAt(i);
    var charIndex = character%secretKey.length;
    var secretCode = secretKey.charCodeAt(character%secretKey.length);
    ranNum += (character * charIndex * (secretCode + character) + (ranNum % character));
  }

  return customEncryptTs+'_'+ranNum;
}

const getApiSign = (
  requestData,
  secretKey,
  signKeyName,
  nonceTsKeyName,
  isCustomEncrypt
) => {
  const keys = Object.keys(requestData).sort();
  let sign = '';

  for (const key of keys) {
    if (
      requestData[key] === undefined
      || (signKeyName && key === signKeyName)
    ) {
      continue;
    }

    sign += (key + requestData[key]);
  }

  if (isCustomEncrypt)
    return customEncrypt(sign, secretKey, nonceTsKeyName ? requestData[nonceTsKeyName] : undefined);

  sign += secretKey;

  return crypto.createHash('SHA256').update(sign).digest('hex');
}

const checkCacheSigns = (nowTs) => {
  for (const key in cacheSigns) {
    const saveTs = cacheSigns[key];
    if ((nowTs - saveTs) >= MAX_SAVE_SIGN_DURATION)
      delete cacheSigns[key];
  }
};

const verifySign = (
  expressReq,
  secretKey = API_SIGN_SECRET_KEY,
  signKeyName = API_SIGN_KEY_NAME,
  nonceTsKeyName = API_SIGN_NONCE_TS_KEY_NAME,
  isCustomEncrypt
) => {
  const allParams = getAllReqParams(expressReq);
  const signTmp = allParams[signKeyName];
  const nowTs = Date.now();

  // 删除超过一定时间的历史 sign
  if ((nowTs - oldCheckCacheSignTs) > CHECK_CACHE_SIGN_INTERVAL) {
    oldCheckCacheSignTs = nowTs;
    checkCacheSigns(nowTs);
  }

  if (!signTmp)
    return false;

  let nonceTs = undefined;
  if (allParams.nonce) {
    nonceTs = allParams[nonceTsKeyName];
    // 签名已经使用过, 不能再使用了
    if (!nonceTs || cacheSigns[signTmp])
      return false;
  }

  const sign = getApiSign(allParams, secretKey, signKeyName, nonceTsKeyName, isCustomEncrypt);

  const isOk = sign === signTmp;
  if (!isOk)
    return false;

  if (nonceTs)
    cacheSigns[signTmp] = nowTs;

  return true;
}

module.exports = {
  API_SIGN_SECRET_KEY,
  API_SIGN_KEY_NAME,
  router,
  generateExpressReqInfo,
  productGetRouter,
  productPostRouter,
  productPutRouter,
  productGetAndPostRouter,
  getReqParams,
  getAllReqParams,
  getApiSign,
  verifySign
};