#!/bin/sh
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
totp=$(curl -s -X GET $VAULT_URL -H "X-Vault-Token: ${VAULT_NPM_TOTP_TOKEN}" | jq --raw-output ".data.code")
npm publish . --otp=$totp