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

const path = require('path')
const url = require('url')
const fs = require('fs')
const https = require('https')
const releaseAssets = require('gh-release-assets')
const { name, version } = require('../packages/test-2fa-bar/package.json')

function getDraftRelease(token) {
}

function publishRelease(uploadUrl, token) {

}

;(async function startRelease() {
  try {
    var token = process.env['GITHUB_TOKEN']
    if (!token) {
      throw new Error(
        'Please provide GITHUB_TOKEN=`token` for creating release'
      )
    }
    console.log('getting release for the tag - ', version)
    const response = await getDraftRelease(token)
    const parsedResponse = JSON.parse(response)
    console.log('release draft found', parsedResponse.url)
    const uploadUrl = parsedResponse['upload_url']
    await publishRelease(uploadUrl, token)
    console.log('release published')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
