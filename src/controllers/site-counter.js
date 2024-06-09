const {
  router,
  productGetRouter,
  productPostRouter,
  verifySign,
  getAllReqParams,
  API_SIGN_SECRET_KEY
} = require('./router-base');
const siteCounterHandler = require('./handlers/site-counter');
const {getLogger} = require('../log');
const ipsLog = getLogger('RequestIps');
const {FailResStateCode} = require('../enum/api-fail-code');
const utils = require('../helepers/utils');
const dbServiceInstance = require('../services/db-service');
const log = getLogger('API');

productPostRouter(router, '/site_counter', (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const allParams = getAllReqParams(req);

  log.debug('call post /site_counter, allParams:', allParams,
    ' ,clientIp:', clientIp,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );

  const {
    site_host: siteHost,
    site_page_pathname: sitePagePathname,
    is_incr_site: isIncrSite,
    is_incr_page: isIncrPage,
    is_histroy_session: isHistroySession,
    is_histroy_session_page: isHistroySessionPage,
    href: href
  } = allParams;

  if (!siteHost) {
    log.error('invalid params, apiId:', apiId);
    res.status(400).send({
      code: FailResStateCode.INVALID_PARAMS,
      message: 'invalid params'
    });
    return;
  }

  if (API_SIGN_SECRET_KEY && !verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
    log.error('Unauthorized, invalid sign, apiId:', apiId);
    res.status(401).send({
      code: FailResStateCode.UNAUTHORIZED,
      message: 'invalid sign'
    });
    return;
  }

  let siteHostTmp = siteHost;
  if (siteHost.split(".").length === 2) {
    siteHostTmp = 'www.'+siteHost;
  }

  const isIncrSiteBool = utils.toParseBoolean(isIncrSite);
  const isIncrPageBool = sitePagePathname && (isIncrPage === undefined || utils.toParseBoolean(isIncrPage));

  siteCounterHandler.incrSiteCount(
    siteHostTmp,
    sitePagePathname,
    isIncrSiteBool,
    isIncrPageBool,
    utils.toParseBoolean(isHistroySession),
    isHistroySessionPage === undefined ? undefined : utils.toParseBoolean(isHistroySessionPage),
    (err, result) => {
      if (err) {
        log.error('incrSiteCount err:', err, ' ,apiId:', apiId);
        res.status(400).send({
          code: FailResStateCode.FAILURE,
          message: typeof err === 'object' ? err.message : 'incrSiteCount err'
        });
        return;
      }

      if (isIncrSiteBool || isIncrPageBool) {
        let incrType = isIncrSiteBool ? 'site' : '';
        if (isIncrPageBool)
          incrType += ((incrType ? 'and' : '') +'page');

        dbServiceInstance.insertSiteCounterIpRecord({
          site_host: siteHost,
          page_pathname: sitePagePathname,
          user_agent: req.headers['user-agent'],
          ip: clientIp,
          incr_type: incrType,
          href: href
        })
        ipsLog.info(
          'request post /site_counter api success',
          ' ,siteHost:'+siteHost,
          sitePagePathname ? ' ,sitePagePathname:'+sitePagePathname : '',
          ' ,clientIp:'+clientIp,
          ' ,user-agent:'+req.headers['user-agent'],
          ' ,apiId:'+apiId,
          ' ,incrType:'+incrType, // 'site' | 'page' | 'siteandpage'
          ' ,href:'+href
        );
      }

      res.json(result);
    }
  );
});

productGetRouter(router, '/site_counter_ips_stats', (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const allParams = getAllReqParams(req);

  log.debug('call get /site_counter_ips_stats, allParams:', allParams,
    ' ,clientIp:', clientIp,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );

  const {
    site_host: siteHost,
    site_page_pathname: sitePagePathname,
    date_range: dateRangeStr, // 最多一个月以内的日期范围，格式如: '31days' | '2024-05-06' | '2024-05-06,2024-05-10' | '2024-05-06 to 2024-05-10' ｜ '2024-05-06 to 2024-05-10,2024-05-15'
    is_only_page: isOnlyPage,
    filter_client_ip: filterClientIp
  } = allParams;

  if (!siteHost) {
    log.error('invalid params, apiId:', apiId);
    res.status(400).send({
      code: FailResStateCode.INVALID_PARAMS,
      message: 'invalid params'
    });
    return;
  }

  if (API_SIGN_SECRET_KEY && !verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
    log.error('Unauthorized, invalid sign, apiId:', apiId);
    res.status(401).send({
      code: FailResStateCode.UNAUTHORIZED,
      message: 'invalid sign'
    });
    return;
  }

  let siteHostTmp = siteHost;
  if (siteHost.split(".").length === 2) {
    siteHostTmp = 'www.'+siteHost;
  }

  siteCounterHandler.siteCounterIpsStats(
    siteHostTmp,
    {
      sitePagePathname,
      dateRangeStr,
      isOnlyPage: isOnlyPage === undefined ? undefined : utils.toParseBoolean(isOnlyPage),
      filterClientIp
    },
    (err, result) => {
      if (err) {
        log.error('siteCounterIpsStats err:', err, ' ,apiId:', apiId);
        res.status(400).send({
          code: FailResStateCode.FAILURE,
          message: typeof err === 'object' ? err.message : 'siteCounterIpsStats err'
        });
        return;
      }

      res.json(result);
    }
  );
});

productGetRouter(router, '/site_counter_logs', (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const allParams = getAllReqParams(req);

  log.debug('call get /site_counter_logs, allParams:', allParams,
    ' ,clientIp:', clientIp,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );

  const {
    site_host: siteHost,
    site_page_pathname: sitePagePathname,
    date_range: dateRangeStr, // 最多一个月以内的日期范围，格式如: '2024-05-06' | '2024-05-06,2024-05-10' | '2024-05-06 to 2024-05-10' ｜ '2024-05-06 to 2024-05-10,2024-05-15'
    is_only_page: isOnlyPage,
    filter_client_ip: filterClientIp
  } = allParams;

  if (!siteHost) {
    log.error('invalid params, apiId:', apiId);
    res.status(400).send({
      code: FailResStateCode.INVALID_PARAMS,
      message: 'invalid params'
    });
    return;
  }

  if (API_SIGN_SECRET_KEY && !verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
    log.error('Unauthorized, invalid sign, apiId:', apiId);
    res.status(401).send({
      code: FailResStateCode.UNAUTHORIZED,
      message: 'invalid sign'
    });
    return;
  }

  let siteHostTmp = siteHost;
  if (siteHost.split(".").length === 2) {
    siteHostTmp = 'www.'+siteHost;
  }

  siteCounterHandler.siteCounterLogs(
    siteHostTmp,
    {
      sitePagePathname,
      dateRangeStr,
      isOnlyPage: isOnlyPage === undefined ? undefined : utils.toParseBoolean(isOnlyPage),
      filterClientIp
    },
    (err, result) => {
      if (err) {
        log.error('siteCounterLogs err:', err, ' ,apiId:', apiId);
        res.status(400).send({
          code: FailResStateCode.FAILURE,
          message: typeof err === 'object' ? err.message : 'siteCounterLogs err'
        });
        return;
      }

      res.json(result);
    }
  );
});

module.exports = router;