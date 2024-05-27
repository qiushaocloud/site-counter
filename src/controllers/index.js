require('./site-counter');
require('./site-proxy');
const utils = require('../helepers/utils');
const {getLogger} = require('../log');
const IPService = require('../services/ip-service');
const log = getLogger('API');

const {
  router,
  productGetRouter,
  generateExpressReqInfo,
  getReqParams
} = require('./router-base');

productGetRouter(router, '/', (apiId, req, res) => {
  const resStr = 'site counter server runing'
    + ' <br />reqInfo:'+ JSON.stringify(generateExpressReqInfo(req))
    + '<br />author blog: <a href="https://www.qiushaocloud.top"> https://www.qiushaocloud.top </a>';

  log.debug('call /index resStr:', resStr, ' ,apiId:', apiId);

  res.send(resStr);
});

productGetRouter(router, '/get_ip_location', (apiId, req, res) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const clientIps = (xForwardedFor || req.ip).replace(/ /g, '').split(',');
  const searchIp = getReqParams(req, 'ip');
  const forceType = getReqParams(req, 'force_type') || undefined;
  const isCache = getReqParams(req, 'is_cache') !== undefined ? utils.toParseBoolean(getReqParams(req, 'is_cache')) : undefined;
  const lastClientIp = clientIps[clientIps.length - 1];

  log.debug('call get /get_ip_location',
    ' ,searchIp:', searchIp,
    ' ,lastClientIp:', lastClientIp,
    ' ,clientIps:', clientIps,
    ' ,xForwardedFor:', xForwardedFor,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,forceType:', forceType,
    ' ,apiId:', apiId
  );
  
  const searchIpTmp = searchIp || lastClientIp;
  IPService.search(searchIpTmp, {forceType, isCache})
    .then((resopnse) => {
      if (resopnse.code !== 200) {
        log.error('get_ip_location api fail, resopnse.code:', resopnse.code, ' ,resopnse:', resopnse, ' ,apiId:', apiId);
        return res.status(resopnse.code).send({
          code: resopnse.code,
          message: resopnse.data || 'get_ip_location api fail, code:' + resopnse.code
        });
      }
     
      const {location, ...addressInfo} = resopnse.data;
      log.debug('get_ip_location api success',
        ' ,searchIpTmp:', searchIpTmp,
        ' ,forceType:', forceType,
        ' ,location:', location,
        ' ,addressInfo:', addressInfo,
        ',resopnse:', resopnse,
        ' ,apiId:', apiId
      );

      const resultJson = {
        ip: searchIpTmp,
        location,
        addressInfo,
        client_ips: clientIps
      };

      res.json(resultJson);
    })
});

module.exports = router;