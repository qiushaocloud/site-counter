const {
  router,
  productGetRouter,
} = require('./router-base');
const axios = require('axios');
const {getLogger} = require('../log');
const log = getLogger('API');

const cacheAvatarIsExistsResults = {}; // 缓存头像是否存在的结果，格式：{avatarHash: {isExists, saveTs}}

// 定期清理缓存，每隔 5 分钟执行一次
setInterval(() => {
  const now = Date.now();

  // 清理 cacheGravatarImageRedirectResults 缓存
  for (const avatarHash in cacheAvatarIsExistsResults) {
    const {saveTs} = cacheAvatarIsExistsResults[avatarHash];
    if (now - saveTs > 30 * 60 * 1000) { // 如果缓存时间超过 30 分钟，则清理掉该缓存
      delete cacheAvatarIsExistsResults[avatarHash];
    }
  }
}, 5 * 60 * 1000);

// 检测 gravatar 头像是否存在
const checkGravatarImageExists = async (avatarHash) => {
  if (cacheAvatarIsExistsResults[avatarHash] !== undefined) {
    return cacheAvatarIsExistsResults[avatarHash].isExists;
  }

  const gravatarAddr = `${process.env.GRAVATAR_ADDR || 'https://gravatar.com'}/avatar/`; // 如果环境变量配置了 GRAVATAR_ADDR 则使用该地址，否则使用默认地址 https://gravatar.com'
  const gravatarImageUrl = `${gravatarAddr}${avatarHash}?d=404`; // 完整的gravatar图片地址
  try {
    const response = await axios.head(gravatarImageUrl, {timeout: 10000});
    if (response.status === 200) {
      log.debug('checkGravatarImageExists response status 200, file exists, gravatarImageUrl:', gravatarImageUrl);
      cacheAvatarIsExistsResults[avatarHash] = {isExists: true, saveTs: Date.now()};
      return true;
    }

    if (response.status === 404) {
      log.debug('checkGravatarImageExists response status 404, file not found, gravatarImageUrl:', gravatarImageUrl);
      cacheAvatarIsExistsResults[avatarHash] = {isExists: false, saveTs: Date.now()};
      return false;
    }

    return false;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      log.debug('checkGravatarImageExists catch err status 404, file not found, gravatarImageUrl:', gravatarImageUrl);
      cacheAvatarIsExistsResults[avatarHash] = {isExists: false, saveTs: Date.now()};
      return false;
    }

    log.error('checkGravatarImageExists catch err:', err.message, ' ,gravatarImageUrl:', gravatarImageUrl);
    delete cacheAvatarIsExistsResults[avatarHash];
    return null;
  }
}

// gravatar 头像代理获取，格式例如：/site_proxy/gravatar_image/avatar/8dc1e9ca2ba0c4164b10c45660b3788c 表示请求 https://gravatar.com/avatar/8dc1e9ca2ba0c4164b10c45660b3788c
productGetRouter(router, '/site_proxy/gravatar_image/avatar/:avatarHash', async (apiId, req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const {avatarHash} = req.params;
  const defaultGravatarImageUrl = process.env.DEFAULT_GRAVATAR_IMAGE_URL; // 默认加载的头像地址

  /*
  Gravatar 是一个全球通用的头像服务，允许用户在各种网站上使用同一个头像。在 Gravatar 链接中，有几个参数需要说明：
    s: 代表头像的大小。这个参数允许你指定希望获取的头像的尺寸。例如，如果将"s=200"添加到 Gravatar 链接中，那么获取的头像将是200x200像素的大小。
    r: 表示头像的等级或样式。这个参数控制了头像的显示级别，可以通过指定不同的级别来决定显示的头像。例如，"r=g"表示允许显示的头像为普通级别（适合大众观看的内容），而"r=pg"则表示显示的头像为儿童级别（适合家庭友好的内容），"r=r"表示显示的头像为受限级别（适合仅成年人观看的内容）。
    d: 当没有与电子邮件哈希相关联的图像时，应采取的操作。
    关于参数"d"，有以下几个选项：
      404: 如果没有与电子邮件哈希相关联的图像，则不加载任何图像，并返回 HTTP 404（文件未找到）响应。
      mm: (神秘人) 是一个简单的、卡通风格的人物轮廓（不会根据电子邮件哈希变化）。
      identicon: 基于电子邮件哈希的几何图案。
      monsterid: 生成的“怪物”头像，具有不同的颜色、面孔等。
      wavatar: 生成具有不同特征和背景的头像。
      retro: 生成令人惊叹的 8 位街机风格像素头像。
      blank: 一个透明的 PNG 图像（为演示目的在 HTML 中添加了边框）。
      imgUrl: 一个自定义的默认图片，需要对 url 进行编码。如：https://example.com/my_custom_image.png 编码后 https%3A%2F%2Fexample.com%2Fmy_custom_image.png
   */

  let query = req.query;
  if (query && query.d) { // query.d: 当没有与电子邮件哈希相关联的图像时，应采取的操作。
    if (decodeURIComponent(query.d).indexOf('/site_proxy/gravatar_image/avatar/') !== -1) { // 如果 query.d 再次指向本接口，则直接修改 d=mm
      log.debug('modify query.d to mm, apiId:', apiId);
      query = {...query}
      query.d = 'mm';
    }
  } else if (process.env.DEFAULT_GRAVATAR_PARAM_D) { // 没有 query.d，则使用默认的参数d
    query = {...query}
    // defaultGravatarImageUrl 需要进行编码，防止 defaultGravatarImageUrl 重复编码
    query.d = encodeURIComponent(decodeURIComponent(process.env.DEFAULT_GRAVATAR_PARAM_D));
  }

  // 获取完整的请求参数，格式如：d=mm&s=80
  const requestParamsStr = query ? `?${Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&')}` : '';
  const gravatarAddr = `${process.env.GRAVATAR_ADDR || 'https://gravatar.com'}/avatar/`; // 如果环境变量配置了 GRAVATAR_ADDR 则使用该地址，否则使用默认地址 https://gravatar.com'
  const gravatarImageUrl = `${gravatarAddr}${avatarHash}${requestParamsStr}`; // 完整的gravatar图片地址

  log.debug('call /site_proxy/gravatar_image/avatar/:avatarHash',
    ' ,avatarHash:', avatarHash,
    ' ,gravatarImageUrl:', gravatarImageUrl,
    ' ,clientIp:', clientIp,
    ' ,req.ip:', req.ip,
    ' ,user-agent:', req.headers['user-agent'],
    ' ,apiId:', apiId
  );

  if (!(query && query.d) && defaultGravatarImageUrl) { // 没有 query.d，则使用默认的头像
    const isExists = await checkGravatarImageExists(avatarHash);
    if (!isExists) { // 不存在，则重定向到默认的头像地址
      log.debug('not found gravatar image, redirect defaultGravatarImageUrl:', defaultGravatarImageUrl);
      return res.redirect(defaultGravatarImageUrl);
    }

    log.debug('check gravatar image exists, redirect gravatarImageUrl:', gravatarImageUrl);
    return res.redirect(gravatarImageUrl);
  }
  
  log.debug('not config defaultGravatarImageUrl, redirect gravatarImageUrl:', gravatarImageUrl);
  res.redirect(gravatarImageUrl);
});