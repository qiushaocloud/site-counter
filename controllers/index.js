require('./site-counter');
const {getLogger} = require('../log');
const log = getLogger('API');

const {
  router,
  productGetRouter,
  generateExpressReqInfo
} = require('./router-base');


productGetRouter(router, '/', (apiId, req, res) => {
  const resStr = 'site counter server runing'
    + ' <br />reqInfo:'+ JSON.stringify(generateExpressReqInfo(req))
    + '<br />author blog: <a href="https://www.qiushaocloud.top"> https://www.qiushaocloud.top </a>';

  log.debug('call /index resStr:', resStr, ' ,apiId:', apiId);

  res.send(resStr);
});

module.exports = router;