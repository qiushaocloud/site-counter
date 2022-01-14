const {
  router,
  productPostRouter,
  verifySign,
  getAllReqParams,
  API_SIGN_SECRET_KEY
} = require('./router-base');
const siteCounterHandler = require('./handlers/site-counter');
const {getLogger} = require('../log');
const ipsLog = getLogger('counterRequestIps');
const {FailResStateCode} = require('../enum/api-fail-code');
const utils = require('../helepers/utils');
const log = getLogger('API');

productPostRouter(router, '/site_counter', (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const allParams = getAllReqParams(req);

  log.debug('call /site_counter, allParams:', allParams,
    ' ,clientIp:', clientIp,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );
  ipsLog.info(
    'request /site_counter api',
    ' ,clientIp:', clientIp,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
    );

  const {
    site_host: siteHost,
    site_page_pathname: sitePagePathname,
    is_incr_site: isIncrSite,
    is_histroy_session: isHistroySession
  } = allParams;

  if (!siteHost) {
    log.error('invalid params, apiId:', apiId);

    res.status(401).send({
      code: FailResStateCode.INVALID_PARAMS,
      message: 'invalid params'
    });

    return;
  }

  if (!verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
    log.error('Unauthorized, invalid sign, apiId:', apiId);

    res.status(401).send({
      code: FailResStateCode.UNAUTHORIZED,
      message: 'invalid sign'
    });

    return;
  }

  siteCounterHandler.incrSiteCount(
    siteHost,
    sitePagePathname,
    utils.toParseBoolean(isIncrSite),
    utils.toParseBoolean(isHistroySession),
    (err, result) => {
      if (err) {
        log.error('incrSiteCount err:', err, ' ,apiId:', apiId);

        res.status(401).send({
          code: FailResStateCode.FAILURE,
          message: typeof err === 'object' ? err.message : 'incrSiteCount err'
        });
        return;
      }

      res.json(result);
    }
  );
});

module.exports = router;