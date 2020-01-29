#!/usr/bin/env bash

### Potentially to be delegated to the CI context preparation
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

### Potentially to be delegated to the CI context preparation
TOTP_CODE=$(curl -s -X GET "${VAULT_URL}" -H "X-Vault-Token: ${VAULT_NPM_TOTP_TOKEN}" | jq --raw-output ".data.code")

## Running in the CI therefore it's not required to prompt for the versions
FLAG=''
if [ -n "${JENKINS_URL}" ] || [ -n "${TRAVIS}" ] ; then
    FLAG='--yes'
fi

## Ensure it's not Detached
if [ -n "${TRAVIS}" ] ; then
    git checkout "${TRAVIS_BRANCH}"
    GIT_CURRENT_SHA=$(git rev-parse HEAD)
    if [ "${GIT_CURRENT_SHA}" != "${TRAVIS_COMMIT}" ] ; then
        echo 'Current version does not match with the one that triggered this build'
        git reset --hard "${TRAVIS_COMMIT}"
    fi
fi


## npm install just in case
npm install

set -xe
## This is possible as TOTP code is used once and only once
npx lerna publish --otp="${TOTP_CODE}" ${FLAG}
npm run github-release