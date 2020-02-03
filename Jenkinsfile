#!/usr/bin/env groovy

@Library('apm@current') _

import groovy.transform.Field

/**
Store the version for the releases
Env variables are not supported in the input parameters: https://issues.jenkins-ci.org/browse/JENKINS-49946
*/
@Field def releaseVersions

pipeline {
  agent { label 'linux && immutable' }
  environment {
    REPO = 'test-2fa'
    BASE_DIR = "src/github.com/elastic/${env.REPO}"
    NOTIFY_TO = credentials('notify-to')
    JOB_GCS_BUCKET = credentials('gcs-bucket')
    PIPELINE_LOG_LEVEL = 'INFO'
    NPMRC_SECRET = 'secret/apm-team/ci/elastic-observability-npmjs'
    TOTP_SECRET = 'totp-apm/code/v1v'
    HOME = "${env.WORKSPACE}"
  }
  options {
    timeout(time: 1, unit: 'HOURS')
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '20', daysToKeepStr: '30'))
    timestamps()
    ansiColor('xterm')
    disableResume()
    durabilityHint('PERFORMANCE_OPTIMIZED')
    rateLimitBuilds(throttle: [count: 60, durationName: 'hour', userBoost: true])
    quietPeriod(10)
  }
  parameters {
    booleanParam(name: 'Run_As_Master_Branch', defaultValue: false, description: 'Allow to run any steps on a PR, some steps normally only run on master branch.')
    booleanParam(name: 'saucelab_test', defaultValue: "false", description: "Enable run a Sauce lab test")
    booleanParam(name: 'parallel_test', defaultValue: "true", description: "Enable run tests in parallel")
    booleanParam(name: 'bench_ci', defaultValue: true, description: 'Enable benchmarks')
    booleanParam(name: 'release', defaultValue: false, description: 'Release.')
  }
  stages {
    stage('Initializing'){
      options { skipDefaultCheckout() }
      environment {
        PATH = "${env.PATH}:${env.WORKSPACE}/bin"
      }
      stages {
        /**
        Checkout the code and stash it, to use it on other stages.
        */
        stage('Checkout') {
          steps {
            pipelineManager([ cancelPreviousRunningBuilds: [ when: 'PR' ] ])
            deleteDir()
            gitCheckout(basedir: "${BASE_DIR}", githubNotifyFirstTimeContributor: true)
            stash allowEmpty: true, name: 'source', useDefaultExcludes: false
          }
        }
        /**
        Lint the code.
        */
        stage('Lint') {
          steps {
            echo 'linted'
          }
        }
        /**
        Execute unit tests.
        */
        stage('Test') {
          steps {
            echo 'test'
          }
        }
        /**
        Execute code coverange only once.
        */
        stage('Coverage') {
          steps {
            echo 'coverage'
          }
        }
        /**
        Run Benchmarks and send the results to ES.
        */
        stage('Benchmarks') {
          when {
            beforeAgent true
            anyOf {
                branch 'master'
                tag pattern: 'v\\d+\\.\\d+\\.\\d+.*', comparator: 'REGEXP'
                expression { return params.Run_As_Master_Branch }
            }
          }
          steps {
            echo 'benchmark'
          }
        }
        stage('Integration Tests') {
          agent none
          steps {
            echo 'its'
          }
        }
        stage('Release') {
          options {
            skipDefaultCheckout()
            timeout(time: 12, unit: 'HOURS')
          }
          environment {
            HOME = "${env.WORKSPACE}"
          }
          when {
            beforeAgent true
            beforeInput true
            allOf {
              branch 'master'
              //expression { return params.release }
            }
          }
          stages {
            stage('Notify') {
              steps {
                deleteDir()
                unstash 'source'
                dir("${BASE_DIR}") {
                  prepareRelease() {
                    script {
                      sh 'npm ci'
                      sh(label: 'Lerna version dry-run', script: 'lerna version --no-push --yes', returnStdout: true)
                      releaseVersions = sh(label: 'Gather versions from last commit', script: 'git log -1 --format="%b"', returnStdout: true)
                      log(level: 'INFO', text: "Versions: ${releaseVersions}")
                    }
                  }
                }
              }
            }
            stage('Release CI') {
              options { skipDefaultCheckout() }
              input {
                message 'Should we release a new version?'
                ok 'Yes, we should.'
                parameters {
                  text defaultValue: generateVersions(), description: 'Look at the versions to be released. They cannot be edited here', name: 'versions'
                }
              }
              steps {
                deleteDir()
                unstash 'source'
                dir("${BASE_DIR}") {
                  prepareRelease() {
                    sh '''
                      npm ci
                      npm run release-ci
                    '''
                  }
                }
              }
              post {
                always {
                  script {
                    currentBuild.description = "${currentBuild.description?.trim() ? currentBuild.description : ''} released"
                  }
                }
              }
            }
          }
        }
        stage('Opbeans') {
            when {
                beforeAgent true
                tag pattern: '@elastic/apm-rum@\\d+\\.\\d+\\.\\d+$', comparator: 'REGEXP'
            }
            environment {
                REPO_NAME = "${OPBEANS_REPO}"
            }
            steps {
                echo 'opbeans'
            }
        }
      }
    }
  }
}

def prepareRelease(Closure body){
  withNpmrc(secret: "${env.NPMRC_SECRET}") {
    withTotpVault(secret: "${env.TOTP_SECRET}", code_var_name: 'TOTP_CODE'){
      withCredentials([string(credentialsId: '2a9602aa-ab9f-4e52-baf3-b71ca88469c7', variable: 'GITHUB_TOKEN')]) {
        sh 'scripts/prepare-git-context.sh'
        body()
      }
    }
  }
}

def generateVersions() {
  def tags = []
  tags.add("foo")
  tags.add("bar")
  tags.add("unable to fetch tags for ${releaseVersions}")
  return tags.join('\n')
}