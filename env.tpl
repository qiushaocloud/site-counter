# redis config
REDIS_HOST = 'redisIp'
REDIS_PORT = 6379
REDIS_PASSWD = ''
REDIS_DB = 0

# server config
API_PORT = 80
API_SIGN_SECRET_KEY = 'QIU_SHAO_CLOUD_SECRET_KEY'

# docker config
EXPOSE_API_PORT = 80

# volumes 配置
LOGS_DIR = './logs'
DATA_DIR = './data'

# app 配置
# NODE_ENV set to development or production
NODE_ENV = 'production'
# 不配置默认使用 https://gravatar.com，国内您可以配置成 https://sdn.geekzu.org
GRAVATAR_ADDR = 'https://gravatar.com'
# 默认头像地址, 配置了后，gravatar 没有图片时会使用这个地址作为头像，您可以配置成动态头像地址，如：https://api.7585.net.cn/sjtx/api.php?lx=c1 或 https://www.loliapi.com/acg/pp/
DEFAULT_GRAVATAR_IMAGE_URL = ''
# 默认 gravatar 头像参数，如果有值，则 DEFAULT_GRAVATAR_IMAGE_URL 配置无效，使用这个配置，不需要在服务区检测头像存不存在，而是由 gravatar 自己检测，但是 gravatar 会缓存头像，因此不适合随机头像
DEFAULT_GRAVATAR_PARAM_D = ''