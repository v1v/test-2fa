#!/usr/bin/env groovy

@Library('apm@current') _

pipeline {
  agent { label 'linux && immutable' }
  environment {
    REPO = 'test-2fa'
    BASE_DIR = "src/github.com/elastic/${env.REPO}"
    NOTIFY_TO = credentials('notify-to')
    JOB_GCS_BUCKET = credentials('gcs-bucket')
    PIPELINE_LOG_LEVEL = 'INFO'
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
            options { skipDefaultCheckout() }
            when {
                beforeAgent true
                allOf {
                  // To speedup the development cycles
                  //branch 'master'
                  expression { return params.release }
                }
            }
            steps {
                deleteDir()
                unstash 'source'
                dir("${BASE_DIR}") {
                    withTotpVault(secret: 'totp-apm/code/v1v', code_var_name: 'TOTP_CODE'){
                      sh 'scripts/prepare-git-context.sh'
                      sh '''
                        npm install
                        npm run test
                        npm run version
                        npm run release-ci
                        npm run github-release
                      '''
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
