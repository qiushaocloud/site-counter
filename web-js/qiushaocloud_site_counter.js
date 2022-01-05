(function(){
  var CUSTOM_HOST = 'www.qiushaocloud.top';
  var maxSaveSessionDuration = window.localStorage.getItem('qiushaositecounter_max_save_session_duration');
  var MAX_SAVE_SESSION_DURATION = maxSaveSessionDuration ? Number(maxSaveSessionDuration) : 24 * 60 * 60 * 1000;

  function reqSiteCounterAPI (
    siteHost,
    sitePagePathname,
    isIncrSite,
    isHistroySession,
    onCallback
  ) {
    var reqJson = {
      site_host: siteHost,
      site_page_pathname: sitePagePathname,
      is_incr_site: isIncrSite,
      is_histroy_session: isHistroySession,
    };


    var data = new FormData();
    for (var key in reqJson) {
      var val = reqJson[key];
      if (val === undefined)
        continue;
    
      data.append(key, val);
    }

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
  
    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        if (this.status >= 200 && this.status < 300 ){
          onCallback(undefined, this.responseText);
        }else{
          onCallback('Error status:'+this.status, this.responseText);
        }
      }
    });
  
    var apiHost = window.localStorage.getItem('qiushaositecounter_api_host') || CUSTOM_HOST;
    var protocol = window.location.protocol;
    var apiAddr = /(https:\/\/|http:\/\/)/g.test(apiHost) ? apiHost : ((protocol === 'file:' ? 'https:' : protocol)+'//'+apiHost);

    xhr.open("POST", apiAddr + "/site_counter", true);
  
    xhr.send(data);
  }
  
  var apiResult = {};
  var isIncredSite = false;
  var isIncredSitePage = false;
  var timer = undefined;
  var currCheckCount = 0;
  
  timer = setInterval(function() {
    currCheckCount++;

    var sitePvEle = document.getElementById('qiushaositecounter_value_site_pv');
    var siteUvEle = document.getElementById('qiushaositecounter_value_site_uv');
    var todaySitePvEle = document.getElementById('qiushaositecounter_value_today_site_pv');
    var todaySiteUvEle = document.getElementById('qiushaositecounter_value_today_site_uv');
    
    var sitePagePvEle = document.getElementById('qiushaositecounter_value_site_page_pv');
    var sitePageUvEle = document.getElementById('qiushaositecounter_value_site_page_uv');
    var todaySitePagePvEle = document.getElementById('qiushaositecounter_value_today_site_page_pv');
    var todaySitePageUvEle = document.getElementById('qiushaositecounter_value_today_site_page_uv');

    var hasSiteEle = !!(sitePvEle || siteUvEle || todaySitePvEle || todaySiteUvEle);
    var hasSitePageEle = !!(sitePagePvEle || sitePageUvEle || todaySitePagePvEle || todaySitePageUvEle);

    if ((isIncredSite && isIncredSitePage) || currCheckCount > 180) {
      timer && clearInterval(timer);
      timer = undefined;
      return;
    }

    var nowTs = Date.now();
    var saveSiteTs = window.localStorage.getItem('qiushaositecounter_session_save_ts');
    var isHistroySession = false;

    saveSiteTs = saveSiteTs ? Number(saveSiteTs) : undefined;
    if (saveSiteTs) {
      var currDate = new Date();
      var currYear = currDate.getFullYear();
      var currMonth = currDate.getMonth() + 1;
      var currDay = currDate.getDate();
      var currFormatDay = currYear
        + '-' + (currMonth < 10 ? '0'+currMonth : currMonth)
        + '-' + (currDay < 10 ? '0'+currDay : currDay);

      var saveDate = new Date();
      var saveYear = saveDate.getFullYear();
      var saveMonth = saveDate.getMonth() + 1;
      var saveDay = saveDate.getDate();
      var saveFormatDay = saveYear
        + '-' + (saveMonth < 10 ? '0'+saveMonth : saveMonth)
        + '-' + (saveDay < 10 ? '0'+saveDay : saveDay);

      if (currFormatDay === saveFormatDay && ((nowTs - saveSiteTs) < MAX_SAVE_SESSION_DURATION))
        isHistroySession = true;
    }
      
    if (hasSiteEle || hasSitePageEle) {
      var siteHost = window.location.host;
      var sitePagePathname = undefined;
      var isIncrSite = !isIncredSite;

      if (window.location.protocol === 'file:' && !siteHost)
        siteHost = 'local_file_site';
      
      isIncredSite = true;
      if (hasSitePageEle) {
        sitePagePathname = window.location.pathname;
        isIncredSitePage = true;
      }

      window.localStorage.setItem('qiushaositecounter_session_save_ts', Date.now());
      reqSiteCounterAPI(
        siteHost,
        sitePagePathname,
        isIncrSite,
        isHistroySession,
        function (err, res) {
          if (err) {
            console.error('reqSiteCounterAPI err:', err);
            return;
          }
          
          apiResult = JSON.parse(res);

          var yesterday = apiResult.yesterday;

          var sitePv = apiResult.site_pv;
          var siteUv = apiResult.site_uv;
          var todaySitePv = sitePv - yesterday.site_pv;
          var todaySiteUv = siteUv - yesterday.site_uv;

          var sitePagePv = apiResult.page_pv || 0;
          var sitePageUv = apiResult.page_uv || 0;
          var todaySitePagePv = sitePagePv - (yesterday.page_pv || 0);
          var todaySitePageUv = sitePageUv - (yesterday.page_uv || 0);

          sitePvEle && (sitePvEle.innerHTML = sitePv);
          siteUvEle && (siteUvEle.innerHTML = siteUv);
          todaySitePvEle && (todaySitePvEle.innerHTML = todaySitePv);
          todaySiteUvEle && (todaySiteUvEle.innerHTML = todaySiteUv);

          sitePagePvEle && (sitePagePvEle.innerHTML = sitePageUv);
          sitePageUvEle && (sitePageUvEle.innerHTML = siteUv);
          todaySitePagePvEle && (todaySitePagePvEle.innerHTML = todaySitePagePv);
          todaySitePageUvEle && (todaySitePageUvEle.innerHTML = todaySitePageUv);
        }
      );
    }
  }, 1000);
})();