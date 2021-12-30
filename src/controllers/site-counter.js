const {
  router,
  productPostRouter,
  verifySign,
  getAllReqParams,
  API_SIGN_SECRET_KEY
} = require('./router-base');
const {getLogger} = require('../log');
const log = getLogger('API');

const {
  FailResStateCode
} = require('../enum/api-fail-code');

productPostRouter(router, '/site_counter', (req, res) => {
  const clientIp = req.ip;
  const allParams = getAllReqParams(req);

  log.debug('call /site_counter, allParams:', allParams,
    ' ,clientIp:', clientIp,
    ' ,apiId:', apiId
  );

  const {
    site_host_md5: siteHostMd5,
    site_pathname_md5: sitePathnameMd5
  } = allParams;

  if (!siteHostMd5) {
    log.error('invalid params, apiId:', apiId);

    res.status(401).send({
      code: FailResStateCode.INVALID_PARAMS,
      message: 'invalid params'
    });

    return;
  }

  if (!verifySign(req, siteHostMd5+API_SIGN_SECRET_KEY)) {
    log.error('Unauthorized, invalid sign, apiId:', apiId);

    res.status(401).send({
      code: FailResStateCode.UNAUTHORIZED,
      message: 'invalid sign'
    });

    return;
  }
});

module.exports = router;