(function(){  
  console.info(
    '欢迎使用 qiushaocloud/site-counter，作者：邱少羽梦，作者博客: https://www.qiushaocloud.top'
  );

  setTimeout(function () {
    var addHeadStr = '<meta property="og:site_counter_author" content="邱少羽梦"></meta>'
      + '<meta property="og:site_counter_author_blog" content="https://www.qiushaocloud.top"></meta>';
    
    if (document.head)
      document.head.innerHTML += addHeadStr;
  }, 500);

  var maxSaveSessionDuration = window.localStorage.getItem('qiushaocloud_sitecounter_max_session_duration');
  var MAX_SAVE_SESSION_DURATION = maxSaveSessionDuration ? Number(maxSaveSessionDuration) : 24 * 60 * 60 * 1000;
  var YOUR_SERVER_HOST = 'www.qiushaocloud.top';

  var randomChars = [
    'R', 'L', 'U', '_',
    'V', 'J', 'A', 'S',
    '_', 'E', 'M', 'S',
    'U', 'G'
  ];
  var addChatCodeNum = 0;
  for (var key in randomChars) {
    var code = randomChars[key].charCodeAt();
    addChatCodeNum += (39*code - code%5);
  }

  var API_SIGN_SECRET_KEY = window.QIUSHAOCLOUD_SITE_COUNTER_API_SIGN_SECRET_KEY || '';
  delete window.QIUSHAOCLOUD_SITE_COUNTER_API_SIGN_SECRET_KEY;
  if (!API_SIGN_SECRET_KEY) {
    var SECRET_KEY_CHAR_CODE_STR = '43974-43966-43978-43988-43976-43965-43958-43972-43988-43960-43969-43972-43978-43961-43988-43976-43962-43960-43975-43962-43977-43988-43968-43962-43982';
    var SECRET_KEY_CHAR_CODE_ARR = SECRET_KEY_CHAR_CODE_STR.split('-');
    for (var key in SECRET_KEY_CHAR_CODE_ARR) {
      API_SIGN_SECRET_KEY += String.fromCharCode(SECRET_KEY_CHAR_CODE_ARR[key] - addChatCodeNum);
    }
  }

  var isIncredSite = false;
  var isIncredSitePage = false;
  var isReqedSiteIpsStats = false;
  var isReqedSitePageIpsStats = false;
  var timer = undefined;
  var currCheckCount = 0;
  
  timer = setInterval(function() {
    currCheckCount++;
    if (currCheckCount % 10 !== 2)
      return;

    var sitePvEle = document.getElementById('qiushaocloud_sitecounter_value_site_pv');
    var siteUvEle = document.getElementById('qiushaocloud_sitecounter_value_site_uv');
    var todaySitePvEle = document.getElementById('qiushaocloud_sitecounter_value_today_site_pv');
    var todaySiteUvEle = document.getElementById('qiushaocloud_sitecounter_value_today_site_uv');
    
    var sitePagePvEle = document.getElementById('qiushaocloud_sitecounter_value_site_page_pv');
    var sitePageUvEle = document.getElementById('qiushaocloud_sitecounter_value_site_page_uv');
    var todaySitePagePvEle = document.getElementById('qiushaocloud_sitecounter_value_today_site_page_pv');
    var todaySitePageUvEle = document.getElementById('qiushaocloud_sitecounter_value_today_site_page_uv');

    var siteIpsStatsEle = document.getElementById('qiushaocloud_sitecounter_value_site_ips_stats');
    var sitePageIpsStatsEle = document.getElementById('qiushaocloud_sitecounter_value_site_page_ips_stats');

    var hasSiteEle = !!(sitePvEle || siteUvEle || todaySitePvEle || todaySiteUvEle);
    var hasSitePageEle = !!(sitePagePvEle || sitePageUvEle || todaySitePagePvEle || todaySitePageUvEle);

    if ((isIncredSite && isIncredSitePage && isReqedSiteIpsStats && isReqedSitePageIpsStats) || currCheckCount > 1800) {
      console.log('clearInterval timer', isIncredSite, isIncredSitePage, isReqedSiteIpsStats, isReqedSitePageIpsStats, currCheckCount);
      timer && clearInterval(timer);
      timer = undefined;
      return;
    }

    if ((hasSiteEle && !isIncredSite) || (hasSitePageEle && !isIncredSitePage)) {
      var sitePagePathname = undefined;
      var isIncrSite = hasSiteEle && !isIncredSite;
      var isIncrSitePage = hasSitePageEle && !isIncredSitePage;
      var nowTs = Date.now();
      var saveSiteTs = window.localStorage.getItem('qiushaocloud_sitecounter_session_save_ts');
      var isSiteHistroySession = false;
      var saveSitePageTs = undefined;
      var isSitePageHistroySession = undefined;
      
      hasSiteEle && !isIncredSite && (isIncredSite = true);
      
      if (hasSitePageEle && !isIncredSitePage) {
        sitePagePathname = getSitePagePathname();
        isIncredSitePage = true;
        saveSitePageTs = window.localStorage.getItem('qiushaocloud_sitecounter_session_save_ts:page:' + sitePagePathname);
        isSitePageHistroySession = false;
        saveSitePageTs = saveSitePageTs ? Number(saveSitePageTs) : undefined;
      }

      saveSiteTs = saveSiteTs ? Number(saveSiteTs) : undefined;
      if (saveSiteTs || saveSitePageTs) {
        var currFormatDay = getCurrFormatTs(undefined, undefined, true);

        if (saveSiteTs) {
          var saveFormatDay = getCurrFormatTs(saveSiteTs, undefined, true);
          if (currFormatDay === saveFormatDay && ((nowTs - saveSiteTs) < MAX_SAVE_SESSION_DURATION))
            isSiteHistroySession = true;
        }
        
        if (saveSitePageTs) {
          var saveFormatDay = getCurrFormatTs(saveSitePageTs, undefined, true);
          if (currFormatDay === saveFormatDay && ((nowTs - saveSitePageTs) < MAX_SAVE_SESSION_DURATION))
            isSitePageHistroySession = true;
        }
      }
      
      // 清理 qiushaocloud_sitecounter_session_save_ts 过期数据，只要超过3天的数据都清理掉
      var saveSiteTsKeys = Object.keys(window.localStorage).filter(function (key) {
        return key.indexOf('qiushaocloud_sitecounter_session_save_ts') === 0;
      });
      for (var i=0, len=saveSiteTsKeys.length; i<len; i++) {
        var saveSiteTsKey = saveSiteTsKeys[i];
        var saveSiteTsVal = window.localStorage.getItem(saveSiteTsKey);
        var saveSiteTsValTs = saveSiteTsVal ? Number(saveSiteTsVal) : undefined;
        if (typeof saveSiteTsValTs === 'number' && saveSiteTsValTs && !isNaN(saveSiteTsValTs)) {
          var saveSiteTsDiff = (Date.now() - saveSiteTsValTs) / 1000;
          if (saveSiteTsDiff > 3 * 24 * 60 * 60) {
            window.localStorage.removeItem(saveSiteTsKey);
          }
        }
      }

      isIncrSite && window.localStorage.setItem('qiushaocloud_sitecounter_session_save_ts', Date.now());
      if (sitePagePathname && isIncrSitePage) {
        window.localStorage.setItem('qiushaocloud_sitecounter_session_save_ts:page:' + sitePagePathname, Date.now());
      }
      
      reqSiteCounterAPI(
        getSiteHost(),
        sitePagePathname,
        isIncrSite,
        isIncrSitePage,
        isSiteHistroySession,
        isSitePageHistroySession,
        getLocationHref(),
        function (err, res) {
          if (err) {
            console.error('reqSiteCounterAPI err:', err);
            sendNotice('api:post:site_counter', {err: err, data: res})
            return;
          }
          
          var apiResult = JSON.parse(res);

          var yesterday = apiResult.yesterday;

          var sitePv = apiResult.site_pv;
          var siteUv = apiResult.site_uv;
          var todaySitePv = sitePv - yesterday.site_pv;
          var todaySiteUv = siteUv - yesterday.site_uv;

          var sitePagePv = apiResult.page_pv;
          var sitePageUv = apiResult.page_uv;
          var todaySitePagePv = sitePagePv !== undefined ? sitePagePv - (yesterday.page_pv || 0) : undefined;
          var todaySitePageUv = sitePageUv !== undefined ? sitePageUv - (yesterday.page_uv || 0) : undefined;

          console.info(
            '总访问量:', sitePv,
            ' ,总访客量:', siteUv,
            ' ,今日访问量:', todaySitePv,
            ' ,今日访客量:', todaySiteUv,
            ' ,本页面总访问量:', sitePagePv,
            ' ,本页面总访客量:', sitePageUv,
            ' ,本页面今日访问量:', todaySitePagePv,
            ' ,本页面今日访客量:', todaySitePageUv
          );

          sitePvEle && (sitePvEle.innerHTML = sitePv);
          siteUvEle && (siteUvEle.innerHTML = siteUv);
          todaySitePvEle && (todaySitePvEle.innerHTML = todaySitePv);
          todaySiteUvEle && (todaySiteUvEle.innerHTML = todaySiteUv);

          sitePagePvEle && sitePagePv !== undefined && (sitePagePvEle.innerHTML = sitePagePv);
          sitePageUvEle && sitePageUv !== undefined && (sitePageUvEle.innerHTML = sitePageUv);
          todaySitePagePvEle && todaySitePagePv !== undefined && (todaySitePagePvEle.innerHTML = todaySitePagePv);
          todaySitePageUvEle && todaySitePageUv !== undefined && (todaySitePageUvEle.innerHTML = todaySitePageUv);

          sendNotice('api:post:site_counter', {data: apiResult})
        }
      );
    }

    if ((siteIpsStatsEle && !isReqedSiteIpsStats) || (sitePageIpsStatsEle && !isReqedSitePageIpsStats)) {
      var apiIpsStatsOpts = {}; // {site_page_pathname, date_range, is_only_page, filter_client_ip}

      var siteIpsStatsDateRange = (siteIpsStatsEle && siteIpsStatsEle.getAttribute('data-date-range')) || undefined;
      var sitePageIpsStatsDateRange = (sitePageIpsStatsEle && sitePageIpsStatsEle.getAttribute('data-date-range')) || undefined;
      
      sitePageIpsStatsEle && !isReqedSitePageIpsStats && (apiIpsStatsOpts.site_page_pathname = sitePageIpsStatsEle.getAttribute('data-site-page-pathname') || getSitePagePathname());
      (!siteIpsStatsEle || isReqedSiteIpsStats) && (apiIpsStatsOpts.is_only_page = true);

      if (siteIpsStatsDateRange && !apiIpsStatsOpts.is_only_page)
        apiIpsStatsOpts.date_range = siteIpsStatsDateRange;

      if (sitePageIpsStatsDateRange && apiIpsStatsOpts.site_page_pathname)
        apiIpsStatsOpts.site_page_date_range = sitePageIpsStatsDateRange;

      siteIpsStatsEle && !isReqedSiteIpsStats && (isReqedSiteIpsStats = true);
      sitePageIpsStatsEle && !isReqedSitePageIpsStats && (isReqedSitePageIpsStats = true);

      reqSiteCounterIpsStatsAPI(getSiteHost(), apiIpsStatsOpts, function (err, res) {
        if (err) {
          console.error('reqSiteCounterIpsStatsAPI err:', err);
          sendNotice('api:get:site_counter_ips_stats', {err: err, data: res})
          return;
        }

        var apiResult = JSON.parse(res);

        var siteIpsStatsData = apiResult.site_ips; // {[logDay]:{[ip]:[count,ipLocation]}}
        var sitePageIpsStatsData = apiResult.page_ips; // {[logDay]:{[ip]:[count,ipLocation]}}

        var totalIpsStatsDataMap = {
          'site': {
            ele: siteIpsStatsEle,
            data: siteIpsStatsData,
          },
          'site-page': {
            ele: sitePageIpsStatsEle,
            data: sitePageIpsStatsData
          }
        };

        siteIpsStatsEle && siteIpsStatsEle.getAttribute('data-render-mode') === 'none' && (delete totalIpsStatsDataMap['site']);
        sitePageIpsStatsEle && sitePageIpsStatsEle.getAttribute('data-render-mode') === 'none' && (delete totalIpsStatsDataMap['site-page']);
        var dataSitePagePathname = sitePageIpsStatsEle && sitePageIpsStatsEle.getAttribute('data-site-page-pathname');
        var sitePageTitle = (dataSitePagePathname && dataSitePagePathname !== getSitePagePathname() ? '页面(<span class="other-page-title">'+dataSitePagePathname+'</span>)' : '本页面')

        for (var ipsStatsKey in totalIpsStatsDataMap) {
          var ipsStats = totalIpsStatsDataMap[ipsStatsKey];
          var ipsStatsData = ipsStats.data;
          var ipsStatsEle = ipsStats.ele;
          if (!ipsStatsEle || !ipsStatsData) continue;
          var ipsStatsRenderMode = ipsStatsEle.getAttribute('data-render-mode');
          if (ipsStatsRenderMode === 'none') continue; // 日志打印模式为none，不在控制台打印IP详情，页面不渲染IP详情

          if (ipsStatsRenderMode === 'console') { // 日志打印模式为console，只在控制台打印IP详情，页面不渲染IP详情
            for (var logDay in ipsStatsData) {
              var logDayData = ipsStatsData[logDay];
              console.group('==================== '+(ipsStatsKey ==='site' ? '网站' : sitePageTitle)+' '+logDay+' 访问IP详情 ====================');
              var ipsTableData = [];
              for (var ip in logDayData) {
                var ipCount = logDayData[ip][0];
                var ipLocation = logDayData[ip][1];
                ipsTableData.push({
                  'IP': ip,
                  '访问次数': ipCount,
                  'IP信息': ipLocation
                });
              }
              console.table(ipsTableData);
              console.groupEnd();
            }
            continue; 
          }
 
          var ipsStatsSortName = ipsStatsEle.getAttribute('data-ips-stats-sort-name');
          var ipsStatsDataDays = Object.keys(ipsStatsData).sort((a, b) => ipsStatsSortName === 'desc' ? new Date(b).getTime() - new Date(a).getTime() : new Date(a).getTime() - new Date(b).getTime());
          // console.debug(ipsStatsKey + ' ipsStatsDataDays:', ipsStatsDataDays);

          ipsStatsEle.innerHTML = '';
          ipsStatsEle.onclick = (function(ipsStatsKey, ipsStatsEle) {
            return function (e) {
              var target = e.target;
              if (target.nodeName === 'BUTTON' && target.classList.contains(ipsStatsKey+'-log-day-ip-detail-btn')) {
                var ip = target.getAttribute('data-ip');
                var day = target.getAttribute('data-day');
                console.debug(ipsStatsKey+'-log-day-ip-detail-btn click, run requestQiushaocloudSiteCounterLogsApiByFilter => ip:', ip, 'day:', day);
                window.requestQiushaocloudSiteCounterLogsApiByFilter(ipsStatsKey, day, ip, function (err, res) {
                  if (err) {
                    console.error(ipsStatsKey+'-log-day-ip-detail-btn click requestQiushaocloudSiteCounterLogsApiByFilter failure', ip, day);
                    return;
                  }
  
                  console.debug(ipsStatsKey+'-log-day-ip-detail-btn click requestQiushaocloudSiteCounterLogsApiByFilter success', ip, day);
                  var apiResult = JSON.parse(res);
                  var logsSortName = ipsStatsEle.getAttribute('data-logs-sort-name');
                  var logsPrintMode = ipsStatsEle.getAttribute('data-logs-print-mode');
                  if (logsPrintMode === 'none') return; // 日志打印模式为none，不打印日志详情

                  if (ipsStatsKey === 'site') {
                    var logs = apiResult.site_logs;
                    if (apiResult.page_logs && apiResult.page_logs.length > 0)
                      logs = logs.concat(apiResult.page_logs);
                    logs.sort((a, b) => logsSortName === 'desc' ? new Date(b[0]).getTime() - new Date(a[0]).getTime() : new Date(a[0]).getTime() - new Date(b[0]).getTime());
                    
                    if (logsPrintMode === 'console') {
                      var tableData = [];
                      for (var i=0, len=logs.length; i<len; i++) {
                        var log = logs[i];
                        tableData.push({'时间':getCurrFormatTs(log[0]), 'IP':log[1], 'IP信息':log[2], 'UserAgent':log[3], 'Href':log[4]});
                      }
                      
                      console.log('==================== 网站 '+day+' 访问日志：'+ip+' ====================');
                      console.table(tableData);
                    } else {
                      createLogsTableToUI(logs, document.body, {boxClass: 'site-logs-box', boxTitle: '<span class="pg1">网站</span> <span class="logs-date">'+day+'</span> <span class="pg2">访问日志:</span><span class="ip">'+ip+'</span>'})
                    }
                  } else {
                    var dataSitePagePathname = ipsStatsEle && ipsStatsEle.getAttribute('data-site-page-pathname');
                    var sitePageTitle = (dataSitePagePathname && dataSitePagePathname !== getSitePagePathname() ? '<span class="pg1">页面</span><span class="other-page-title">(<span class="content">'+dataSitePagePathname+'</span>)</span>' : '本页面')
            
                    var logs = apiResult.page_logs;
                    logs.sort((a, b) => logsSortName === 'desc' ? new Date(b[0]).getTime() - new Date(a[0]).getTime() : new Date(a[0]).getTime() - new Date(b[0]).getTime());
                    if (logsPrintMode === 'console') {
                      var tableData = [];
                      for (var i=0, len=logs.length; i<len; i++) {
                        var log = logs[i];
                        tableData.push({'时间':getCurrFormatTs(log[0]), 'IP':log[1], 'IP信息':log[2], 'UserAgent':log[3], 'Href':log[4]});
                      }
                      
                      console.log('==================== '+sitePageTitle+' '+day+' 访问日志：'+ip+' ====================');
                      console.table(tableData);
                    } else {
                      createLogsTableToUI(logs, document.body, {boxClass: 'site-page-logs-box', boxTitle: sitePageTitle+' <span class="logs-date">'+day+'</span> <span class="pg2">访问日志:</span><span class="ip">'+ip+'</span>'})
                    }
                  }
                });
                return;
              }

              if (target.nodeName === 'BUTTON' && target.classList.contains(ipsStatsKey+'-log-day-ul-fold-btn')) {
                var logDayEle = target.parentNode.parentNode;
                var logDayUlEle = logDayEle.querySelector('.'+ipsStatsKey+'-log-day-ul');
                logDayUlEle.foldAnimationTimer && clearTimeout(logDayUlEle.foldAnimationTimer);
                delete logDayUlEle.foldAnimationTimer;
                if (target.innerHTML === '展开') {
                  target.innerHTML = '折叠';
                  var oldSscrollHeight = logDayUlEle.getAttribute('data-height');
                  logDayUlEle.style.transition = 'height 1s ease-in-out, opacity 1s ease-in-out';
                  logDayUlEle.style.display = null;
                  logDayUlEle.offsetHeight;  // logDayUlEle 强制重绘
                  logDayUlEle.style.opacity = null;
                  if (oldSscrollHeight) {
                    logDayUlEle.style.height = oldSscrollHeight+'px';
                    logDayUlEle.foldAnimationTimer = setTimeout(function() {
                      delete logDayUlEle.foldAnimationTimer;
                      logDayUlEle.style.transition = null;
                      logDayUlEle.style.height = null;
                    }, 1000);
                  } else {
                    logDayUlEle.style.transition = null;
                    logDayUlEle.style.height = null;
                  }
                } else {
                  target.innerHTML = '展开';
                  logDayUlEle.setAttribute('data-height', logDayUlEle.scrollHeight);
                  logDayUlEle.style.transition = 'none';
                  logDayUlEle.style.height = logDayUlEle.scrollHeight + 'px';
                  logDayUlEle.style.transition = 'height 1s ease-in-out, opacity 1s ease-in-out';
                  logDayUlEle.offsetHeight;  // logDayUlEle 强制重绘
                  logDayUlEle.style.height = '0';
                  logDayUlEle.style.opacity = '0';
                  logDayUlEle.foldAnimationTimer = setTimeout(function() {
                    delete logDayUlEle.foldAnimationTimer;
                    logDayUlEle.style.display = 'none';
                    logDayUlEle.style.transition = null;
                  }, 1000);
                }
                return;
              }
            };
          })(ipsStatsKey, ipsStatsEle);

          for (var i=0, len=ipsStatsDataDays.length; i<len; i++) {
            var logDay = ipsStatsDataDays[i];
            var logDayData = ipsStatsData[logDay];
            var logDayEle = document.createElement('div');
            logDayEle.className = ipsStatsKey+'-log-day';
            logDayEle.innerHTML = '<h5 class="'+ipsStatsKey+'-log-day-title" ><span class="day-content">'+logDay+'</span><button class="'+ipsStatsKey+'-log-day-ul-fold-btn">折叠</button></h5>';
            ipsStatsEle.appendChild(logDayEle);
            var logDayUlEle = document.createElement('ul');
            logDayUlEle.className = ipsStatsKey+'-log-day-ul';
            logDayEle.appendChild(logDayUlEle);

            let totalPvCount = 0; // 总访问次数
            let totalIpCount = 0; // 总IP数
            for (var ip in logDayData) {
              var ipCount = logDayData[ip][0];
              totalPvCount += ipCount;
              totalIpCount++;
              var ipLocation = logDayData[ip][1];
              // console.debug('ipsStatsData => ip:', ip, 'count:', ipCount, 'location:', ipLocation);
              var ipLiEle = document.createElement('li');
              ipLiEle.className = ipsStatsKey+'-log-day-ip-li';
              ipLiEle.innerHTML =
                '<span class="'+ipsStatsKey+'-log-day-ip-info-warpper">'
                  +'<span class="ip-info-warpper">'
                    +'<span class="ip-content">'+ip+'</span>'
                    +(ipLocation?'(<span class="ip-location-content">'+ipLocation+'</span>)':'')
                  +'</span>'
                  +'<span class="ip-count-warpper">'
                    +'<span class="count-title">访问次数：</span>'
                    +'<span class="count-content">'+ipCount+'</span>'
                  +'</span>'
                +'</span>'
                +'<button class="'+ipsStatsKey+'-log-day-ip-detail-btn" data-ip="'+ip+'" data-day="'+logDay+'">详细日志</button>';
              logDayUlEle.appendChild(ipLiEle);
            }

            // logDayEle.querySelector('.'+ipsStatsKey+'-log-day-title').innerHTML += '<span class="total-count-content">（共'+totalCount+'次）</span>';
            logDayEle.querySelector('.'+ipsStatsKey+'-log-day-title').innerHTML += '<span class="total-pv-count-content">（'+totalIpCount+'个IP访问'+totalPvCount+'次）</span>';
          }
        }

        sendNotice('api:get:site_counter_ips_stats', {data: apiResult})
      });
    }
  }, 100);

  /** 
   * 请求日志API
   * @param filterType {site|site-page} 日志类型，'site' |'site-page'
   * @param filterDay {string} 哪一天日志，格式：'2024-05-06'
   * @param filterIp {string} [可选]过滤的客户端IP
   * @param onCallback {function} [可选]请求成功回调函数，参数：(err, res)
   */
  window.requestQiushaocloudSiteCounterLogsApiByFilter = function(
    filterType,
    filterDay,
    filterIp,
    onCallback
  ) {
    console.debug('requestQiushaocloudSiteCounterLogsApiByFilter:', filterType, filterIp, filterDay, !!onCallback);
    if (!(filterType && filterDay && /^(site|site-page)$/.test(filterType) && /^\d{4}-\d{2}-\d{2}$/.test(filterDay))) {
      console.error('requestQiushaocloudSiteCounterLogsApiByFilter err: invalid params', filterType, filterDay, filterIp);
      return typeof onCallback === 'function' && onCallback('requestQiushaocloudSiteCounterLogsApiByFilter err: invalid params', {});
    }

    var siteIpsStatsEle = document.getElementById('qiushaocloud_sitecounter_value_site_ips_stats');
    var sitePageIpsStatsEle = document.getElementById('qiushaocloud_sitecounter_value_site_page_ips_stats');

    if (filterType === 'site' && !siteIpsStatsEle) {
      console.error('requestQiushaocloudSiteCounterLogsApiByFilter err: is_only_site is true but qiushaocloud_sitecounter_value_site_ips_stats element is not exist', filterType, filterDay, filterIp);
      return typeof onCallback === 'function' && onCallback('is_only_site is true but qiushaocloud_sitecounter_value_site_ips_stats element is not exist', {});
    }

    if (filterType === 'site-page' && !sitePageIpsStatsEle) {
      console.error('requestQiushaocloudSiteCounterLogsApiByFilter err: is_only_page is true but qiushaocloud_sitecounter_value_site_page_ips_stats element is not exist', filterType, filterDay, filterIp);
      return typeof onCallback === 'function' && onCallback('is_only_page is true but qiushaocloud_sitecounter_value_site_page_ips_stats element is not exist', {});
    }

    var apiLogsOpts = {date_range: filterDay}; // {site_page_pathname, date_range, is_only_page, filter_client_ip}
    filterIp && (apiLogsOpts.filter_client_ip = filterIp);

    if (sitePageIpsStatsEle && filterType === 'site-page') {
      apiLogsOpts.site_page_pathname = sitePageIpsStatsEle.getAttribute('data-site-page-pathname') || getSitePagePathname();
      apiLogsOpts.is_only_page = true;
    }

    reqSiteCounterLogsAPI(getSiteHost(), apiLogsOpts, function (err, res) {
      if (err) {
        console.error('requestQiushaocloudSiteCounterLogsApiByFilter err:', err, filterType, filterDay, filterIp);
        sendNotice('api:get:site_counter_logs:ip', {
          filterType,
          filterDay,
          filterIp,
          err: err,
          data: res
        });
        typeof onCallback === 'function' && onCallback(err, res);
        return;
      }

      // console.debug('requestQiushaocloudSiteCounterLogsApiByFilter res:', res, filterType, filterDay, filterIp);
      var apiResult = JSON.parse(res);
      sendNotice('api:get:site_counter_logs:ip', {
        filterType,
        filterDay,
        filterIp,
        data: apiResult
      });
      typeof onCallback === 'function' && onCallback(undefined, res);
    });
  }

  function createLogsTableToUI (logsData, parentEle, opts) {
    !opts && (opts = {});
    if (!logsData || !Array.isArray(logsData) || logsData.length === 0) {
      console.error('createLogsTableToUI err: logsData is not exist or not array or empty');
      return;
    }

    !parentEle && (parentEle = document.body);

    document.getElementById('qiushaocloud_sitecounter_logs_box') && document.getElementById('qiushaocloud_sitecounter_logs_box').remove();

    var logsBox = document.createElement('div');
    logsBox.id = 'qiushaocloud_sitecounter_logs_box';
    logsBox.className = 'site-counter-logs-box' + (opts.boxClass ? ' '+opts.boxClass : '');
    parentEle.appendChild(logsBox);

    var logsTitle = document.createElement('h3');
    logsTitle.className = 'site-counter-logs-title';
    logsTitle.innerHTML = '<span class="title-content">'+(opts.boxTitle || '访问日志')+'</span>';
    logsBox.appendChild(logsTitle);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'site-counter-logs-close-btn';
    closeBtn.innerHTML = '关闭';
    closeBtn.onclick = function () {
      closeBtn.onclick = null;
      document.getElementById('qiushaocloud_sitecounter_logs_box') && document.getElementById('qiushaocloud_sitecounter_logs_box').remove();
    };
    logsTitle.appendChild(closeBtn);

    var logsTableBox = document.createElement('div');
    logsTableBox.className = 'site-counter-logs-table-box';
    logsBox.appendChild(logsTableBox);
    var logsTable = document.createElement('table');
    logsTable.className = 'site-counter-logs-table';
    logsTableBox.appendChild(logsTable);
    var theadTr = document.createElement('thead');
    theadTr.className = 'site-counter-logs-table-thead';
    theadTr.innerHTML = '<th>序号</th><th>时间</th><th>IP</th><th>IP信息</th><th>UserAgent</th><th>Href</th>';
    logsTable.appendChild(theadTr);
    var tbody = document.createElement('tbody');
    tbody.className = 'site-counter-logs-table-tbody';
    logsTable.appendChild(tbody);

    for (var i=0, len=logsData.length; i<len; i++) {
      var logData = logsData[i];
      var trEle = document.createElement('tr');
      trEle.innerHTML = '<td data-label="序号">'+(i+1)+'</td><td data-label="时间">'+getCurrFormatTs(logData[0])+'</td><td data-label="IP">'+logData[1]+'</td><td data-label="IP信息">'+logData[2]+'</td><td data-label="UserAgent">'+logData[3]+'</td><td data-label="Href">'+(logData[4] || '-')+'</td>';
      tbody.appendChild(trEle);
    }
  }

  function getSiteHost () {
    var siteHost = window.location.host;
    if (window.location.protocol === 'file:' && !siteHost)
      siteHost = 'local_file_site';
    return siteHost;
  }

  function getSitePagePathname () {
    if (window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_PATHNAME)
      return window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_PATHNAME;

    var sitePagePathname = window.location.pathname + (window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_ID || '');
    return sitePagePathname;
  }

  function getLocationHref () {
    if (window.QIUSHAOCLOUD_SITE_COUNTER_LOCATION_HREF)
      return window.QIUSHAOCLOUD_SITE_COUNTER_LOCATION_HREF;

    return window.location.href;
  }

  function sendNotice(type, data) {
    if (!window.qiushaocloudSiteCounterNotice || typeof window.qiushaocloudSiteCounterNotice !== 'function') return;
    window.qiushaocloudSiteCounterNotice(type, data);
  }

  function getCurrFormatTs (date, isOnlyGetSec, isOnlyDay) {
    if (!date || typeof date === 'number' || typeof date ==='string') {
      if (typeof date === 'number' || (typeof date ==='string' && !/^\d+$/.test(date)))
        date = new Date(date);
      else if (typeof date ==='string')
        date = new Date(Number(date));
      else
        date = new Date();
    }
    
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
  
    if (month < 10)
      month = '0' + month;
  
    if (day < 10)
      day = '0' + day;
  
    if (isOnlyDay)
      return year + '-' + month + '-' + day; 
    
    if (hours < 10)
      hours = '0' + hours;
  
    if (minutes < 10)
      minutes = '0' + minutes;
  
    if (seconds < 10)
      seconds = '0' + seconds;
  
    if (isOnlyGetSec)
      return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
      
    var milliseconds = date.getMilliseconds();

    if (milliseconds < 10)
      milliseconds = '00' + milliseconds;
    else if (milliseconds < 100)
      milliseconds = '0' + milliseconds;

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
  }

  var cacheAjaxRequests = [];
  var isSendingAjaxRequests = false;
  function sequentialAjaxRequest (url, data, opts, onCallback) {
    if (isSendingAjaxRequests)
      return cacheAjaxRequests.push([url, data, opts, onCallback]);

    isSendingAjaxRequests = true;
    ajaxRequest(url, data, opts, function (err, res) {
      isSendingAjaxRequests = false;

      try {
        typeof onCallback === 'function' && onCallback(err, res);
      } catch (catchErr) {
        console.error('sequentialAjaxRequest run onCallback catch err:', catchErr);
      }

      if (cacheAjaxRequests.length > 0) {
        var nextReq = cacheAjaxRequests.shift();
        sequentialAjaxRequest(nextReq[0], nextReq[1], nextReq[2], nextReq[3]);
      }
    });
  }

  function ajaxRequest (url, data, opts, onCallback) {
    console.debug('ajaxRequest:', url, data, opts, !!onCallback);
    !opts && (opts = {});
    var method = (opts.method || 'POST').toUpperCase();
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
  
    if (opts.headers) {
      for (var key in opts.headers) {
        xhr.setRequestHeader(key, opts.headers[key]);
      }
    }

    if (method === 'POST' && typeof data === 'object' && !(data instanceof FormData)) {
      var formData = new FormData();
      for (var key in data) {
        var val = data[key];
        if (val === undefined)
          continue;
      
        formData.append(key, val);
      }
      data = formData;
    } else if (method === 'GET' && typeof data === 'object') {
      for (var key in data) {
        var val = data[key];
        if (val === undefined)
          continue;
      
        url += (url.indexOf('?') === -1 ? '?' : '&') + key + '=' + val;
      }
      data = null;
    } else if (method === 'GET' && typeof data ==='string') {
      url += (url.indexOf('?') === -1 ? '?' : '&') + data;
      data = null;
    }

    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        if (this.status >= 200 && this.status < 300 ){
          console.debug('ajaxRequest success:', method, url);
          onCallback(undefined, this.responseText);
        }else{
          console.error('Error status:'+this.status, this.responseText);
          onCallback('Error status:'+this.status, this.responseText);
        }
      }
    });
  
    xhr.open(method, url, true);
    xhr.send(data);

    return xhr;
  }

  function getApiAddr () {
    var apiHost = window.localStorage.getItem('qiushaocloud_sitecounter_api_host') || YOUR_SERVER_HOST;
    var protocol = window.location.protocol;
    var apiAddr = /(https:\/\/|http:\/\/)/g.test(apiHost) ? apiHost : ((protocol === 'file:' ? 'https:' : protocol)+'//'+apiHost);
    return apiAddr;
  }

  function addExtraRequestData (data) {
    !data.nonce_ts && (data.nonce_ts = Date.now());
    !data.nonce && (data.nonce = Math.random().toString(36).substr(2, 10));
    data.sign = getCustomApiSign(data, (data.site_host || '') + API_SIGN_SECRET_KEY);
  }

  function reqSiteCounterAPI (
    siteHost,
    sitePagePathname,
    isIncrSite,
    isIncrSitePage,
    isSiteHistroySession,
    isSitePageHistroySession,
    locationHref,
    onCallback
  ) {
    var reqJson = {
      site_host: siteHost,
      is_incr_site: isIncrSite || false,
      nonce_ts: Date.now(),
      nonce: Math.random().toString(36).substr(2, 10),
    };

    isIncrSite && isSiteHistroySession !== undefined && (reqJson.is_histroy_session = isSiteHistroySession);

    if (isIncrSite || (sitePagePathname && isIncrSitePage)) {
      reqJson.href = locationHref;
    }

    if (sitePagePathname) {
      reqJson.site_page_pathname = sitePagePathname;
      reqJson.is_incr_page = isIncrSitePage || false;
      isSitePageHistroySession !== undefined && (reqJson.is_histroy_session_page = isSitePageHistroySession);
    }
    
    addExtraRequestData(reqJson);
    sequentialAjaxRequest(getApiAddr() + "/site_counter", reqJson, {method: 'POST'}, onCallback);
  }

  function reqSiteCounterIpsStatsAPI (
    siteHost,
    opts,
    onCallback
  ) {
    !opts && (opts = {});
    // opts = {site_page_pathname, date_range, site_page_date_range, is_only_page, filter_client_ip}

    var site_page_date_range = opts.site_page_date_range;
    delete opts.site_page_date_range;
    if (opts.site_page_pathname && site_page_date_range !== opts.date_range) {
      if (opts.site_page_pathname && opts.is_only_page) { // 只请求 site_page 数据
        var reqParams = {site_host: siteHost};
        Object.assign(reqParams, opts, {date_range: site_page_date_range});
        addExtraRequestData(reqParams);
        sequentialAjaxRequest(getApiAddr() + "/site_counter_ips_stats", reqParams, {method: 'GET'}, onCallback);
        return;
      }
   
      // 请求时间范围不同，分开请求
      var siteIpsStatsResult = undefined;
      var pageIpsStatsResult = undefined;

      var checkFinshedRequest = function () {
        if (siteIpsStatsResult === undefined || pageIpsStatsResult === undefined) return;
        console.debug('reqSiteCounterIpsStatsAPI site and page ips stats success:', siteIpsStatsResult, pageIpsStatsResult);

        if (siteIpsStatsResult === null || pageIpsStatsResult === null) {
          console.error('reqSiteCounterIpsStatsAPI site and page ips stats failed');
          return onCallback('reqSiteCounterIpsStatsAPI site and page ips stats failed', null);
        }

        var mergedResult = Object.assign({}, siteIpsStatsResult || {}, pageIpsStatsResult || {});
        onCallback(undefined, JSON.stringify(mergedResult));
      }

      // 请求 site 数据
      var reqSiteParams = {site_host: siteHost};
      opts.date_range && (reqSiteParams.date_range = opts.date_range);
      opts.filter_client_ip && (reqSiteParams.filter_client_ip = opts.filter_client_ip);
      addExtraRequestData(reqSiteParams);
      sequentialAjaxRequest(getApiAddr() + "/site_counter_ips_stats", reqSiteParams, {method: 'GET'}, function (err, res) {
        if (err) {
          console.error('reqSiteCounterIpsStatsAPI reqSiteParams err:', err, reqSiteParams);
          siteIpsStatsResult = null;
          checkFinshedRequest();
          return;
        }

        siteIpsStatsResult = JSON.parse(res);
        checkFinshedRequest();
      });

      // 请求 site_page 数据
      var reqPageParams = {site_host: siteHost, site_page_pathname: opts.site_page_pathname};
      site_page_date_range && (reqPageParams.date_range = site_page_date_range);
      opts.filter_client_ip && (reqPageParams.filter_client_ip = opts.filter_client_ip);
      reqPageParams.is_only_page = true;
      addExtraRequestData(reqPageParams);
      sequentialAjaxRequest(getApiAddr() + "/site_counter_ips_stats", reqPageParams, {method: 'GET'}, function (err, res) {
        if (err) {
          console.error('reqSiteCounterIpsStatsAPI reqPageParams err:', err, reqPageParams);
          pageIpsStatsResult = null;
          checkFinshedRequest();
          return;
        }

        pageIpsStatsResult = JSON.parse(res);
        checkFinshedRequest();
      });
      
      return;
    }

    var reqParams = {site_host: siteHost};
    Object.assign(reqParams, opts);
    addExtraRequestData(reqParams);
    sequentialAjaxRequest(getApiAddr() + "/site_counter_ips_stats", reqParams, {method: 'GET'}, onCallback);
  }

  function reqSiteCounterLogsAPI (
    siteHost,
    opts,
    onCallback
  ) {
    !opts && (opts = {});
    // opts = {site_page_pathname, date_range, is_only_page, filter_client_ip}
    var reqParams = {site_host: siteHost};
    Object.assign(reqParams, opts);
    addExtraRequestData(reqParams);
    sequentialAjaxRequest(getApiAddr() + "/site_counter_logs", reqParams, {method: 'GET'}, onCallback)
  }

  function customEncrypt (str, secretKey, customEncryptTs) {
    ranNum = customEncryptTs || 1234567890123;
  
    for (var i = 0; i < str.length; i++) {
      var character = str.charCodeAt(i);
      var charIndex = character%secretKey.length;
      var secretCode = secretKey.charCodeAt(character%secretKey.length);
      ranNum += (character * charIndex * (secretCode + character) + (ranNum % character));
    }
  
    return customEncryptTs+'_'+ranNum;
  }

  function getCustomApiSign (requestData, secretKey) {
    var sign = '';

    var keys = [];
    for (var key in requestData) {
      if (requestData[key] === undefined)
        continue;
        
      keys.push(key);
    }
    keys.sort();

    for (var i=0, len=keys.length; i<len; i++) {
      var key = keys[i];
      sign += (key + requestData[key]);
    }

    return customEncrypt(sign, secretKey, requestData['nonce_ts']);

    // 您可以使用 sha256 加密签名，对应服务器也使用 sha256 即可
    // return sha256Encrypt(sign);
  };
})();