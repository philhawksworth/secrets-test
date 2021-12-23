// GENERATED VIA `netlify-plugin-netligraph`, EDIT WITH CAUTION!
import https from 'https'
import crypto from 'crypto'

export const verifySignature = (input) => {
  const secret = input.secrt
  const body = input.body
  const signature = input.signature

  if (!signature) {
    console.error('Missing signature')
    return false
  }

  const sig = {}
  for (const pair of signature.split(',')) {
    const [k, v] = pair.split('=')
    sig[k] = v
  }

  if (!sig.t || !sig.hmac_sha256) {
    console.error('Invalid signature header')
    return false
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(sig.t)
    .update('.')
    .update(body)
    .digest('hex')

  if (
    !crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(sig.hmac_sha256, 'hex')
    )
  ) {
    console.error('Invalid signature')
    return false
  }

  if (parseInt(sig.t, 10) < Date.now() / 1000 - 300 /* 5 minutes */) {
    console.error('Request is too old')
    return false
  }

  return true
}

const fetch = (appId, options) => {
  var reqBody = JSON.stringify(options.reqBody || null)
  const userHeaders = options.headers || {}
  const headers = {
    ...userHeaders,
    'Content-Type': 'application/json',
    'Content-Length': reqBody.length,
  }

  var reqOptions = {
    method: 'POST',
    headers: headers,
    timeout: 30000,
  }

  const url = 'https://serve.onegraph.com/graphql?app_id=' + appId

  const respBody = []

  return new Promise((resolve, reject) => {
    var req = https.request(url, reqOptions, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(
          new Error(
            'Netlify OneGraph return non - OK HTTP status code' + res.statusCode
          )
        )
      }

      res.on('data', (chunk) => respBody.push(chunk))

      res.on('end', () => {
        const resString = Buffer.concat(respBody).toString()
        resolve(resString)
      })
    })

    req.on('error', (e) => {
      console.error('Error making request to Netlify OneGraph: ', e)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request to Netlify OneGraph timed out'))
    })

    req.write(reqBody)
    req.end()
  })
}

export async function fetchOneGraphPersisted(
  accessToken,
  docId,
  operationName,
  variables
) {
  const payload = {
    doc_id: docId,
    variables: variables,
    operationName: operationName,
  }

  const result = await fetch(
    'https://serve.onegraph.com/graphql?app_id=' + process.env.ONEGRAPH_APP_ID,
    {
      method: 'POST',
      headers: {
        Authorization: accessToken ? 'Bearer ' + accessToken : '',
      },
      body: JSON.stringify(payload),
    }
  )

  //@ts-ignore
  return JSON.parse(result)
}

export const verifyRequestSignature = (request) => {
  const event = request.event
  const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET
  const signature = event.headers['x-onegraph-signature']
  const body = event.body

  if (!secret) {
    console.error(
      'NETLIGRAPH_WEBHOOK_SECRET is not set, cannot verify incoming webhook request'
    )
    return false
  }

  return verifySignature({ secret, signature, body: body || '' })
}

const fetchDownloadsLastMonth = (variables, accessToken) => {
  return fetchOneGraphPersisted(
    accessToken,
    '445db4e0-69b1-42a8-a01e-c474bb6ed5c4',
    'DownloadsLastMonth',
    variables
  )
}

const executePostTweet = (variables, accessToken) => {
  return fetchOneGraphPersisted(
    accessToken,
    '67469763-d542-4b7b-b2df-0305065126cb',
    'PostTweet',
    variables
  )
}

const subscribeToNpmPackageActivity = (
  /**
   * This will be available in your webhook handler as a query parameter.
   * Use this to keep track of which subscription you're receiving
   * events for.
   */
  netligraphWebhookId,
  variables,
  accessToken
) => {
  const netligraphWebhookUrl = `${process.env.DEPLOY_URL}/.netlify/functions/Unknown?netligraphWebhookId=${netligraphWebhookId}`
  const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET

  fetchOneGraphPersisted({
    doc_id: '82772dd7-7242-4912-829a-85e4f980d588',
    oeprationName: 'NpmPackageActivity',
    variables: {
      ...variables,
      netligraphWebhookUrl: netligraphWebhookUrl,
      netligraphWebhookSecret: { hmacSha256Key: secret },
    },
    accessToken: accessToken,
  })
}

const parseAndVerifyNpmPackageActivityEvent = (event) => {
  if (!verifyRequestSignature({ event: event })) {
    console.warn('Unable to verify signature for Unknown')
    return null
  }

  return JSON.parse(event.body || '{}')
}

const functions = {
  /**
   * Find out the downloads a given package had on npm last month
   */
  fetchDownloadsLastMonth: fetchDownloadsLastMonth,
  /**
   * Post a Tweet from the currently authenticated account
   */
  executePostTweet: executePostTweet,
  /**
   * Be notified every time a package is published on npm
   */
  subscribeToNpmPackageActivity: subscribeToNpmPackageActivity,
  /**
   * Verify the event body is signed securely, and then parse the result.
   */
  parseAndVerifyNpmPackageActivityEvent: parseAndVerifyNpmPackageActivityEvent,
}

export default functions
