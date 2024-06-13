const fs = require('fs');
const {exec} = require('child_process');
const utils = require('../../../helepers/utils');
const ipServiceInstance = require('../../../services/ip-service');
const {getLogger, MY_LOG_DIR} = require('../../../log');
const ConcurrencyTaskController = require('../../../helepers/concurrency-task/index');
const dbServiceInstance = require('../../../services/db-service');
const log = getLogger('ApiHandler');

const SITE_COUNTER_PREFIX = 'sitecounter:';

class SiteCounterHandler {
  constructor () {
    this._siteSaveings = {}; // 
    this._cacheSites = {}; // { siteHost: { sitePv, siteUv, pages: { sitePagePathname: { pagePv, pageUv } } } }
    this._cacheCheckUpdateYesterDays = {}; // {siteHost: [checkTs, formatCheckDay]}
    this._concurrencyTaskController = new ConcurrencyTaskController(log, {maxConcurrency: 3, taskTimeout: 3000}); // 并发任务控制
  }

  incrSiteCount (
    siteHost,
    sitePagePathname,
    isIncrSite,
    inIncrPage,
    isHistroySession,
    isHistroySessionPage,
    onCallback
  ) {
    if (global.cacheStaticRedis) {
      this._incrSiteCountByRedis(
        siteHost,
        sitePagePathname,
        isIncrSite,
        inIncrPage,
        isHistroySession,
        isHistroySessionPage
      ).then((resResult) => {
        onCallback && onCallback(undefined, resResult);
      }).catch((err) => {
        onCallback && onCallback(err);
      });
    }
  }

  siteCounterIpsStats (
    siteHost,
    {
      dateRangeStr,
      sitePagePathname,
      isOnlyPage,
      filterClientIp,
      pageSize,
      pageNo,
      order
    } = {},
    onCallback
  ) {
    if (isOnlyPage && !sitePagePathname)
      return onCallback && onCallback(new Error('only get page ips stats, but site_page_pathname is empty'));

    this._concurrencyTaskController.addTask(() => {
      return this._getSiteCounterIpsStatsOrIpLogs('IpsStats', {siteHost, dateRangeStr, sitePagePathname, isOnlyPage, filterClientIp, pageSize, pageNo, order})
        .then((resResult) => {
          onCallback && onCallback(undefined, resResult);
        })
        .catch((err) => {
          onCallback && onCallback(err);
        })
    });
  }

  siteCounterLogs (
    siteHost,
    {
      dateRangeStr,
      sitePagePathname,
      isOnlyPage,
      filterClientIp,
      pageSize,
      pageNo,
      order
    } = {},
    onCallback
  ) {
    if (isOnlyPage && !sitePagePathname)
      return onCallback && onCallback(new Error('only get page ips logs, but site_page_pathname is empty'));
  
    this._concurrencyTaskController.addTask(() => {
      return this._getSiteCounterIpsStatsOrIpLogs('IpLogs', {siteHost, dateRangeStr, sitePagePathname, isOnlyPage, filterClientIp, pageSize, pageNo, order})
        .then((resResult) => {
          onCallback && onCallback(undefined, resResult);
        })
        .catch((err) => {
          onCallback && onCallback(err);
        });
    });
  }

