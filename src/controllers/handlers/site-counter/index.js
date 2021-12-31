const {getLogger} = require('../../../log');
const log = getLogger('ApiHandler');

class SiteCounterHandler {
  constructor () {
    this._siteSaveings = {}; // 
    this._cacheSites = {}; // { siteMd5: { sitePv, siteUv, pages: { sitePageMd5: { pagePv, pageUv } } } }
  }

  incrSiteCount (
    siteMd5,
    sitePageMd5,
    isHistroySession,
    onCallback
  ) {
    if (global.cacheStaticRedis) {
      this._incrSiteCountByRedis(
        siteMd5,
        sitePageMd5,
        isHistroySession
      ).then((resResult) => {
        onCallback && onCallback(undefined, resResult);
      }).catch((err) => {
        onCallback && onCallback(err);
      });
    }
  }

  async _incrSiteCountByRedis (
    siteMd5,
    sitePageMd5,
    isHistroySession
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

    if (sitePageMd5) {
      const sitePagePvRes = await global.cacheStaticRedis.hincrAsync(siteMd5, sitePageMd5+':pv');
      resResult['page_pv'] = sitePagePvRes || 0;

      if (!isHistroySession) {
        const sitePageUvRes = await global.cacheStaticRedis.hincrAsync(siteMd5, sitePageMd5+':uv');
        resResult['page_uv'] = sitePageUvRes || 0;
      }else {
        const sitePageUvRes = await global.cacheStaticRedis.hgetAsync(siteMd5, sitePageMd5+':uv');
        resResult['page_uv'] = sitePageUvRes || 0;
      }

      const yesterdaySitePagePUvRes = await global.cacheStaticRedis.hmgetAsync(
        siteMd5,
        [
          'yesterday:'+sitePageMd5+':pv',
          'yesterday:'+sitePageMd5+':uv',
        ]
      );
      resResult.yesterday['page_pv'] = (yesterdaySitePagePUvRes && yesterdaySitePagePUvRes[0]) || 0;
      resResult.yesterday['page_uv'] = (yesterdaySitePagePUvRes && yesterdaySitePagePUvRes[1]) || 0;
    }

    const sitePvRes = await global.cacheStaticRedis.hincrAsync(siteMd5, 'site:pv');
    resResult['site_pv'] = sitePvRes || 0;

    if (!isHistroySession) {
      const siteUvRes = await global.cacheStaticRedis.hincrAsync(siteMd5, 'site:uv');
      resResult['site_uv'] = siteUvRes || 0;
    }else{
      const siteUvRes = await global.cacheStaticRedis.hgetAsync(siteMd5, 'site:uv');
      resResult['site_uv'] = siteUvRes || 0;
    }

    const yesterdaySitePUvRes = await global.cacheStaticRedis.hmgetAsync(siteMd5, ['yesterday:site:pv', 'yesterday:site:uv']);
    resResult.yesterday['site_pv'] = (yesterdaySitePUvRes && yesterdaySitePUvRes[0]) || 0;
    resResult.yesterday['site_uv'] = (yesterdaySitePUvRes && yesterdaySitePUvRes[1]) || 0;

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