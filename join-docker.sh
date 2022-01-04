docker rm -f site-counter-server || true
docker run -it --name site-counter-server -h site-counter-server qiushaocloud/site-counter