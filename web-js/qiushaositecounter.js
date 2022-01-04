(function(){
  var CUSTOM_HOST = 'www.qiushaocloud.top';

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
  
  var timer = setInterval(function() {
    var sitePvEle = document.getElementById('qiushaositecounter_value_site_pv');
    var siteUvEle = document.getElementById('qiushaositecounter_value_site_uv');
    var todaySitePvEle = document.getElementById('qiushaositecounter_value_today_site_pv');
    var todaySiteUvEle = document.getElementById('qiushaositecounter_value_today_site_uv');
  }, interval);
})();