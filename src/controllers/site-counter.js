const {
  router,
  productPostRouter,
  verifySign,
  getAllReqParams,
  API_SIGN_SECRET_KEY
} = require('./router-base');
const siteCounterHandler = require('./handlers/site-counter');
const {getLogger} = require('../log');
const log = getLogger('API');
const ipsLog = getLogger('RequestIps');

const {
  FailResStateCode
} = require('../enum/api-fail-code');
const utils = require('../helepers/utils');

productPostRouter(router, '/incr_site_count', (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const allParams = getAllReqParams(req);

  log.debug('call /incr_site_count, allParams:', allParams,
    ' ,clientIp:', clientIp,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );
  ipsLog.info(
    'request /incr_site_count api',
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