#!/usr/bin/env bash
set -xe

### Potentially to be delegated to the CI context preparation
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

### Potentially to be delegated to the CI context preparation
TOTP_CODE=$(curl -s -X GET "${VAULT_URL}" -H "X-Vault-Token: ${VAULT_NPM_TOTP_TOKEN}" | jq --raw-output ".data.code")
lerna publish --otp="${TOTP_CODE}"
npm run github-release