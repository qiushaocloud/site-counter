CURR_DIR=$(cd "$(dirname "$0")"; pwd)

if [ ! -f "$CURR_DIR/.env" ];then
  echo "file $CURR_DIR/.env is not exist"
  exit
fi

docker-compose up -d