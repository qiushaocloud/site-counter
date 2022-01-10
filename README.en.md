# site-counter


#### introduce

This is a minimalist web page counter, similar in function to busuanzi (not garlic - minimalist web page counter), with more functions than busuanzi, and supports today's statistics.



#### Features

1. Cumulative total site visits (site pv)
2. Cumulative total site visitors (site uv)
3. Cumulative site visits today (site pv today)
4. Cumulative site visitors today (site today uv)
5. Accumulate the total number of visits to a certain page of the site (site page pv)
6. Accumulate the total number of visitors to a page of the site (site page uv)
7. Accumulate the number of visits to a certain page of the site today (today's pv of the site page)
8. Accumulate the number of visitors to a certain page of the site today (the uv of the site page today)



#### Front-end usage

1. Import qiushaocloud_site_counter.min.js, for example: `<script async src="//cdn.jsdelivr.net/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>`
2. In the interface, you can introduce the corresponding node element ID according to your needs
```html
    <p>Total visits: <span id="qiushaocloud_sitecounter_value_site_pv">n</span></p>
     <p>Total Visitors: <span id="qiushaocloud_sitecounter_value_site_uv">n</span></p>
     <p>Today's visits: <span id="qiushaocloud_sitecounter_value_today_site_pv">n</span></p>
     <p>Today's Visitors: <span id="qiushaocloud_sitecounter_value_today_site_uv">n</span></p>
   
     <p>Total visits to this page: <span id="qiushaocloud_sitecounter_value_site_page_pv">n</span></p>
     <p>Total visitors to this page: <span id="qiushaocloud_sitecounter_value_site_page_uv">n</span></p>
     <p>Today's visits to this page: <span id="qiushaocloud_sitecounter_value_today_site_page_pv">n</span></p>
     <p> Today's visitors to this page: <span id="qiushaocloud_sitecounter_value_today_site_page_uv">n</span></p>
````



#### Front-end advanced features

1. Set the maximum duration of the visitor session, the default is 24h [for example, if you set 1h, then the visitor who visits again within 1h is not a new visitor, and the visitor after 1h is regarded as a new visitor. It should be noted that no matter how long it is set, once it crosses the sky. , then the second visit is a new visitor]
``` javascript
    <script>
        window.localStorage.setItem('qiushaocloud_sitecounter_max_session_duration', 24 * 60 * 60 * 1000);
    </script>

    <script async src="//cdn.jsdelivr.net/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
````
2. Set the server address requested by the interface. After setting, the request will be based on the address you set. If not set, the default interface is [www.qiushaocloud.top](https://www.qiushaocloud.top) [Note: www.qiushaocloud.top. top builds a service for individuals, it cannot ensure that the interface request is ok, it is recommended that you build the server yourself]
``` javascript
    <script>
        // The setting format is: www.qiushaocloud.top or https://www.qiushaocloud.top:443
        window.localStorage.setItem('qiushaocloud_sitecounter_api_host', 'www.qiushaocloud.top');
        //window.localStorage.setItem('qiushaocloud_sitecounter_api_host', 'https://www.qiushaocloud.top:443');
    </script>

    <script async src="//cdn.jsdelivr.net/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
````
3. Set the signature secretKey of the interface request. When qiushaocloud_site_counter.min.js is loaded, it will delete window.QIUSHAOCLOUD_SITE_COUNTER_API_SIGN_SECRET_KEY
``` javascript
    <script>
        window.QIUSHAOCLOUD_SITE_COUNTER_API_SIGN_SECRET_KEY = 'Signature key you need to set';
    </script>
    
    <script async src="//cdn.jsdelivr.net/gh/qiushaocloud/site-counter@master/dist/qiushaocloud_site_counter.min.js"></script>
````



#### Package and release qiushaocloud_site_counter.min.js and qiushaocloud_site_counter.min.js

1. Go to the root directory of site-counter
2. Edit site-counter/web-js/.env, configure YOUR_SERVER_HOST and API_SIGN_SECRET_KEY, where YOUR_SERVER_HOST is the address of your server, and API_SIGN_SECRET_KEY is your defined signature key
3. Install dependencies: npm run yarn-install
4. Packaging: npm run build-dist
5. After packaging, there are qiushaocloud_site_counter.min.js and qiushaocloud_site_counter.min.js under site-counter/dist



#### Package docker image in linux environment [You can directly pull the open source image without modifying the code: docker pull qiushaocloud/site-counter]

1. Install the docker environment
2. Go to the root directory of site-counter
3. Execute ./build-docker.sh
4. Wait for the image packaging to complete



#### The host runs the site-counter service

1. Go to the root directory of site-counter
2. Copy env.tpl as .env, linux command: cp env.tpl .env
3. Modify the .env file according to your situation
4. Run the service: npm run serve or node app.js



#### Docker running site-counter service

1. Install docker and docker-compose environment
2. Go to the root directory of site-counter
3. Copy env.tpl as .env, linux command: cp env.tpl .env
4. Modify the .env file according to your situation
5. Execute ./run-docker.sh



#### Contribute

1. Fork this repository
2. Create a new Feat_xxx branch
3. Submit the code
4. Create a new Pull Request



#### Open source is not easy, if it is helpful to you, please move your little hand, give the author a star, and please pay more attention to the sharer "[Qiushaocloud.top)"

* Sharer Email: [qiushaocloud@126.com](mailto:qiushaocloud@126.com)
* [Sharer Blog](https://www.qiushaocloud.top)
* [gitlab built by the sharer himself](https://www.qiushaocloud.top/gitlab/qiushaocloud)
* [Shared by gitee](https://gitee.com/qiushaocloud/dashboard/projects)
* [Shared by github](https://github.com/qiushaocloud?tab=repositories)