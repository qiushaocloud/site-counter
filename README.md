# site-counter


### 介绍

这是一个极简网页计数器，主要对站点的访问/访客进行统计，功能和 busuanzi (不蒜子 - 极简网页计数器) 类似，比 busuanzi 功能更多，支持今日统计。



### 功能

1. 累计站点总访问量(站点 pv)
2. 累计站点总访客量(站点 uv)
3. 累计站点今日访问量(站点今日 pv)
4. 累计站点今日访客量(站点今日 uv)
5. 累计站点某页面总访问量(站点页面 pv)
6. 累计站点某页面总访客量(站点页面 uv)
7. 累计站点某页面今日访问量(站点页面今日 pv)
8. 累计站点某页面今日访客量(站点页面今日 uv)


### 快速上手

#### 前端简易使用

1. 引入 qiushaocloud_site_counter.min.js, 比如: `<script async src="//githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>`
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

#### 添加 Listener 和 Method
* `window.qiushaocloudSiteCounterNotice` Listener，接收计数器通知消息，用于自定义开发，自行处理数据
  ```javascript
    window.qiushaocloudSiteCounterNotice = function(type, data) {
        switch (type) {
          case 'api:post:site_counter': {
            if (data.err) {
              console.error('api:post:site_counter error:', data.err, data.res);
              return;
            }

            /**
             * data.res 格式如下：
                {
                    "yesterday": { // 昨日统计数据
                        "page_pv": 2, // 昨日页面访问量
                        "page_uv": 1, // 昨日页面访客量
                        "site_pv": 694, // 昨日站点访问量
                        "site_uv": 6 // 昨日站点访客量
                    },
                    "page_pv": 3, // 当前页面访问量
                    "page_uv": 2, // 当前页面访客量
                    "site_pv": 695, // 当前站点访问量
                    "site_uv": 7 // 当前站点访客量
                }
             */
            console.log('api:post:site_counter success, res:', data.res);
            break;
          }
          case 'api:get:site_counter_ips_stats': {
            if (data.err) {
              console.error('api:get:site_counter_ips_stats error:', data.err, data.res);
              return;
            }

            /**
             * data.res 格式如下：
                {
                    "site_host": "www.qiushaocloud.top",
                    "site_ips": {
                        "2024-05-29": {
                            "IPV4": [
                                访问次数,
                                IP地址信息,
                                最后访问时间
                            ],
                            "180.101.244.13": [
                                3,
                                "中国江苏省南京市电信",
                                1717427570853
                            ]                           
                        }
                    },
                    "page_ips": {
                        "2024-05-29": {
                            "117.129.2.95": [
                                4,
                                "中国北京市昌平区移动",
                                1717427570853
                            ]
                        }
                    },
                    "site_page_pathname": "/common-static/qiushaocloud-site-counter-test-demo.html"
                }
            */
            console.log('api:get:site_counter_ips_stats success, res:', data.res);
            break;
          }
          case 'api:get:site_counter_logs:ip': {
            if (data.err) {
              console.error('api:get:site_counter_logs:ip error:', data.err, data.res, data.filterType, data.filterDay, data.filterIp);
              return;
            }

            /**
             * data.res 格式如下：
                {
                    "site_host": "www.qiushaocloud.top",
                    "site_logs": [
                        [
                            访问时间戳,
                            IPV4,
                            IP地址信息,
                            浏览器信息,
                            访问页面
                        ],
                        [
                            1717439942576,
                            "220.196.160.75",
                            "中国上海市联通",
                            "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
                            "https://www.qiushaocloud.top/"
                        ]
                    ],
                    "page_logs": [
                        [
                            1717427570853,
                            "117.129.2.39",
                            "中国北京市昌平区移动",
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                            "https://www.qiushaocloud.top/common-static/site-counter/examples/complex.html?page=/common-static/qiushaocloud-site-counter-test-demo.html"
                        ]
                    ],
                    "site_page_pathname": "/common-static/qiushaocloud-site-counter-test-demo.html"
                }
             */

            console.log('api:get:site_counter_logs:ip success, res:', data.res, ', filterType:'+ data.filterType+', filterDay:'+ data.filterDay+', filterIp:'+ data.filterIp);
            break;
          }
        }
    }
  ```
