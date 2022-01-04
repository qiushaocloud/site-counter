docker rm -f qiushaocloud-site-counter-server || true
docker run -it --name qiushaocloud-site-counter-server -h qiushaocloud-site-counter-server qiushaocloud/site-counter