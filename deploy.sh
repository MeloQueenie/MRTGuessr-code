#!/usr/bin/env bash
USER=swadmin
HOST=sineware-kitagawa
PORT=22
DIR=/home/$USER/mrtguessr-code

rsync -e "ssh -p ${PORT}" -avz --delete --exclude "backend/cache" --exclude "backend/venv" --exclude "mrtguessr/node_modules" --exclude "db" . ${USER}@${HOST}:${DIR}

exit 0