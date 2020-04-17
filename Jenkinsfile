#!/usr/bin/env groovy

@Library('apm@current') _

pipeline {
  agent { label 'linux && immutable' }
  environment {
    REPO = 'test-2fa'
    BASE_DIR = "src/github.com/elastic/${env.REPO}"
  }
  options {
    timestamps()
    ansiColor('xterm')
    disableResume()
    durabilityHint('PERFORMANCE_OPTIMIZED')
  }
  stages {
    stage('Checkout') {
      options { skipDefaultCheckout() }
      environment {
        HOME = "${env.WORKSPACE}"
      }
      steps {
        setupAPMGitEmail(global: true)
        dir('test') {
          sh 'git clone "https://github.com/v1v/test-2fa"'
          dir('test-2fa') {
            sh 'touch foo'
            sh 'git add foo && git commit -m "ci: automated"'
            githubCreatePullRequest(title: 'test: synchronizing bdd spec', labels: 'automation')
          }              
        }
      }
    }
  }
}
