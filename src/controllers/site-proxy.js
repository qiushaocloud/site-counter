const {
  router,
  productGetRouter,
} = require('./router-base');
const axios = require('axios');
const {getLogger} = require('../log');
const log = getLogger('API');

const cacheGravatarImageRedirectResults = {}; // 缓存已经请求过的 gravatar 图片的重定向结果，格式: {gravatarImageUrl: {redirectUrl, saveTs}}
const gravatarOfficialDefaultImageBase64s = {}; // 缓存官方默认头像的 base64 图片缓存，格式：{md5Length: {base64, saveTs}}

// 定期清理缓存，每隔 10 分钟执行一次
setInterval(() => {
  const now = Date.now();

  // 清理 cacheGravatarImageRedirectResults 缓存
  for (const gravatarImageUrl in cacheGravatarImageRedirectResults) {
    const {saveTs} = cacheGravatarImageRedirectResults[gravatarImageUrl];
    if (now - saveTs > 30 * 60 * 1000) { // 如果缓存时间超过 30 分钟，则清理掉该缓存
      delete cacheGravatarImageRedirectResults[gravatarImageUrl];
    }
  }

  // 清理 gravatarOfficialDefaultImageBase64s 缓存
  for (const md5Length in gravatarOfficialDefaultImageBase64s) {
    const {saveTs} = gravatarOfficialDefaultImageBase64s[md5Length];
    if (now - saveTs > 120 * 60 * 1000) { // 如果缓存时间超过 120 分钟，则清理掉该缓存
      delete gravatarOfficialDefaultImageBase64s[md5Length];
    }
  }
}, 10 * 60 * 1000);

const requestImageBase64 = async (imgUrl) => {
  try {
    const response = await axios.get(imgUrl, {responseType: 'arraybuffer'});
    if (response.status === 200) {
      // 将响应数据转换成 base64
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      // log.debug('requestImageBase64 success imgUrl:', imgUrl, ' ,base64:', base64);
      return base64;
    }

    log.info('requestImageBase64 failure imgUrl:', imgUrl)
    return null;
  } catch (err) {
    log.error('requestImageBase64 catch err:', err, ' ,imgUrl:', imgUrl);
    return null;
  }
}

const getGravatarOfficialDefaultImageBase64 = async (avatarMd5) => {
  const md5Length = (avatarMd5 && typeof avatarMd5 === 'string') ? avatarMd5.length : 32;

  if (gravatarOfficialDefaultImageBase64s[md5Length])
    return gravatarOfficialDefaultImageBase64s[md5Length].base64; // 如果缓存中有官方默认头像的 base64 图片，则直接返回

  const gravatarAddr = `${process.env.GRAVATAR_ADDR || 'https://gravatar.com'}/avatar/`; // 如果环境变量配置了 GRAVATAR_ADDR 则使用该地址，否则使用默认地址 https://gravatar.com'
  let officialMd5 = '1234567890abcdfghijklmnopqrstuvwxyz'.substring(0, md5Length); // 官方默认头像的 md5 值，获取与 md5Length 相同长度的值
  if (officialMd5.length !== md5Length) {
    while (officialMd5.length < md5Length) {
      officialMd5 += officialMd5; // 如果官方默认头像的 md5 值长度小于 md5Length，则重复该值
      officialMd5 = officialMd5.substring(0, md5Length); // 截取 md5Length 长度的 md5 值
    }
  }
  let officialDefaultImageUrl = `${gravatarAddr}${officialMd5}`; // 官方默认头像的地址
  const officialDefaultImageBase64 = await requestImageBase64(officialDefaultImageUrl); // 请求官方默认头像的 base64 图片
  if (officialDefaultImageBase64) {
    gravatarOfficialDefaultImageBase64s[md5Length] = {base64: officialDefaultImageBase64, saveTs: Date.now()}; // 缓存官方默认头像的 base64 图片
    log.info('getGravatarOfficialDefaultImageBase64 success officialDefaultImageUrl:', officialDefaultImageUrl, ' ,officialDefaultImageBase64:', officialDefaultImageBase64);
    return officialDefaultImageBase64;
  }

  log.info('getGravatarOfficialDefaultImageBase64 officialDefaultImageBase64 is null')
  return null;
}

