const utils = require('../../../helepers/utils');
const {getLogger} = require('../../../log');
const log = getLogger('ApiHandler');

const SITE_COUNTER_PREFIX = 'sitecounter:';

class SiteCounterHandler {
  constructor () {
    this._siteSaveings = {}; // 
    this._cacheSites = {}; // { siteHost: { sitePv, siteUv, pages: { sitePagePathname: { pagePv, pageUv } } } }
    this._cacheCheckUpdateYesterDays = {}; // {siteHost: [checkTs, formatCheckDay]}
  }

  incrSiteCount (
    siteHost,
    sitePagePathname,
    isIncrSite,
    isHistroySession,
    isHistroySessionPage,
    onCallback
  ) {
    if (global.cacheStaticRedis) {
      this._incrSiteCountByRedis(
        siteHost,
        sitePagePathname,
        isIncrSite,
        isHistroySession,
        isHistroySessionPage
      ).then((resResult) => {
        onCallback && onCallback(undefined, resResult);
      }).catch((err) => {
        onCallback && onCallback(err);
      });
    }
  }

  async _incrSiteCountByRedis (
    siteHost,
    sitePagePathname,
    isIncrSite,
    isHistroySession,
    isHistroySessionPage
  ) {
    const resResult = {
      // site_pv: 0,
      // site_uv: 0,
      // page_pv: 0,
      // page_uv: 0,
      yesterday: {
        // site_pv: 0,
        // site_uv: 0,
        // page_pv: 0,
        // page_uv: 0
      }
    };

    const currFormatDay = utils.getCurrFormatTs(undefined, undefined, true);

    const siteCheckUpdateYesterDay = this._cacheCheckUpdateYesterDays[siteHost];
    if (!siteCheckUpdateYesterDay || siteCheckUpdateYesterDay[1] !== currFormatDay) {
      const redisClient = global.staticRedis && global.staticRedis.getRedisClient();
      if (!redisClient)
        throw new Error('redisClient is empty');
      
      this._cacheCheckUpdateYesterDays[siteHost] = [Date.now(), currFormatDay];

      const siteUpdateFormatDay = await redisClient.hgetAsync(SITE_COUNTER_PREFIX+siteHost, 'site:format_yester_day');

      if (!siteUpdateFormatDay) {
        await redisClient.hsetAsync(SITE_COUNTER_PREFIX+siteHost, 'site:format_yester_day', currFormatDay);
      } else if (
        siteUpdateFormatDay
        && siteUpdateFormatDay !== currFormatDay
        && (utils.toParseNumber(currFormatDay.replace(/-/g, '')) > utils.toParseNumber(siteUpdateFormatDay.replace(/-/g, '')))
      ) {
        if (siteUpdateFormatDay && siteUpdateFormatDay !== currFormatDay) {
          const siteAllRes = await redisClient.hgetallAsync(SITE_COUNTER_PREFIX+siteHost);
          const saveYesterdayJson = {};
          for (const key in siteAllRes) {
            if (/(:pv|:uv)/g.test(key) && !/yesterday/g.test(key)) {
              const val = utils.toParseNumber(siteAllRes[key]);
              if (val === undefined)
                continue;
                
              saveYesterdayJson['yesterday:'+key] = val;
            }
          }

          await redisClient.hmsetAsync(SITE_COUNTER_PREFIX+siteHost, saveYesterdayJson);
        }

        await redisClient.hsetAsync(SITE_COUNTER_PREFIX+siteHost, 'site:format_yester_day', currFormatDay);
      }
    }

    if (sitePagePathname) {
      const sitePagePvRes = await global.cacheStaticRedis.hincrAsync(SITE_COUNTER_PREFIX+siteHost, sitePagePathname+':pv');
      resResult['page_pv'] = utils.toParseNumber(sitePagePvRes) || 0;

      if (!isHistroySession || !isHistroySessionPage) {
        const sitePageUvRes = await global.cacheStaticRedis.hincrAsync(SITE_COUNTER_PREFIX+siteHost, sitePagePathname+':uv');
        resResult['page_uv'] =  utils.toParseNumber(sitePageUvRes) || 0;
      }else {
        const sitePageUvRes = await global.cacheStaticRedis.hgetAsync(SITE_COUNTER_PREFIX+siteHost, sitePagePathname+':uv');
        resResult['page_uv'] =  utils.toParseNumber(sitePageUvRes) || 0;
      }

      const yesterdaySitePagePUvRes = await global.cacheStaticRedis.hmgetAsync(
        SITE_COUNTER_PREFIX+siteHost,
        [
          'yesterday:'+sitePagePathname+':pv',
          'yesterday:'+sitePagePathname+':uv',
        ]
      );
      resResult.yesterday['page_pv'] =  utils.toParseNumber(yesterdaySitePagePUvRes && yesterdaySitePagePUvRes[0]) || 0;
      resResult.yesterday['page_uv'] =  utils.toParseNumber(yesterdaySitePagePUvRes && yesterdaySitePagePUvRes[1]) || 0;
    }

    if (isIncrSite) {
      const sitePvRes = await global.cacheStaticRedis.hincrAsync(SITE_COUNTER_PREFIX+siteHost, 'site:pv');
      resResult['site_pv'] =  utils.toParseNumber(sitePvRes) || 0;
  
      if (!isHistroySession) {
        const siteUvRes = await global.cacheStaticRedis.hincrAsync(SITE_COUNTER_PREFIX+siteHost, 'site:uv');
        resResult['site_uv'] =  utils.toParseNumber(siteUvRes) || 0;
      }else{
        const siteUvRes = await global.cacheStaticRedis.hgetAsync(SITE_COUNTER_PREFIX+siteHost, 'site:uv');
        resResult['site_uv'] =  utils.toParseNumber(siteUvRes) || 0;
      }
    }else {
      const sitePUvRes = await global.cacheStaticRedis.hmgetAsync(SITE_COUNTER_PREFIX+siteHost, [
        'site:pv',
        'site:uv'
      ]);
      resResult['site_pv'] =  utils.toParseNumber(sitePUvRes && sitePUvRes[0]) || 0;
      resResult['site_uv'] =  utils.toParseNumber(sitePUvRes && sitePUvRes[1]) || 0;
    }

    const yesterdaySitePUvRes = await global.cacheStaticRedis.hmgetAsync(SITE_COUNTER_PREFIX+siteHost, [
      'yesterday:site:pv',
      'yesterday:site:uv'
    ]);
    resResult.yesterday['site_pv'] =  utils.toParseNumber(yesterdaySitePUvRes && yesterdaySitePUvRes[0]) || 0;
    resResult.yesterday['site_uv'] =  utils.toParseNumber(yesterdaySitePUvRes && yesterdaySitePUvRes[1]) || 0;

    return resResult;
  }

  _printLog (method, ...args) {
    if (log[method]) {
      log[method]('SiteCounterHandler --> ', ...args, ' ,classId:', this._classId);
      return;
    }

    log.error(
      new Error('error stack').stack, '\r\n[logerror] logInstance not find method, methodName:' + method,
      'SiteCounterHandler --> ', ...args,
      ' ,classId:', this._classId
    );
  }
}

module.exports = new SiteCounterHandler();