  async _incrSiteCountByRedis (
    siteHost,
    sitePagePathname,
    isIncrSite,
    inIncrPage,
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
      if (inIncrPage) {
        const sitePagePvRes = await global.cacheStaticRedis.hincrAsync(SITE_COUNTER_PREFIX+siteHost, sitePagePathname+':pv');
        resResult['page_pv'] = utils.toParseNumber(sitePagePvRes) || 0;
  
        if (!isHistroySession || !isHistroySessionPage) {
          const sitePageUvRes = await global.cacheStaticRedis.hincrAsync(SITE_COUNTER_PREFIX+siteHost, sitePagePathname+':uv');
          resResult['page_uv'] =  utils.toParseNumber(sitePageUvRes) || 0;
        }else {
          const sitePageUvRes = await global.cacheStaticRedis.hgetAsync(SITE_COUNTER_PREFIX+siteHost, sitePagePathname+':uv');
          resResult['page_uv'] =  utils.toParseNumber(sitePageUvRes) || 0;
        }
      } else {
        const sitePagePUvRes = await global.cacheStaticRedis.hmgetAsync(SITE_COUNTER_PREFIX+siteHost, [
          sitePagePathname+':pv',
          sitePagePathname+':uv'
        ]);
        resResult['page_pv'] =  utils.toParseNumber(sitePagePUvRes && sitePagePUvRes[0]) || 0;
        resResult['page_uv'] =  utils.toParseNumber(sitePagePUvRes && sitePagePUvRes[1]) || 0;
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

  async _getSiteCounterIpsStatsOrIpLogs (typeName, {
    siteHost,
    dateRangeStr,
    sitePagePathname,
    isOnlyPage,
    filterClientIp,
    pageSize = 100,
    pageNo = 1,
    order = 'DESC' // ASC | DESC，默认 DESC
  }) {
    let methodNmae = typeName === 'IpsStats' ? '_getSiteCounterIpsStats' : '_getSiteCounterIpLogs';
    log.debug(
      methodNmae+' siteHost:', siteHost, ' ,dateRangeStr:', dateRangeStr, ' ,sitePagePathname:', sitePagePathname,
      ' ,isOnlyPage:', isOnlyPage, ' ,filterClientIp:', filterClientIp, ' ,pageSize:', pageSize, ' ,pageNo:', pageNo
    );
    try {
      if (isOnlyPage && !sitePagePathname) throw new Error('only get page ips stats or logs, but site_page_pathname is empty');

      const filterDayArr = [utils.getCurrFormatTs(undefined, undefined, true)];
      if (dateRangeStr) {
        // dateRangeStr: 最多一个月以内的日期范围，格式如：'31days' | '2024-05-06' | '2024-05-06,2024-05-10' | '2024-05-06 to 2024-05-10' ｜ '2024-05-06 to 2024-05-10,2024-05-15'
        filterDayArr.length = 0;
        try {
          const dateRangeArr = dateRangeStr.trim().split(',');
          for (const item of dateRangeArr) {
            if (/^\d+days$/.test(item)) { // 多少天内
              let days = parseInt(item.replace('days', ''));
              if (isNaN(days) || days <= 0) continue;
              days > 31 && (days = 31);
              const startTs = Date.now() - (days-1) * 24 * 60 * 60 * 1000;
              const endTs = Date.now();
              const itemRange = utils.getDateRange(utils.getCurrFormatTs(startTs, undefined, true), utils.getCurrFormatTs(endTs, undefined, true), days);
              for (const day of itemRange) {
                if (filterDayArr.includes(day)) continue;
                filterDayArr.push(day);
              }
              continue;
            }

            if (item.includes('to')) { // 日期范围
              const [startDay, endDay] = item.trim().split('to');
              const itemRange = utils.getDateRange(startDay.trim(), endDay.trim(), 31)
              for (const day of itemRange) {
                if (filterDayArr.includes(day)) continue;
                filterDayArr.push(day);
              }
              continue;
            }
            
            if (filterDayArr.includes(item)) continue;
            filterDayArr.push(item);
          }
        } catch (err) {
          log.error(methodNmae+' dateRangeStr catch error:', err, siteHost, dateRangeStr);
        }
  
        if (!filterDayArr.length) {
          log.error(methodNmae+' date_range format error, dateRangeStr is empty', siteHost, dateRangeStr);
          throw new Error('date_range format error');
        }
      }

      let commonCondition = `site_host = '${siteHost}'`;
      filterDayArr.length && (commonCondition += ` AND part_date IN ('${filterDayArr.join("','")}')`);
      filterClientIp && (commonCondition += ` AND ip = '${filterClientIp}'`);

      // typeName === 'IpsStats': {site_host, site_ips?: {[logDay]: {totalPages, totalCount, ipCount, pageSize, pageNo, ipDatas:{[ip]:{count, ip_location, lastTs}}}}, page_ips?: {[logDay]: {totalPages, totalCount, pageSize, pageNo, ipDatas:{[ip]:{count, ip_location, lastTs}}}}, site_page_pathname?}
      // typeName === 'IpLogs': {site_host, site_logs?: {totalPages, totalCount, pageSize, pageNo, logDatas: [[ts, ip, ip_location, user_agent, href]]}, page_logs?: {totalPages, totalCount, pageSize, pageNo, logDatas: [[ts, ip, ip_location, user_agent, href]]}, site_page_pathname?}
      const resResult = {site_host: siteHost};
      sitePagePathname && (resResult.site_page_pathname = sitePagePathname);

      if (!isOnlyPage) {
        if (typeName === 'IpsStats') {
          const siteCondition = `${commonCondition} AND incr_type IN ('site','siteandpage')`;
          const extraFilter = `ORDER BY lastTs ${order}`;
          resResult.site_ips = await dbServiceInstance.getPaginatedSiteCounterIpsStats({pageSize, pageNo: pageNo, condition: siteCondition, extraFilter});
          log.debug(methodNmae+' getPaginatedSiteCounterIpsStats siteCondition success', pageSize, pageNo, siteCondition);
        } else {
          const siteCondition = `${commonCondition} AND incr_type IN ('site','siteandpage')${sitePagePathname ? ` AND (page_pathname != '${sitePagePathname}' OR page_pathname IS NULL)` : ''}`;
          const extraFilter = `ORDER BY logts ${order}`;
          resResult.site_logs = await dbServiceInstance.getPaginatedSiteCounterIpLogs({pageSize, pageNo: pageNo, condition: siteCondition, extraFilter});
          log.debug(methodNmae+' getPaginatedSiteCounterIpLogs siteCondition success', pageSize, pageNo, siteCondition);
        }
      }

      if (sitePagePathname) {
        const sitePageCondition = `${commonCondition} AND incr_type IN ('page','siteandpage') AND page_pathname = '${sitePagePathname}'`;
        if (typeName === 'IpsStats') {
          const extraFilter = `ORDER BY lastTs ${order}`;
          resResult.page_ips = await dbServiceInstance.getPaginatedSiteCounterIpsStats({pageSize, pageNo: pageNo, condition: sitePageCondition, extraFilter});
          log.debug(methodNmae+' getPaginatedSiteCounterIpsStats sitePageCondition success', pageSize, pageNo, sitePageCondition);
        } else {
          const extraFilter = `ORDER BY logts ${order}`;
          resResult.page_logs = await dbServiceInstance.getPaginatedSiteCounterIpLogs({pageSize, pageNo: pageNo, condition: sitePageCondition, extraFilter});
          log.debug(methodNmae+' getPaginatedSiteCounterIpLogs sitePageCondition success', pageSize, pageNo, sitePageCondition);
        }
      }

      // 获取所有ip的地理位置信息
      try {
        const awaitIpLocations = {};

        if (typeName === 'IpsStats') {
          if (resResult.site_ips) {
            for (const logDay in resResult.site_ips) {
              for (const ip in resResult.site_ips[logDay].ipDatas) {
                if (!ip || awaitIpLocations[ip] !== undefined || resResult.site_ips[logDay].ipDatas[ip][1]) continue;
                if (/^(::1|127\.0\.0\.1|0\.0\.0\.0)$/.test(ip)) {
                  resResult.site_ips[logDay].ipDatas[ip][1] = 'localhost';
                  continue;
                }
                awaitIpLocations[ip] = '';
              }
            }
          }
        } else {
          if (resResult.site_logs) {
            for (const logTmp of resResult.site_logs.logDatas) {
              if (!logTmp[1] || awaitIpLocations[logTmp[1]] !== undefined || logTmp[2]) continue;
              if (/^(::1|127\.0\.0\.1|0\.0\.0\.0)$/.test(logTmp[1])) {
                logTmp[2] = 'localhost';
                continue;
              }
              awaitIpLocations[logTmp[1]] = '';
            }
          }
        }
        
        if (typeName === 'IpsStats') {
          if (resResult.page_ips) {
            for (const logDay in resResult.page_ips) {
              for (const ip in resResult.page_ips[logDay].ipDatas) {
                if (!ip || awaitIpLocations[ip] !== undefined || resResult.page_ips[logDay].ipDatas[ip][1]) continue;
                if (/^(::1|127\.0\.0\.1|0\.0\.0\.0)$/.test(ip)) {
                  resResult.page_ips[logDay].ipDatas[ip][1] = 'localhost';
                  continue;
                }
                awaitIpLocations[ip] = '';
              }
            }
          }
        } else {
          if (resResult.page_logs) {
            for (const logTmp of resResult.page_logs.logDatas) {
              if (!logTmp[1] || awaitIpLocations[logTmp[1]] !== undefined || logTmp[2]) continue;
              if (/^(::1|127\.0\.0\.1|0\.0\.0\.0)$/.test(logTmp[1])) {
                logTmp[2] = 'localhost';
                continue;
              }
              awaitIpLocations[logTmp[1]] = '';
            }
          }
        }
  
        const proArr = [];
        for (const ip in awaitIpLocations) {
          const pro = ipServiceInstance.search(ip, {isCache: true})
           .then((resopnse) => {
              awaitIpLocations[ip] = resopnse.code === 200 ? resopnse.data.location || 'empty' : '';
            })
          proArr.push(pro);
        }
  
        await Promise.all(proArr);

        if (typeName === 'IpsStats') {
          if (resResult.site_ips) {
            for (const logDayTmp in resResult.site_ips) {
              const {ipDatas} = resResult.site_ips[logDayTmp];
              for (const logIpTmp in ipDatas) {
                if (ipDatas[logIpTmp][1]) continue;
                ipDatas[logIpTmp][1] = awaitIpLocations[logIpTmp] || '';
              }
            }
          }
        } else {
          if (resResult.site_logs) {
            for (const logTmp of resResult.site_logs.logDatas) {
              if (logTmp[2]) continue;
              logTmp[2] = awaitIpLocations[logTmp[1]] || '';
            }
          }
        }
       
        if (typeName === 'IpsStats') {
          if (resResult.page_ips) {
            for (const logDayTmp in resResult.page_ips) {
              const {ipDatas} = resResult.page_ips[logDayTmp];
              for (const logIpTmp in ipDatas) {
                if (ipDatas[logIpTmp][1]) continue;
                ipDatas[logIpTmp][1] = awaitIpLocations[logIpTmp] || '';
              }
            }
          }
        } else {
          if (resResult.page_logs) {
            for (const logTmp of resResult.page_logs.logDatas) {
              if (logTmp[2]) continue;
              logTmp[2] = awaitIpLocations[logTmp[1]] || '';
            }
          }
        }

        const updateProArr = [];
        for (const logIpTmp in awaitIpLocations) {
          const logIpLocationTmp = awaitIpLocations[logIpTmp];
          if (!logIpLocationTmp) continue;
          const updateCondition = `${commonCondition} AND (ip_location != '${logIpLocationTmp}' OR ip_location IS NULL)${commonCondition.includes(`AND ip = '${logIpTmp}'`) ? '' : ` AND ip = '${logIpTmp}'`}`;
          updateProArr.push(dbServiceInstance.updateSiteCounterIpRecords({ip_location: logIpLocationTmp}, updateCondition));
        }
        const updateProArrLen = updateProArr.length;
        log.debug(methodNmae+' updateSiteCounterIpRecords start, updateProArrLen:', updateProArrLen);
        Promise.all(updateProArr).then(() => {
          log.debug(methodNmae+' updateSiteCounterIpRecords success, updateProArrLen:', updateProArrLen);
        }).catch((err) => {
          log.error(methodNmae+' updateSiteCounterIpRecords catch error:', err, ' ,updateProArrLen:', updateProArrLen);
        });
      } catch (ipLocationsCatchErr) {
        log.error(methodNmae+' get ipLocations catch error:', ipLocationsCatchErr);
      }
      
      log.debug(methodNmae+' success', siteHost, dateRangeStr, sitePagePathname, isOnlyPage, filterClientIp, pageSize, pageNo)
      return resResult;
    } catch (err) {
      log.error(methodNmae+' catch error:', err, siteHost, dateRangeStr, sitePagePathname, isOnlyPage, filterClientIp, pageSize, pageNo);
      throw err;
    }
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