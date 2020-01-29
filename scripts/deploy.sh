#!/usr/bin/env bash

### Potentially to be delegated to the CI context preparation
echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc

### Potentially to be delegated to the CI context preparation
TOTP_CODE=$(curl -s -X GET "${VAULT_URL}" -H "X-Vault-Token: ${VAULT_NPM_TOTP_TOKEN}" | jq --raw-output ".data.code")
export TOTP_CODE

## Running in the CI therefore it's not required to prompt for the versions
export FLAG=''
if [ -n "${JENKINS_URL}" ] || [ -n "${TRAVIS}" ] ; then
    FLAG='--yes'
fi

## Ensure it's not Detached
if [ -n "${TRAVIS}" ] ; then
    if [ -n "${TRAVIS_BRANCH}" ] ; then
        git checkout "${TRAVIS_BRANCH}"
        GIT_CURRENT_SHA=$(git rev-parse HEAD)
        if [ "${GIT_CURRENT_SHA}" != "${TRAVIS_COMMIT}" ] ; then
            echo 'Current version does not match with the one that triggered this build'
            git reset --hard "${TRAVIS_COMMIT}"
        fi
        git remote set-url origin https://${GITHUB_TOKEN}@github.com/${TRAVIS_REPO_SLUG}

        # Enable to fetch branches when cloning with a detached and shallow clone
        git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
    fi
    npm ci
fi

set -xe
npm run version
npm run release-ci
npm run github-release

## Syncup
git checkout -b "syncup-${TRAVIS_BRANCH}"
git checkout master
git rebase "syncup-${TRAVIS_BRANCH}"
git push origin master