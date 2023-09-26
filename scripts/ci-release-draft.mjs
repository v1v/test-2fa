/**
 * MIT License
 *
 * Copyright (c) 2017-present, Elasticsearch BV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

import * as process from 'node:process'
import { execa } from 'execa'

function raiseError(msg) {
  console.log(msg)
  process.exit(1)
}

async function gitContext() {
  try {
    const { stdout: username } = await execa('git', ['config', 'user.name'])
    const { stdout: email } = await execa('git', ['config', 'user.email'])
    return {
      username,
      email
    }
  } catch (err) {
    raiseError('Failed to extract git context')
  }
}

// Script logic
async function main() {
  const isDryRun =
    process.env.DRY_RUN == null || process.env.DRY_RUN !== 'false'

  // Extract git context
  const ctx = await gitContext()
  console.log(`Git User: username=${ctx.username}, email=${ctx.email}`)

  if (isDryRun) {
    await dryRunMode()
  } else {
    await prodMode()
  }
}

async function dryRunMode() {
  console.log('Running in dry-run mode')

  try {
    await execa(
      'npx',
      ['lerna', 'version', '--no-push', '--yes'],
      { stdin: process.stdin }
    )
      .pipeStdout(process.stdout)
      .pipeStderr(process.stderr)
  } catch (err) {
    raiseError('Failed to publish npm packages')
  }

  await execa('git', ['diff', process.cwd()])
    .pipeStdout(process.stdout)
    .pipeStderr(process.stderr)

  await execa('git', ['log', '-1', '--stat', process.cwd()])
    .pipeStdout(process.stdout)
    .pipeStderr(process.stderr)
}

async function prodMode() {
  console.log('Running in prod mode')

  const githubToken = process.env.GITHUB_TOKEN
  if (githubToken == null || githubToken === '') {
    raiseError("The 'GITHUB_TOKEN' env var isn't defined")
  }

  try {
    await execa('npx', ['lerna', 'version', '--yes'], {
      stdin: process.stdin,
      env: {
        GH_TOKEN: githubToken
      }
    })
      .pipeStdout(process.stdout)
      .pipeStderr(process.stderr)
  } catch (err) {
    raiseError('Failed to publish npm packages')
  }

  try {
    await execa('npm', ['run', 'github-draft-release'], {
      stdin: process.stdin,
      env: {
        GITHUB_TOKEN: githubToken
      }
    })
      .pipeStdout(process.stdout)
      .pipeStderr(process.stderr)
  } catch (err) {
    raiseError('Failed to create github draft release')
  }
}

// Entrypoint
;(async () => {
  try {
    await main()
  } catch (err) {
    raiseError(err)
  }
})()
