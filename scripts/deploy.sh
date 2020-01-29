#!/usr/bin/env bash

### Potentially to be delegated to the CI context preparation
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

### Potentially to be delegated to the CI context preparation
TOTP_CODE=$(curl -s -X GET "${VAULT_URL}" -H "X-Vault-Token: ${VAULT_NPM_TOTP_TOKEN}" | jq --raw-output ".data.code")

## Running in the CI therefore it's not required to prompt for the versions
FLAG=''
if [ -n "${JENKINS_URL}" ] ||  [ -n "${TRAVIS}" ] ; then
    FLAG='--yes'
fi

## This is possible as TOTP code is used once and only once
set -xe
ls -ltrah ./node_modules/.bin
./node_modules/.bin/lerna publish --otp="${TOTP_CODE}" ${FLAG}
npm run github-release