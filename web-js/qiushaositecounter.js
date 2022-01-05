(function(){
  var CUSTOM_HOST = 'www.qiushaocloud.top';
  var SAVE_SESSION_DURATION = 1 * 60 * 60 * 1000;

  function reqSiteCounterAPI (
    siteMd5,
    sitePageMd5,
    isIncrSite,
    isHistroySession,
    onCallback
  ) {
    var data = new FormData();

    data.append("site_md5", siteMd5);

    if (sitePageMd5)
      data.append("site_page_md5", sitePageMd5);

    if (isIncrSite)
      data.append("is_incr_site", isIncrSite);

    if (isHistroySession)
      data.append("is_histroy_session", isHistroySession);
  
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
  
    xhr.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        console.log(this.responseText);
        onCallback(undefined, this.responseText);
      }
    });
  
    var apiHost = window.localStorage.getItem('qiushaositecounter_api_host') || CUSTOM_HOST;
    var apiAddr = /(https:\/\/|http:\/\/)/g.test(apiHost) ? apiHost : (window.location.protocol+'//'+apiHost);

    xhr.open("POST", apiAddr + "/site-counter");
  
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
    if (saveSiteTs && (nowTs - Number(saveSiteTs)) < SAVE_SESSION_DURATION)
      isHistroySession = true;

    if (hasSiteEle || hasSitePageEle) {
      var siteMd5 = window.location.host;
      var sitePageMd5 = siteMd5+'/'+window.location.pathname;
      var isIncrSite = !isIncredSite;

      isIncredSite = true;

      reqSiteCounterAPI(
        siteMd5,
        sitePageMd5,
        isIncrSite,
        isHistroySession,
        function (err, res) {
          if (err) {
            console.error('reqSiteCounterAPI err:', err);
            return;
          }
          
          apiResult = res;
        }
      );
    }
  }, 1000);
})();