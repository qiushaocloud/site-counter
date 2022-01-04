docker pull qiushaocloud/ub1604-nvm-node-base
#docker rmi -f qiushaocloud/site-counter || true
docker build -t qiushaocloud/site-counter .
