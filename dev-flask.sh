#!/usr/bin/env bash
. .env
export DATABASE_URL=$LOCAL_DATABASE_URL
echo $OAUTH_CLIENT_ID $OAUTH_CLIENT_SECRET $DATABASE_URL

docker compose up -d db

cd backend
.  venv/bin/activate


flask --app src/app run
