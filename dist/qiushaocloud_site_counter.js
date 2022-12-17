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
  let addChatCodeNum = 0;
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

  var apiResult = {};
  var isIncredSite = false;
  var isIncredSitePage = false;
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

    var hasSiteEle = !!(sitePvEle || siteUvEle || todaySitePvEle || todaySiteUvEle);
    var hasSitePageEle = !!(sitePagePvEle || sitePageUvEle || todaySitePagePvEle || todaySitePageUvEle);

    if ((isIncredSite && isIncredSitePage) || currCheckCount > 1800) {
      timer && clearInterval(timer);
      timer = undefined;
      return;
    }

    if (!(hasSiteEle || hasSitePageEle) && !isIncredSite)
      return;

    if (!hasSitePageEle && isIncredSite && !isIncredSitePage)
      return;

    var nowTs = Date.now();
    var saveSiteTs = window.localStorage.getItem('qiushaocloud_sitecounter_session_save_ts');
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

      var saveDate = new Date(saveSiteTs);
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
        sitePagePathname = window.location.pathname + (window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_ID || '');
        isIncredSitePage = true;
      }

      window.localStorage.setItem('qiushaocloud_sitecounter_session_save_ts', Date.now());
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

          sitePagePvEle && (sitePagePvEle.innerHTML = sitePageUv);
          sitePageUvEle && (sitePageUvEle.innerHTML = siteUv);
          todaySitePagePvEle && (todaySitePagePvEle.innerHTML = todaySitePagePv);
          todaySitePageUvEle && (todaySitePageUvEle.innerHTML = todaySitePageUv);
        }
      );
    }
  }, 100);

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
      nonce_ts: Date.now()
    };

    reqJson.sign = getCustomApiSign(reqJson, siteHost + API_SIGN_SECRET_KEY);

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
          console.error('Error status:'+this.status, this.responseText);
          onCallback('Error status:'+this.status, this.responseText);
        }
      }
    });
  
    var apiHost = window.localStorage.getItem('qiushaocloud_sitecounter_api_host') || YOUR_SERVER_HOST;
    var protocol = window.location.protocol;
    var apiAddr = /(https:\/\/|http:\/\/)/g.test(apiHost) ? apiHost : ((protocol === 'file:' ? 'https:' : protocol)+'//'+apiHost);

    xhr.open("POST", apiAddr + "/site_counter", true);
  
    xhr.send(data);
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