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

# app 配置
NODE_ENV = 'development' # development or production
GRAVATAR_ADDR = 'https://gravatar.comh' # 不配置默认使用 https://gravatar.com，国内您可以配置成 https://sdn.geekzu.org
DEFAULT_GRAVATAR_IMAGE_URL = '' # 头像默认图片地址, 配置了后，加载头像失败或者加载的是官方默认头像时，使用该图片作为头像，您可以配置成动态头像地址，如：https://api.7585.net.cn/sjtx/api.php?lx=c1