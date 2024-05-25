const {
    router,
    productGetAndPostRouter,
    productPostRouter,
    verifySign,
    getAllReqParams,
    API_SIGN_SECRET_KEY
  } = require('./router-base');
  const siteRecordHandler = require('./handlers/site-counter');
  const {getLogger} = require('../log');
  const {FailResStateCode} = require('../enum/api-fail-code');
  const log = getLogger('API');
  
  productGetAndPostRouter(router, '/pull_site_records', (apiId, req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.ip;
    const allParams = getAllReqParams(req);
  
    log.debug(
      'call /pull_site_records, allParams:', allParams,
      ' ,clientIp:', clientIp,
      ' ,req.ip:', req.ip,
      ' ,user-agent:', req.headers['user-agent'],
      ' ,apiId:', apiId
    );
  
    const {
      site_host: siteHost,
      site_url: siteUrl
    } = allParams;
  
    if (!siteHost || !siteUrl) {
      log.error('pull_site_records invalid params, apiId:', apiId, ' ,allParams:', allParams);
  
      res.status(400).send({
        code: FailResStateCode.INVALID_PARAMS,
        message: 'invalid params'
      });
  
      return;
    }
  
    if (!verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
      log.error('pull_site_records Unauthorized, invalid sign, apiId:', apiId);
  
      res.status(401).send({
        code: FailResStateCode.UNAUTHORIZED,
        message: 'invalid sign'
      });
  
      return;
    }
  
    siteRecordHandler.pullSiteRecords(
      siteHost,
      siteUrl,
      (err, result) => {
        if (err) {
          log.error('pullSiteRecords err:', err, ' ,apiId:', apiId);
  
          res.status(400).send({
            code: FailResStateCode.FAILURE,
            message: typeof err === 'object' ? err.message : 'pullSiteRecords err'
          });
          return;
        }
  
        res.json(result);
      }
    );
  });

  productPostRouter(router, '/push_site_records', (apiId, req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.ip;
    const allParams = getAllReqParams(req);
  
    log.debug('call /push_site_records, allParams:', allParams,
      ' ,clientIp:', clientIp,
      ' ,req.ip:', req.ip,
      ' ,user-agent:', req.headers['user-agent'],
      ' ,apiId:', apiId
    );
  
    const {
      site_host: siteHost,
      site_urls: siteUrlsStr
    } = allParams;

    const siteUrls = typeof siteUrlsStr === 'string' ? siteUrlsStr.split(',') : [];
  
    if (!siteHost || !siteUrls.length) {
      log.error('push_site_records invalid params, apiId:', apiId, ' ,allParams:', allParams);
  
      res.status(400).send({
        code: FailResStateCode.INVALID_PARAMS,
        message: 'invalid params'
      });
  
      return;
    }
  
    if (!verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
      log.error('push_site_records Unauthorized, invalid sign, apiId:', apiId);
  
      res.status(401).send({
        code: FailResStateCode.UNAUTHORIZED,
        message: 'invalid sign'
      });
  
      return;
    }
  
    siteRecordHandler.pushSiteRecords(
      siteHost,
      siteUrls,
      (err, result) => {
        if (err) {
          log.error('pushSiteRecords err:', err, ' ,apiId:', apiId);
  
          res.status(400).send({
            code: FailResStateCode.FAILURE,
            message: typeof err === 'object' ? err.message : 'pushSiteRecords err'
          });
          return;
        }
  
        res.json(result);
      }
    );
  });

  productPostRouter(router, '/add_site_interval_push_record_task', (apiId, req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.ip;
    const allParams = getAllReqParams(req);

    log.debug('call /add_site_interval_push_record_task, allParams:', allParams,
      ' ,clientIp:', clientIp,
      ' ,req.ip:', req.ip,
      ' ,user-agent:', req.headers['user-agent'],
      ' ,apiId:', apiId
    );
  
    const {
      site_host: siteHost,
      site_urls: siteUrlsStr
    } = allParams;

    const siteUrls = typeof siteUrlsStr === 'string' ? siteUrlsStr.split(',') : [];
  
    if (!siteHost || !siteUrls.length) {
      log.error('add_site_interval_push_record_task invalid params, apiId:', apiId, ' ,allParams:', allParams);
  
      res.status(400).send({
        code: FailResStateCode.INVALID_PARAMS,
        message: 'invalid params'
      });
  
      return;
    }
  
    if (!verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
      log.error('add_site_interval_push_record_task Unauthorized, invalid sign, apiId:', apiId);
  
      res.status(401).send({
        code: FailResStateCode.UNAUTHORIZED,
        message: 'invalid sign'
      });
  
      return;
    }
  
    siteRecordHandler.addSiteIntervalPushRecordTask(
      siteHost,
      siteUrls,
      (err, result) => {
        if (err) {
          log.error('addSiteIntervalPushRecordTask err:', err, ' ,apiId:', apiId);
  
          res.status(400).send({
            code: FailResStateCode.FAILURE,
            message: typeof err === 'object' ? err.message : 'addSiteIntervalPushRecordTask err'
          });
          return;
        }
  
        res.json(result);
      }
    );
  });

  productPostRouter(router, '/del_site_interval_push_record_task', (apiId, req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.ip;
    const allParams = getAllReqParams(req);

    log.debug('call /del_site_interval_push_record_task, allParams:', allParams,
      ' ,clientIp:', clientIp,
      ' ,req.ip:', req.ip,
      ' ,user-agent:', req.headers['user-agent'],
      ' ,apiId:', apiId
    );
  
    const {
      site_host: siteHost,
      site_urls: siteUrlsStr
    } = allParams;

    const siteUrls = typeof siteUrlsStr === 'string' ? siteUrlsStr.split(',') : [];
  
    if (!siteHost || !siteUrls.length) {
      log.error('del_site_interval_push_record_task invalid params, apiId:', apiId, ' ,allParams:', allParams);
  
      res.status(400).send({
        code: FailResStateCode.INVALID_PARAMS,
        message: 'invalid params'
      });
  
      return;
    }
  
    if (!verifySign(req, siteHost+API_SIGN_SECRET_KEY, undefined, undefined, true)) {
      log.error('del_site_interval_push_record_task Unauthorized, invalid sign, apiId:', apiId);
  
      res.status(401).send({
        code: FailResStateCode.UNAUTHORIZED,
        message: 'invalid sign'
      });
  
      return;
    }
  
    siteRecordHandler.delSiteIntervalPushRecordTask(
      siteHost,
      siteUrls,
      (err, result) => {
        if (err) {
          log.error('delSiteIntervalPushRecordTask err:', err, ' ,apiId:', apiId);
  
          res.status(400).send({
            code: FailResStateCode.FAILURE,
            message: typeof err === 'object' ? err.message : 'delSiteIntervalPushRecordTask err'
          });
          return;
        }
  
        res.json(result);
      }
    );
  });
  
  module.exports = router;