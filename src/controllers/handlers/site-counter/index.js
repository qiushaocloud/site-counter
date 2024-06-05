const {exec} = require('child_process');
const utils = require('../../../helepers/utils');
const IPService = require('../../../services/ip-service');
const {getLogger, MY_LOG_DIR} = require('../../../log');
const ConcurrencyTaskController = require('../../../helepers/concurrency-task/index');
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

  siteCounterIpsStats (siteHost, {sitePagePathname, dateRangeStr, isOnlyPage, filterClientIp} = {}, onCallback) {
    let otherGrepFilters;
    if (isOnlyPage) {
      if (!sitePagePathname) return onCallback && onCallback(new Error('only get page ips stats, but site_page_pathname is empty'));
      !otherGrepFilters && (otherGrepFilters = {});
      otherGrepFilters.sitePagePathname = sitePagePathname;
    }
    
    if (filterClientIp) {
      !otherGrepFilters && (otherGrepFilters = {});
      otherGrepFilters.clientIp = filterClientIp;
    }

    this._concurrencyTaskController.addTask(() => {
      return this._getSiteCounterIpsLogs(siteHost, dateRangeStr, otherGrepFilters)
        .then((ipLogs) => {
          const resResult = {
            site_host: siteHost,
            site_ips: {},
            page_ips: {}
          }; // {site_ips: {{[logDay]:{[ip]:[count,ipLocation,lastTs]}}}, page_ips: {[logDay]:{[ip]:[count,ipLocation,lastTs]}}}
          sitePagePathname && (resResult.site_page_pathname = sitePagePathname);

          const clinetIpInfos = {};

          for (const ipLog of ipLogs) {
            const {
              ts: logTs,
              clientIp: logClientIp,
              siteHost: logSiteHost,
              sitePagePathname: logSitePagePathname,
              incrType: logIncrType,
            } = ipLog;

            const logDay = utils.getCurrFormatTs(logTs, undefined, true);
            if (siteHost !== logSiteHost) continue;

            if (
              sitePagePathname
              && sitePagePathname === logSitePagePathname
              && (!logIncrType || logIncrType === 'page' || logIncrType === 'siteandpage')
            ) {
              clinetIpInfos[logClientIp] === undefined && (clinetIpInfos[logClientIp] = '');
              let dayPageIps = resResult.page_ips[logDay];
              !dayPageIps && (dayPageIps = resResult.page_ips[logDay] = {});
              !dayPageIps[logClientIp] && (dayPageIps[logClientIp] = [0, '', logTs]);
              dayPageIps[logClientIp][0] = dayPageIps[logClientIp][0] + 1;
              (logTs > dayPageIps[logClientIp][2]) && (dayPageIps[logClientIp][2] = logTs);
            }

            if (isOnlyPage) continue;
            if (!(!logIncrType || logIncrType ==='site' || logIncrType ==='siteandpage')) continue;
            clinetIpInfos[logClientIp] === undefined && (clinetIpInfos[logClientIp] = '');
            let daySiteIps = resResult.site_ips[logDay];
            !daySiteIps && (daySiteIps = resResult.site_ips[logDay] = {});
            !daySiteIps[logClientIp] && (daySiteIps[logClientIp] = [0, '', logTs]);
            daySiteIps[logClientIp][0] = daySiteIps[logClientIp][0] + 1;
            (logTs > daySiteIps[logClientIp][2]) && (daySiteIps[logClientIp][2] = logTs);
          }

          isOnlyPage && delete resResult.site_ips;
          !sitePagePathname && delete resResult.page_ips;

          const proArr = [];
          for (const logClientIp in clinetIpInfos) {
            const pro = IPService.search(logClientIp, {isCache: true})
              .then((resopnse) => {
                clinetIpInfos[logClientIp] = resopnse.code === 200 ? resopnse.data.location : '';
              })
            proArr.push(pro);
          }

          Promise.all(proArr).then(() => {
            if (resResult.site_ips) {
              for (const logDayTmp in resResult.site_ips) {
                const daySiteIpsTmp = resResult.site_ips[logDayTmp];
                for (const logClientIpTmp in daySiteIpsTmp) {
                  daySiteIpsTmp[logClientIpTmp][1] = clinetIpInfos[logClientIpTmp] || '';
                }
              }
            }

            if (resResult.page_ips) {
              for (const logDayTmp in resResult.page_ips) {
                const dayPageIpsTmp = resResult.page_ips[logDayTmp];
                for (const logClientIpTmp in dayPageIpsTmp) {
                  dayPageIpsTmp[logClientIpTmp][1] = clinetIpInfos[logClientIpTmp] || '';
                }
              }
            }

            onCallback && onCallback(undefined, resResult);
          });
        })
        .catch((err) => {
          onCallback && onCallback(err);
        })
    });
  }

  siteCounterLogs (siteHost, {sitePagePathname, dateRangeStr, isOnlyPage, filterClientIp} = {}, onCallback) {
    let otherGrepFilters;
    if (isOnlyPage) {
      if (!sitePagePathname) return onCallback && onCallback(new Error('only get page ips stats, but site_page_pathname is empty'));
      !otherGrepFilters && (otherGrepFilters = {});
      otherGrepFilters.sitePagePathname = sitePagePathname;
    }
    
    if (filterClientIp) {
      !otherGrepFilters && (otherGrepFilters = {});
      otherGrepFilters.clientIp = filterClientIp;
    }

    this._concurrencyTaskController.addTask(() => {
      return this._getSiteCounterIpsLogs(siteHost, dateRangeStr, otherGrepFilters)
        .then((ipLogs) => {
          const resResult = {
            site_host: siteHost,
            site_logs: [],
            page_logs: []
          }; // {site_logs: [[ts, siteHost, clientIp, ipLocation, userAgent]], page_logs: [[ts, siteHost, sitePagePathname, clientIp, ipLocation, userAgent]]}
          sitePagePathname && (resResult.site_page_pathname = sitePagePathname);

          const clinetIpInfos = {};

          ipLogs.sort((a, b) => a.ts - b.ts); // 通过时间戳进行升序排序
          for (const ipLog of ipLogs) {
            const { 
              ts: logTs,
              clientIp: logClientIp,
              siteHost: logSiteHost, 
              sitePagePathname: logSitePagePathname,
              userAgent: logUserAgent,
              incrType: logIncrType,
              href: logHref
            } = ipLog;
            if (siteHost !== logSiteHost) continue;

            if (
              sitePagePathname
              && sitePagePathname === logSitePagePathname
              && (!logIncrType || logIncrType === 'page' || logIncrType === 'siteandpage')
            ) {
              clinetIpInfos[logClientIp] === undefined && (clinetIpInfos[logClientIp] = '');
              resResult.page_logs.push([logTs, logClientIp, '', logUserAgent, logHref]);
            }

            if (isOnlyPage) continue;
            if (!(!logIncrType || logIncrType ==='site' || logIncrType ==='siteandpage')) continue;
            clinetIpInfos[logClientIp] === undefined && (clinetIpInfos[logClientIp] = '');
            resResult.site_logs.push([logTs, logClientIp, '', logUserAgent, logHref]);
          }

          isOnlyPage && delete resResult.site_logs;
          !sitePagePathname && delete resResult.page_logs;

          const proArr = [];
          for (const logClientIp in clinetIpInfos) {
            const pro = IPService.search(logClientIp, {isCache: true})
              .then((resopnse) => {
                clinetIpInfos[logClientIp] = resopnse.code === 200 ? resopnse.data.location : '';
              })
            proArr.push(pro);
          }

          Promise.all(proArr).then(() => {
            if (resResult.site_logs && resResult.site_logs.length) {
              for (const logTmp of resResult.site_logs) {
                logTmp[2] = clinetIpInfos[logTmp[1]] || '';
              }
            }

            if (resResult.page_logs && resResult.page_logs.length) {
              for (const logTmp of resResult.page_logs) {
                logTmp[2] = clinetIpInfos[logTmp[1]] || '';
              }
            }

            onCallback && onCallback(undefined, resResult);
          });
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

  _getSiteCounterIpsLogs (siteHost, dateRangeStr, otherGrepFilters) {
    return new Promise((resolve, reject) => {
      try {
        let logFilePathRegexStr = `site-counter-ips.log.`;
        let dateRangeRegexStr = utils.getCurrFormatTs(undefined, undefined, true);
    
        if (dateRangeStr) {
          // dateRangeStr: 最多一个月以内的日期范围，格式如：'31days' | '2024-05-06' | '2024-05-06,2024-05-10' | '2024-05-06 to 2024-05-10' ｜ '2024-05-06 to 2024-05-10,2024-05-15'
          dateRangeRegexStr = '';
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
                  if (dateRangeRegexStr.includes(day)) continue;
                  dateRangeRegexStr += `${dateRangeRegexStr ? `|${day}` : day}`;
                }
                continue;
              }

              if (item.includes('to')) { // 日期范围
                const [startDay, endDay] = item.trim().split('to');
                const itemRange = utils.getDateRange(startDay.trim(), endDay.trim(), 31)
                for (const day of itemRange) {
                  if (dateRangeRegexStr.includes(day)) continue;
                  dateRangeRegexStr += `${dateRangeRegexStr ? `|${day}` : day}`;
                }
                continue;
              }
              
              if (dateRangeRegexStr.includes(item)) continue;
              dateRangeRegexStr += `${dateRangeRegexStr ? `|${item}` : item}`
            }
          } catch (err) {
            log.error('_getSiteCounterIpsLogs dateRangeStr catch error:', err, siteHost, dateRangeStr);
          }
    
          if (!dateRangeRegexStr) {
            log.error('_getSiteCounterIpsLogs date_range format error, dateRangeStr is empty', siteHost, dateRangeStr);
            return reject(new Error('date_range format error'));
          }
        }
    
        logFilePathRegexStr += (dateRangeRegexStr && !/\(.*\)/.test(dateRangeRegexStr) && dateRangeRegexStr.includes('|') ? `(${dateRangeRegexStr})` : dateRangeRegexStr);
        let cmd = `ls ${MY_LOG_DIR}/site-counter-ips.log.* | grep -E "${logFilePathRegexStr}" | xargs grep "request post /site_counter api" | grep -v grep | grep "siteHost:${siteHost} "`;
        if (otherGrepFilters) {
          for (const filterKey in otherGrepFilters) {
            const filterValue = otherGrepFilters[filterKey];
            if (filterValue === undefined || filterValue === null) continue;
            if (/(clientIp|user-agent)/.test(filterKey)) {
              cmd += ` | grep "${filterKey}:${filterValue} "`;
              continue;
            }
            cmd += ` | grep "${filterKey}:${filterValue}"`;
          }
        }

        log.debug('_getSiteCounterIpsLogs cmd:', cmd);
        exec(cmd, (err, stdout, stderr) => {
          const ipLogs = [];
          const resArr = (err || stderr) ? [] : stdout.trim().split('\n');

          for (const line of resArr) {
            // line: /Users/qiushaocloud/Desktop/Codes/qiushao-git-codes/site-counter/logs/site-counter-ips.log.2024-05-23:[2024-05-23T09:34:30.208] [INFO] RequestIps - request post /site_counter api success  ,siteHost:localhost  ,sitePagePathname:/common-static/qiushaocloud-site-counter-test-demo.html  ,clientIp:::1  ,user-agent:PostmanRuntime/7.35.0  ,apiId:1716687255951_2  ,incrType:siteandpage  ,href:https://www.qiushaocloud.top/common-static/site-counter/examples/complex.html
            // line: /Users/qiushaocloud/Desktop/Codes/qiushao-git-codes/site-counter/logs/site-counter-ips.log.2024-05-23:[2024-05-23T09:36:19.614] [INFO] RequestIps - request post /site_counter api success  ,siteHost:localhost   ,clientIp:::1  ,user-agent:PostmanRuntime/7.35.0  ,apiId:1716687255951_4  ,incrType:siteandpage  ,href:https://www.qiushaocloud.top/common-static/site-counter/examples/complex.html
            try {
              const lineMatchArr = line.trim().replace(/^.*\/site-counter-ips.log.\d{4}-\d{2}-\d{2}:/, '').match(/^\[(.*?)\] \[(.*?)\] RequestIps - request post \/site_counter api success(  ,siteHost:.*?)?(  ,sitePagePathname:.*?)?(  ,clientIp:.*?)?(  ,user-agent:.*?)?(  ,apiId:.*?)?(  ,incrType:.*?)?(  ,href:.*?)?$/);
              if (!lineMatchArr) continue;
      
              const ts = new Date(lineMatchArr[1].trim()).getTime();
              const siteHost = lineMatchArr[3] ? lineMatchArr[3].replace(',siteHost:', '').trim() : '';
              const sitePagePathname = lineMatchArr[4] ? lineMatchArr[4].replace(',sitePagePathname:', '').trim() : '';
              const clientIp = lineMatchArr[5] ? lineMatchArr[5].replace(',clientIp:', '').trim() : '';
              const userAgent = lineMatchArr[6] ? lineMatchArr[6].replace(',user-agent:', '').trim() : '';
              const apiId = lineMatchArr[7] ? lineMatchArr[7].replace(',apiId:', '').trim() : '';
              const incrType = lineMatchArr[8] ? lineMatchArr[8].replace(',incrType:', '').trim() : '';
              const href = lineMatchArr[9] ? lineMatchArr[9].replace(',href:', '').trim() : '';

              const ipLog = {
                ts, siteHost, sitePagePathname,
                clientIp, userAgent, apiId,
                incrType, href
              }

              ipLogs.push(ipLog);
            } catch (err) {
              log.error('_getSiteCounterIpsLogs lineMatchArr catch error:', err, line, siteHost);
            }
          }
    
          resolve(ipLogs);
        });
      } catch (err) {
        log.error('_getSiteCounterIpsLogs catch error:', err, siteHost, dateRangeStr, otherGrepFilters);
        reject(err);
      }
    });
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