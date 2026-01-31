#!/usr/bin/env bash
GIT_HASH=$(git rev-parse --short HEAD)
if [[ -n $(git status --porcelain) ]]; then
  GIT_HASH="${GIT_HASH}-dirty"
fi
echo "Building and deploying with GIT_HASH=${GIT_HASH}"
export GIT_HASH
docker compose up --build -d