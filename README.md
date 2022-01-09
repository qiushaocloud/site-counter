# site-counter


#### 介绍

这是一个极简网页计数器，功能和 busuanzi (不蒜子 - 极简网页计数器) 类似，比 busuanzi 功能更多，支持今日统计。



#### 功能

1. 累计站点总访问量(站点 pv)
2. 累计站点总访客量(站点 uv)
3. 累计站点今日访问量(站点今日 pv)
4. 累计站点今日访客量(站点今日 uv)
5. 累计站点某页面总访问量(站点页面 pv)
6. 累计站点某页面总访客量(站点页面 uv)
7. 累计站点某页面今日访问量(站点页面今日 pv)
8. 累计站点某页面今日访客量(站点页面今日 uv)



#### 前端使用

1. 引入 qiushaocloud_site_counter.min.js, 比如: `<script async src="//cdn.jsdelivr.net/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>`
2. 界面中您根据您的需求，引入相应的节点元素 ID
```html
    <p>总访问量: <span id="qiushaocloud_sitecounter_value_site_pv">n</span></p>
     <p>总访客量: <span id="qiushaocloud_sitecounter_value_site_uv">n</span></p>
     <p>今日访问量: <span id="qiushaocloud_sitecounter_value_today_site_pv">n</span></p>
     <p>今日访客量: <span id="qiushaocloud_sitecounter_value_today_site_uv">n</span></p>
   
     <p>本页面总访问量: <span id="qiushaocloud_sitecounter_value_site_page_pv">n</span></p>
     <p>本页面总访客量: <span id="qiushaocloud_sitecounter_value_site_page_uv">n</span></p>
     <p>本页面今日访问量: <span id="qiushaocloud_sitecounter_value_today_site_page_pv">n</span></p>
     <p> 本页面今日访客量: <span id="qiushaocloud_sitecounter_value_today_site_page_uv">n</span></p>
```



#### 前端高级功能

1. 设置访客 session 最大时长，默认 24h【例如您设置 1h, 那么 1h 内访客再次访问不算新访客，1h 后再访问则视为新访客，需要注意，无论设置多长时间，一旦跨天了，那么再次访问都是新访客】
`window.localStorage.setItem('qiushaocloud_sitecounter_max_session_duration', 24 * 60 * 60 * 1000);`
2. 设置接口请求的服务器地址，设置后会以您设置的地址请求，不设置默认以 [www.qiushaocloud.top](https://www.qiushaocloud.top) 请求接口【注意：www.qiushaocloud.top 为个人搭建服务，不能确保接口请求没问题，建议您自己搭建服务器哦】
``` javascript
// 设置格式为：www.qiushaocloud.top 或者 https://www.qiushaocloud.top:443
window.localStorage.setItem('qiushaocloud_sitecounter_api_host', 'www.qiushaocloud.top');
//window.localStorage.setItem('qiushaocloud_sitecounter_api_host', 'https://www.qiushaocloud.top:443');
```



#### 打包发布 qiushaocloud_site_counter.min.js 和 qiushaocloud_site_counter.min.js

1. 进入 site-counter 根目录
2. 编辑 site-counter/web-js/.env，配置 YOUR_SERVER_HOST 和 API_SIGN_SECRET_KEY，YOUR_SERVER_HOST 为您服务器的地址，API_SIGN_SECRET_KEY 为您定义的签名 key
3. 安装依赖: npm run yarn-install
4. 打包: npm run build-dist
5. 打包后在 site-counter/dist 下面就有 qiushaocloud_site_counter.min.js 和 qiushaocloud_site_counter.min.js



#### linux 环境下打包 docker 镜像【您可以不需要修改代码，可以直接拉取开源镜像: docker pull qiushaocloud/site-counter】

1. 安装好 docker 环境
2. 进入 site-counter 根目录
3. 执行 ./build-docker.sh
4. 等待镜像打包完成



#### 宿主机运行 site-counter 服务

1. 进入 site-counter 根目录
2. 拷贝 env.tpl 为 .env, linux 命令: cp env.tpl .env
3. 根据您的情况，修改 .env 文件
4. 运行服务: npm run serve 或者 node app.js



#### Docker 运行 site-counter 服务

1. 安装好 docker 和 docker-compose 环境
2. 进入 site-counter 根目录
3. 拷贝 env.tpl 为 .env, linux 命令: cp env.tpl .env
4. 根据您的情况，修改 .env 文件
5. 执行 ./run-docker



#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request



#### 分享者信息

* 分享者邮箱: [qiushaocloud@126.com](mailto:qiushaocloud@126.com)
* [分享者博客](https://www.qiushaocloud.top)
* [分享者自己搭建的 gitlab](https://www.qiushaocloud.top/gitlab/qiushaocloud) 
* [分享者 gitee](https://gitee.com/qiushaocloud/dashboard/projects) 
* [分享者 github](https://github.com/qiushaocloud?tab=repositories) 
