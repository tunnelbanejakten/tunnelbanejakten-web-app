#!/usr/bin/env sh

# abort on errors
set -e

# prepare build by updating version in package.json and by adding a git tag
yarn version --no-git-tag-version
git add package.json
NEW_VERSION=$(cat package.json | jq -r '.version')
git commit -m "Release ${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "Release ${NEW_VERSION}"

# compile and build app
yarn run build

cd dist

# add host file used by github pages
echo 'app.tunnelbanejakten.se' > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f https://github.com/tunnelbanejakten/app.tunnelbanejakten.se.git master

cd -