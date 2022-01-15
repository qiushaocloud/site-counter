require('./site-counter');
const axios = require('axios');
const {getLogger} = require('../log');
const {FailResStateCode} = require('../enum/api-fail-code');
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
  const clientIps = (req.headers['x-forwarded-for'] || req.ip).replace(/ /g, '').split(',');
  const searchIp = getReqParams(req, 'ip');
  const lastClientIp = clientIps[clientIps.length - 1];

  log.debug('call /get_ip_location',
    ' ,searchIp:', searchIp,
    ' ,clientIps:', clientIps,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );

  const axiosConfig = {
    method: 'get',
    url: `http://yuanxiapi.cn/api/iplocation?ip=${searchIp || lastClientIp}`
  };

  axios(axiosConfig)
    .then((response) => {
      const {code, ip, location} = response.data;
      
      if (Number(code) !== 200) {
        log.info('get_ip_location api is fail',
          ',response:', response.data,
          ' ,apiId:', apiId
        );

        res.status(401).send({
          code: FailResStateCode.FAILURE,
          message: 'get_ip_location api fail, code:' + code
        });
        return;
      }
    
      log.debug('get_ip_location api success',
        ',response:', response.data,
        ' ,apiId:', apiId
      );

      const resultJson = {
        ip,
        location,
        client_ips: clientIps
      };

      res.json(resultJson);
    })
    .catch((error) => {
      log.error('get_ip_location catch error:', error, ' ,apiId:', apiId);
      res.status(401).send({
        code: FailResStateCode.FAILURE,
        message: 'get_ip_location catch error'
      });
    });
});

module.exports = router;