* `window.requestQiushaocloudSiteCounterLogsApiByFilter` Method，请求日志数据，用于自定义开发，自行处理数据
  ```javascript
    /** 
     * 请求日志API
     * @param filterType {site|site-page} 日志类型，'site' |'site-page'
     * @param filterDay {string} 哪一天日志，格式：'2024-05-06'
     * @param filterIp {string} [可选]过滤的客户端IP
     * @param onCallback {function} [可选]请求成功回调函数，参数：(err, res)，res 数据格式参考 api:get:site_counter_logs:ip 的 data.res
     */
    window.requestQiushaocloudSiteCounterLogsApiByFilter(filterType, filterDay, filterIp, onCallback);
  ```



#### IP 统计数据
1. 界面中您根据您的需求，引入相应的IP统计节点元素 ID 及配置参数
   > 参考 [示例 complex.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/complex.html)：[代码](https://github.com/qiushaocloud/site-counter/blob/master/examples/complex.html)
   ```html
   <!--
      网站 IP 统计节点元素
      元素ID: qiushaocloud_sitecounter_value_site_ips_stats
      可配置参数(非必选):
        data-ips-stats-sort-name: 排序方式，可选值 desc/asc，默认 asc【只有 data-render-mode 为 ui/console 时生效】
        data-logs-sort-name: 日志排序方式，可选值 desc/asc，默认 asc【只有 data-logs-print-mode 为 ui/console 时生效】
        data-date-range: 日志日期范围，最多保留31天日志，不指定则获取当天的，格式：'31days' | '2024-05-06' | '2024-05-06,2024-05-10' | '2024-05-06 to 2024-05-10' ｜ '2024-05-06 to 2024-05-10,2024-05-15'
        data-render-mode: 渲染模式，可选值 ui/console/none，默认 ui【ui:渲染结果元素到该元素内，console:在控制台输出结果，none:不进行任何输出，只用于请求数据，通过 window.qiushaocloudSiteCounterNotice 监听结果后自行处理数据，用于自定义开发】
        data-logs-print-mode: 日志打印模式，可选值 ui/console/none，默认 ui【ui:渲染结果元素到该元素内，console:在控制台输出结果，none:不进行任何输出，只用于请求数据，通过 window.qiushaocloudSiteCounterNotice 监听结果后自行处理数据，用于自定义开发】
    -->
   <div id="qiushaocloud_sitecounter_value_site_ips_stats"
        data-ips-stats-sort-name="desc"
        data-logs-sort-name="desc"
        data-date-range="7days"
        data-render-mode="ui"
        data-logs-print-mode="ui"
    ></div>

    <!--
      页面 IP 统计节点元素
      元素ID: qiushaocloud_sitecounter_value_site_page_ips_stats
      可配置参数(非必选):
        data-ips-stats-sort-name: 排序方式，可选值 desc/asc，默认 asc【只有 data-render-mode 为 ui/console 时生效】
        data-logs-sort-name: 日志排序方式，可选值 desc/asc，默认 asc【只有 data-logs-print-mode 为 ui/console 时生效】
        data-date-range: 日志日期范围，最多保留31天日志，不指定则获取当天的，格式：'31days' | '2024-05-06' | '2024-05-06,2024-05-10' | '2024-05-06 to 2024-05-10' ｜ '2024-05-06 to 2024-05-10,2024-05-15'
        data-render-mode: 渲染模式，可选值 ui/console/none，默认 ui【ui:渲染结果元素到该元素内，console:在控制台输出结果，none:不进行任何输出，只用于请求数据，通过 window.qiushaocloudSiteCounterNotice 监听结果后自行处理数据，用于自定义开发】
        data-logs-print-mode: 日志打印模式，可选值 ui/console/none，默认 ui【ui:渲染结果元素到该元素内，console:在控制台输出结果，none:不进行任何输出，只用于请求数据，通过 window.qiushaocloudSiteCounterNotice 监听结果后自行处理数据，用于自定义开发】
        data-site-page-pathname: 页面路径，默认当前页面路径，例如：/about.html
    -->
    <div id="qiushaocloud_sitecounter_value_site_page_ips_stats"
        data-ips-stats-sort-name="desc"
        data-logs-sort-name="desc"
        data-date-range="7days"
        data-render-mode="ui"
        data-logs-print-mode="ui"
        data-site-page-pathname="/about.html"
    ></div>
   ```
2. render-mode 为 ui 时渲染的元素节点结构
    > ⚠️注意: 只是渲染了元素结构，并没有提供默认样式，您根据自己的需求根据提供的结构进行样式设计
    > 参考 [示例 only-elements.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/only-elements.html)：[代码](https://github.com/qiushaocloud/site-counter/blob/master/examples/only-elements.html)
   ```html
   <!-- qiushaocloud_sitecounter_value_site_ips_stats 里面的元素结构如下 -->
   <div class="site-log-day">
        <h5 class="site-log-day-title">
            <span class="day-content">2024-06-03</span>
            <button class="site-log-day-ul-fold-btn">折叠</button>
            <span class="total-pv-count-content">（46个IP访问115次）</span>
        </h5>
        <ul class="site-log-day-ul">
            <li class="site-log-day-ip-li">
                <span class="site-log-day-ip-info-warpper">
                    <span class="ip-info-warpper">
                        <span class="ip-content">66.249.72.197</span>
                        (<span class="ip-location-content">美国加利福尼亚州google.com</span>)
                    </span>
                    <span class="ip-count-warpper">
                        <span class="count-title">访问次数：</span>
                        <span class="count-content">7</span>
                    </span>
                </span>
                <button class="site-log-day-ip-detail-btn" data-ip="66.249.72.197" data-day="2024-06-03">详细日志</button>
            </li>
        </ul>
    </div>

    <!-- qiushaocloud_sitecounter_value_site_page_ips_stats 里面的元素结构如下 -->
    <div class="site-page-log-day">
        <h5 class="site-page-log-day-title">
            <span class="day-content">2024-06-03</span>
            <button class="site-page-log-day-ul-fold-btn">折叠</button>
            <span class="total-pv-count-content">（2个IP访问3次）</span>
        </h5>
        <ul class="site-page-log-day-ul">
            <li class="site-page-log-day-ip-li">
                <span class="site-page-log-day-ip-info-warpper">
                    <span class="ip-info-warpper">
                        <span class="ip-content">117.129.2.120</span>
                        (<span class="ip-location-content">中国北京市昌平区移动</span>)
                    </span>
                    <span class="ip-count-warpper">
                        <span class="count-title">访问次数：</span>
                        <span class="count-content">1</span>
                    </span>
                </span>
                <button class="site-page-log-day-ip-detail-btn" data-ip="117.129.2.120" data-day="2024-06-03">详细日志</button>
            </li>
        </ul>
    </div>
   ```
3. 作者提供了关于 logs 页面的样式文件 [logs-table.css](https://github.com/qiushaocloud/site-counter/blob/master/examples/css/logs-table.css)，您可以直接引入到您的页面中，再根据需要调整样式，引入代码 `<link rel="stylesheet" href="https://githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/examples/css/logs-table.css">`，参考 [示例 ips-stats-search.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/ips-stats-search.html)：[代码 ips-stats-search.html](https://github.com/qiushaocloud/site-counter/blob/master/examples/ips-stats-search.html) 和 [代码 ips-stats-iframe.html](https://github.com/qiushaocloud/site-counter/blob/master/examples/ips-stats-iframe.html)
4. 作者提供了关于 IP 统计界面样式和逻辑的封装 [ips-stats.js](https://github.com/qiushaocloud/site-counter/blob/master/examples/js/ips-stats.js)，依赖 [logs-table.css](https://github.com/qiushaocloud/site-counter/blob/master/examples/css/logs-table.css)，引入代码 `<link rel="stylesheet" href="https://githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/examples/css/logs-table.css">` 和 `<script src="https://githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/examples/js/ips-stats.js"></script>`

#### 前端高级功能

1. 设置访客 session 最大时长，默认 24h【例如您设置 1h, 那么 1h 内访客再次访问不算新访客，1h 后再访问则视为新访客，需要注意，无论设置多长时间，一旦跨天了，那么再次访问都是新访客】
``` javascript
<script>
    window.localStorage.setItem('qiushaocloud_sitecounter_max_session_duration', 24 * 60 * 60 * 1000);
</script>

<script async src="//githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
```
2. 设置接口请求的服务器地址，设置后会以您设置的地址请求，不设置默认以 [www.qiushaocloud.top](https://www.qiushaocloud.top) 请求接口【注意：www.qiushaocloud.top 为个人搭建服务，不能确保接口请求没问题，建议您自己搭建服务器哦】
``` javascript
<script>
    // 设置格式为：www.qiushaocloud.top 或者 https://www.qiushaocloud.top:443
    window.localStorage.setItem('qiushaocloud_sitecounter_api_host', 'www.qiushaocloud.top');
    //window.localStorage.setItem('qiushaocloud_sitecounter_api_host', 'https://www.qiushaocloud.top:443');
</script>

<script async src="//githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
```
3. 设置接口请求的签名secretKey, 当 qiushaocloud_site_counter.min.js 加载完成后会删除 window.QIUSHAOCLOUD_SITE_COUNTER_API_SIGN_SECRET_KEY
``` javascript
<script>
    window.QIUSHAOCLOUD_SITE_COUNTER_API_SIGN_SECRET_KEY = '您需要设置的签名key';
</script>

<script async src="//githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
```
4. 设置页面ID，当需要统计页面 PV/UV, 但是您页面是通过地址栏参数来区分不同页面的(比如: https://yourAddr/yourPathname?page_id=xxx)，您这时候就能用上此用法了
``` javascript
<script>
    /**
        * 统计此界面时以 window.location.pathname + window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_ID 进行统计
        * 例如您的地址: https://yourAddr/yourPathname?page_id=abc 和 https://yourAddr/yourPathname?page_id=def 表示两篇不同的文章
        * 您将 page_id 设置给 window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_ID, 如: window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_ID = `${page_id}`
        * 在统计时将以 ${yourPathname}+'adb' 以及 ${yourPathname}+'def' 分别对您这两篇文章进行统计
    **/
    window.QIUSHAOCLOUD_SITE_COUNTER_PAGE_ID = '您需要设置的页面ID';
</script>

<script async src="//githubcdn.qiushaocloud.top/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
```




### 不使用作者搭建的服务器，自己搭建服务器教程
#### 打包发布 qiushaocloud_site_counter.js 和 qiushaocloud_site_counter.min.js

1. 进入 site-counter 根目录
2. 编辑 site-counter/web-js/.env，配置 YOUR_SERVER_HOST 和 API_SIGN_SECRET_KEY，YOUR_SERVER_HOST 为您服务器的地址，API_SIGN_SECRET_KEY 为您定义的签名 key
3. 安装依赖: npm run yarn-install
4. 打包: npm run build-dist
5. 打包后在 site-counter/dist 下面就有 qiushaocloud_site_counter.js 和 qiushaocloud_site_counter.min.js



#### linux 环境下打包 docker 镜像【您如果不需要修改代码，可以直接拉取开源镜像: docker pull qiushaocloud/site-counter】

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
5. 执行 ./run-docker.sh


#### 在线演示站点
* [邱少羽梦博客演示站点: https://www.qiushaocloud.top/2022/01/10/site-counter](https://www.qiushaocloud.top/2022/01/10/site-counter)
* [测试 demo 代码地址: https://github.com/qiushaocloud/cdn-static/blob/master/blog/qiushaocloud-site-counter-test-demo.html](https://github.com/qiushaocloud/cdn-static/blob/master/blog/qiushaocloud-site-counter-test-demo.html)
* [测试 demo 效果地址: https://www.qiushaocloud.top/common-static/qiushaocloud-site-counter-test-demo.html](https://www.qiushaocloud.top/common-static/qiushaocloud-site-counter-test-demo.html)
* 代码中 `examples` 目录下有更多的使用示例
  * [示例 complex.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/complex.html)：[代码](https://github.com/qiushaocloud/site-counter/blob/master/examples/complex.html)
  * [示例 simple.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/simple.html)：[代码](https://github.com/qiushaocloud/site-counter/blob/master/examples/simple.html)
  * [示例 ips-stats-search.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/ips-stats-search.html)：[代码 ips-stats-search.html](https://github.com/qiushaocloud/site-counter/blob/master/examples/ips-stats-search.html) 和 [代码 ips-stats-iframe.html](https://github.com/qiushaocloud/site-counter/blob/master/examples/ips-stats-iframe.html)
  * [示例 flexible.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/flexible.html)：[代码](https://github.com/qiushaocloud/site-counter/blob/master/examples/flexible.html)
  * [示例 only-elements.html 演示](https://www.qiushaocloud.top/common-static/site-counter/examples/only-elements.html)：[代码](https://github.com/qiushaocloud/site-counter/blob/master/examples/only-elements.html)


#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request



#### 开源不易，如果对您有帮助，请您动一动您的小手，给作者点 Star，也请您多多关注分享者「[邱少羽梦](https://www.qiushaocloud.top)」

* 分享者邮箱: [qiushaocloud@126.com](mailto:qiushaocloud@126.com)
* [分享者博客](https://www.qiushaocloud.top)
* [分享者自己搭建的 gitlab](https://gitlab.qiushaocloud.top/qiushaocloud) 
* [分享者 gitee](https://gitee.com/qiushaocloud/dashboard/projects) 
* [分享者 github](https://github.com/qiushaocloud?tab=repositories) 