// gravatar 头像代理获取，格式例如：/site_proxy/gravatar_image/avatar/8dc1e9ca2ba0c4164b10c45660b3788c 表示请求 https://gravatar.com/avatar/8dc1e9ca2ba0c4164b10c45660b3788c
productGetRouter(router, '/site_proxy/gravatar_image/avatar/:avatarMd5', async (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const {avatarMd5} = req.params;
  const gravatarAddr = `${process.env.GRAVATAR_ADDR || 'https://gravatar.com'}/avatar/`; // 如果环境变量配置了 GRAVATAR_ADDR 则使用该地址，否则使用默认地址 https://gravatar.com'
  const gravatarImageUrl = `${gravatarAddr}${avatarMd5}`; // 完整的gravatar图片地址

  log.debug('call /site_proxy/gravatar_image/:avatarMd5',
    ' ,avatarMd5:', avatarMd5,
    ' ,gravatarImageUrl:', gravatarImageUrl,
    ' ,clientIp:', clientIp,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );

  if (cacheGravatarImageRedirectResults[gravatarImageUrl]) { // 如果已经请求过该 gravatar 图片的重定向结果，则直接返回
    const {redirectUrl} = cacheGravatarImageRedirectResults[gravatarImageUrl];
    log.debug('/site_proxy/gravatar_image/:avatarMd5 cache hit, redirect gravatarImageUrl:', gravatarImageUrl, ' ,redirectUrl:', redirectUrl, ' ,clientIp:', clientIp, ' ,req.ip:', req.ip, ' ,user-agent:', req.headers['user-agent'], ' ,apiId:', apiId);
    return res.redirect(redirectUrl);
  }

  const defaultGravatarImageUrl = process.env.DEFAULT_GRAVATAR_IMAGE_URL; // 默认加载的头像地址
  if (defaultGravatarImageUrl) { // 配置了 DEFAULT_GRAVATAR_IMAGE_URL， 如果 gravatarImageUrl 加载失败或者加载的图片为官方默认头像的base64，则使用该默认图片
    const gravatarImageBase64 = await requestImageBase64(gravatarImageUrl); // 请求 gravatarImageUrl 图片的 base64
    if (!gravatarImageBase64) {
      log.info('/site_proxy/gravatar_image/:avatarMd5 gravatarImage failure gravatarImageUrl:', gravatarImageUrl, ' ,redirect defaultGravatarImageUrl:', defaultGravatarImageUrl);
      return res.redirect(defaultGravatarImageUrl); // 请求 gravatarImageUrl 图片失败，则重定向到默认图片
    }

    const officialDefaultImageBase64 = await getGravatarOfficialDefaultImageBase64(avatarMd5); // 获取官方默认头像的base64
    if (officialDefaultImageBase64 && gravatarImageBase64 === officialDefaultImageBase64) { // 如果 gravatarImageUrl 加载的图片为官方默认头像的base64，则重定向到默认图片
      log.debug('/site_proxy/gravatar_image/:avatarMd5 gravatarImage is officialDefaultImageBase64, redirect defaultGravatarImageUrl:', defaultGravatarImageUrl, ' ,gravatarImageUrl:', gravatarImageUrl);
      cacheGravatarImageRedirectResults[gravatarImageUrl] = {redirectUrl: defaultGravatarImageUrl, saveTs: Date.now()}; // 缓存该 gravatar 图片的重定向结果
      return res.redirect(defaultGravatarImageUrl);
    }

    log.debug('/site_proxy/gravatar_image/:avatarMd5 gravatarImage success, redirect gravatarImageUrl:', gravatarImageUrl);
    cacheGravatarImageRedirectResults[gravatarImageUrl] = {redirectUrl: gravatarImageUrl, saveTs: Date.now()}; // 缓存该 gravatar 图片的重定向结果
    res.redirect(gravatarImageUrl);
    return;
  }

  // 环境变量没有配置 DEFAULT_GRAVATAR_IMAGE_URL，则直接重定向到 gravatarImageUrl 地址
  log.debug('/site_proxy/gravatar_image/:avatarMd5 env no DEFAULT_GRAVATAR_IMAGE_URL, redirect gravatarImageUrl:', gravatarImageUrl);
  res.redirect(gravatarImageUrl);
});