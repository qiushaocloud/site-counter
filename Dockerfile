FROM qiushaocloud/ub1604-nvm-node-base:latest

COPY ./version /root/site-counter/version
COPY ./src/* /root/site-counter/src/
COPY ./app.js /root/site-counter/app.js
COPY ./package.json /root/site-counter/package.json
COPY ./.eslintignore /root/site-counter/.eslintignore
COPY ./env.tpl /root/site-counter/.env

RUN cd /root/site-counter \
  && npm i

WORKDIR /root/site-counter

CMD ["node", "/root/site-counter/app.js"]
