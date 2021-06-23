#!/usr/bin/env sh

# abort on errors
set -e

yarn run build

cd dist

echo 'app.tunnelbanejakten.se' > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f https://github.com/tunnelbanejakten/app.tunnelbanejakten.se.git master

cd -