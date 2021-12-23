/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
/* eslint-disable no-unused-vars */
import fetch from 'node-fetch'
import fs from 'fs'
import {
  patchSubscriptionWebhookField,
  patchSubscriptionWebhookSecretField,
  typeScriptSignatureForOperation,
  typeScriptSignatureForOperationVariables,
} from './lib/graphqlHelpers.mjs'
import { buildClientSchema, parse, print } from 'graphql'
import Prettier from 'prettier'

const ONEDASH_APP_ID = '0b066ba6-ed39-4db8-a497-ba0be34d5b2a'

export default function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const generatedOneGraphClient = `
const fetch = (appId, options) => {
  var reqBody = options.body || null
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
            "Netlify OneGraph return non - OK HTTP status code" + res.statusCode,
          ),
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
  variables,
) {
  const payload = {
    doc_id: docId,
    variables: variables,
    operationName: operationName,
  }

  const result = await fetch(
    process.env.SITE_ID,
    {
      method: 'POST',
      headers: {
        Authorization: accessToken ? "Bearer " + accessToken : '',
      },
      body: JSON.stringify(payload),
    },
  )

  // @ts-ignore
  return JSON.parse(result)
}

export async function fetchOneGraph(
  accessToken,
  query,
  operationName,
  variables,
) {
  const payload = {
    query: query,
    variables: variables,
    operationName: operationName,
  }

  const result = await fetch(
    process.env.SITE_ID,
    {
      method: 'POST',
      headers: {
        Authorization: accessToken ? "Bearer " + accessToken : '',
      },
      body: JSON.stringify(payload),
    },
  )

  // @ts-ignore
  return JSON.parse(result)
}
`

const fetchOneGraph = async (
  authToken,
  appId,
  operationsDoc,
  operationName,
  variables
) => {
  const url = `https://serve.onegraph.com/graphql?app_id=${appId}`
  const headers = {
    Authorization: `Bearer ${authToken}`,
  }
  const body = {
    query: operationsDoc,
    variables: variables,
    operationName: operationName,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    })

    const json = await response.json()

    return json
  } catch (err) {
    console.error("Error fetching persisted query library: ", err)
  }
}

export const fetchOneGraphSchemaJson = async (appId, enabledServices) => {
  const url = `https://serve.onegraph.com/schema?app_id=${appId}&enabled_services=${enabledServices.join(',')}`
  const headers = {
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      body: null
    })

    const json = await response.json()

    return json
  } catch (err) {
    console.error("Error fetching schema: ", err)
  }
}

export const fetchOneGraphSchema = async (appId, enabledServices) => {
  const result = await fetchOneGraphSchemaJson(appId, enabledServices);
  const schema = buildClientSchema(result.data);
  return schema
}

const operationsDoc = `
query AppSchemaQuery(
  $nfToken: String!
  $appId: String!
) {
  oneGraph(
    auths: { netlifyAuth: { oauthToken: $nfToken } }
  ) {
    app(id: $appId) {
      graphQLSchema {
        appId
        createdAt
        id
        services {
          friendlyServiceName
          logoUrl
          service
          slug
          supportsCustomRedirectUri
          supportsCustomServiceAuth
          supportsOauthLogin
        }
        updatedAt
      }
    }
  }
}

mutation UpsertAppForSiteMutation(
  $nfToken: String!
  $siteId: String!
) {
  oneGraph(
    auths: { netlifyAuth: { oauthToken: $nfToken } }
  ) {
    upsertAppForNetlifySite(
      input: { netlifySiteId: $siteId }
    ) {
      org {
        id
        name
      }
      app {
        id
        name
        corsOrigins
        customCorsOrigins {
          friendlyServiceName
          displayName
          encodedValue
        }
      }
    }
  }
}`

export const fetchAppSchema = async (
  nfToken,
  siteId
) => {
  const result = await fetchOneGraph(nfToken, siteId, operationsDoc, 'AppSchemaQuery',
    {
      nfToken: nfToken,
      appId: siteId,
    },
  );

  return result.data?.oneGraph?.app?.graphQLSchema
};

export const upsertAppForSite = async (
  nfToken,
  siteId
) => {
  const result = await fetchOneGraph(nfToken, ONEDASH_APP_ID, operationsDoc, 'UpsertAppForSiteMutation',
    {
      nfToken: nfToken,
      siteId: siteId,
    },
  );

  return result.data?.oneGraph?.upsertAppForNetlifySite?.app
};

export const fetchEnabledServices = async (authToken, appId) => {
  const appSchema = await fetchAppSchema(authToken, appId)
  return appSchema?.services || []
}

const subscriptionParserName = (fn) => {
  return `parseAndVerify${fn.operationName}Event`
}

const subscriptionFunctionName = (fn) => {
  return `subscribeTo${fn.operationName}`
}


const generateSubscriptionFunctionTypeDefinition = (
  schema,
  fn,
  fragments,
) => {
  const parsingFunctionReturnSignature = typeScriptSignatureForOperation(
    schema,
    fn.definition,
    fragments
  )

  const variableNames = (fn.parsedOperation.variableDefinitions || []).map(
    (varDef) => varDef.variable.name.value
  )

  const variableSignature = typeScriptSignatureForOperationVariables(
    variableNames,
    schema,
    fn.parsedOperation
  )

  const jsDoc = (fn.description || '')
    .replaceAll('*/', '!')
    .split('\n')
    .join('\n* ')

  return `/**
  * ${jsDoc}
  */
 export function ${subscriptionFunctionName(fn)} (
    /**
     * This will be available in your webhook handler as a query parameter.
     * Use this to keep track of which subscription you're receiving
     * events for.
     */
    netligraphWebhookId: string,
    variables: ${variableSignature},
    accessToken?: string | null
    ) : void

     /**
      * Verify the ${fn.operationName} event body is signed securely, and then parse the result.
      */
    export function ${subscriptionParserName(
    fn
  )} (/** A Netlify Handler Event */ event) : null | ${parsingFunctionReturnSignature}
`
}

const generateSubscriptionFunction = (
  schema,
  fn,
  fragments,
) => {
  const patchedWithWebhookUrl = patchSubscriptionWebhookField({
    schema: schema,
    definition: fn.parsedOperation,
  })

  const patched = patchSubscriptionWebhookSecretField({
    schema: schema,
    definition: patchedWithWebhookUrl,
  })

  // TODO: Don't allow unnamed operations as subscription
  const filename = patched.name && patched.name.value || 'Unknown'

  const body = print(patched)
  const safeBody = body.replaceAll('${', '\\${')

  return `const ${subscriptionFunctionName(fn)} = (
    /**
     * This will be available in your webhook handler as a query parameter.
     * Use this to keep track of which subscription you're receiving
     * events for.
     */
    netligraphWebhookId,
    variables,
    accessToken,
    ) => {
      const netligraphWebhookUrl = \`\${process.env.DEPLOY_URL}/.netlify/functions/${filename}?netligraphWebhookId=\${netligraphWebhookId}\`
      const secret = process.env.NETLIGRAPH_WEBHOOK_SECRET

      fetchOneGraphPersisted({
      doc_id: "${fn.id}",
      oeprationName: "${fn.operationName}",
      variables: {...variables, netligraphWebhookUrl: netligraphWebhookUrl, netligraphWebhookSecret: { hmacSha256Key: secret }},
      accessToken: accessToken
    })
  }

const ${subscriptionParserName(
    fn
  )} = (event) => {
  if (!verifyRequestSignature({ event: event })) {
    console.warn("Unable to verify signature for ${filename}")
    return null
  }
  
  return JSON.parse(event.body || '{}')
}`
}

const makeFunctionName = (kind, operationName) => {
  if (kind === 'query') {
    return `fetch${capitalizeFirstLetter(operationName)}`
  }
  else if (kind === 'mutation') {
    return `execute${capitalizeFirstLetter(operationName)} `
  }

  return capitalizeFirstLetter(operationName)
}

export const extractFunctionsFromOperationDoc = (
  parsedDoc
) => {
  const fns = parsedDoc.definitions
    .map((next) => {
      if (next.kind !== 'OperationDefinition') {
        return null;
      }

      const key = next.name?.value;

      const directive = next.directives?.find(
        (localDirective) => localDirective.name.value === 'netligraph'
      );
      const docArg =
        directive &&
        directive.arguments?.find((arg) => arg.name.value === 'doc');

      const docString = docArg?.value?.value;

      if (!key || !docString) {
        return null;
      }

      const operation = {
        id: key,
        description: docString,
        operation: next.operation,
        query: print(next),
      };

      return operation;
    })
    .filter(Boolean);

  return fns;
};

const queryToFunctionDefinition = (fullSchema, persistedQuery) => {
  const basicFn = {
    id: persistedQuery.id,
    definition: persistedQuery.query,
    description: persistedQuery.description
  }

  const body = basicFn.definition
  const safeBody = body.replaceAll('${', '\\${')

  const parsed = parse(body)
  const operations = parsed.definitions.filter(
    (def) => def.kind === 'OperationDefinition'
  )
  const fragments = parsed.definitions.filter(
    (def) => def.kind === 'FragmentDefinition'
  )

  if (!operations) {
    throw new Error(`Operation definition is required in ${basicFn.id}`)
  }

  const [operation] = operations

  const returnSignature = typeScriptSignatureForOperation(
    fullSchema,
    operation,
    fragments
  )

  const variableNames = (operation.variableDefinitions || []).map(
    (varDef) => varDef.variable.name.value
  )

  const variableSignature = typeScriptSignatureForOperationVariables(
    variableNames,
    fullSchema,
    operation
  )

  const operationName = operation.name && operation.name.value

  if (!operationName) {
    throw new Error(`Operation name is required in ${basicFn.definition}\n\tfound: ${JSON.stringify(operation.name)}`)
  }

  const fn = {
    ...basicFn,
    fnName: makeFunctionName(operation.operation, operationName),
    safeBody,
    kind: operation.operation,
    variableSignature,
    returnSignature,
    operationName,
    parsedOperation: operation
  }

  return fn
}

const generateJavaScriptClient = (
  schema,
  operationsDoc,
  enabledFunctions
) => {
  const safeOperationsDoc = operationsDoc.replaceAll('${', '\\${').replaceAll('`', '\\`');
  const functionDecls = enabledFunctions.map((fn) => {
    if (fn.kind === 'subscription') {
      const fragments = []
      return generateSubscriptionFunction(schema, fn, fragments)
    }


    const dynamicFunction = `const ${fn.fnName} = (
  variables,
  accessToken,
  ) => {
  return fetchOneGraph({
    query: \`${fn.safeBody}\`,
    variables: variables,
    accessToken: accessToken
  })
}

  `

    const staticFunction = `const ${fn.fnName} = (
  variables,
  accessToken,
  ) => {
//  return fetchOneGraphPersisted(accessToken, "${fn.id}", "${fn.operationName}", variables)
  return fetchOneGraph(accessToken, operationsDoc, "${fn.operationName}", variables)
}

`
    return fn.id ? staticFunction : dynamicFunction
  })

  const exportedFunctionsObjectProperties = enabledFunctions
    .map((fn) => {
      const isSubscription = fn.kind === 'subscription'

      if (isSubscription) {
        const subscriptionFnName = subscriptionFunctionName(fn)
        const parserFnName = subscriptionParserName(fn)

        const jsDoc = (fn.description || '')
          .replaceAll('*/', '')
          .split('\n')
          .join('\n* ')

        return `/**
        * ${jsDoc}
        */
          ${subscriptionFnName}:${subscriptionFnName},
        /**
         * Verify the event body is signed securely, and then parse the result.
         */
        ${parserFnName}:${parserFnName}`
      }
      const jsDoc = (fn.description || '')
        .replaceAll('*/', '')
        .split('\n')
        .join('\n* ')

      return `/**
        * ${jsDoc}
        */
          ${fn.fnName}:${fn.fnName}`

    })
    .join(',\n  ')

  const source = `// GENERATED VIA \`netlify-plugin-netligraph\`, EDIT WITH CAUTION!
import https from 'https'
import crypto from 'crypto'

export const verifySignature = (input) => {
  const secret = input.secret
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

const operationsDoc = \`${safeOperationsDoc}\`

${generatedOneGraphClient}

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

  ${functionDecls.join('\n\n')}
  
  const functions = {
    ${exportedFunctionsObjectProperties}
  }
    
  export default functions
  `

  // const formatted = Prettier.format(source, {
  //     tabWidth: 2,
  //     semi: false,
  //     singleQuote: true,
  //     parser: 'babel-ts',
  // })

  return source
}

export const generateTypeScriptDefinitions = (
  schema,
  enabledFunctions
) => {
  const functionDecls = enabledFunctions.map((fn) => {
    const isSubscription = fn.kind === 'subscription'

    if (isSubscription) {
      const fragments = []
      return generateSubscriptionFunctionTypeDefinition(schema, fn, fragments)
    }

    if (isSubscription) {
      const subscriptionFnName = subscriptionFunctionName(fn)
      const parserFnName = subscriptionParserName(fn)

      const jsDoc = (fn.description || '')
        .replaceAll('*/', '')
        .split('\n')
        .join('\n* ')

      return `/**
      * ${jsDoc}
      */
        ${subscriptionFnName}:${subscriptionFnName},
      /**
       * Verify the event body is signed securely, and then parse the result.
       */
      ${parserFnName}:${parserFnName}`
    } else {
      const jsDoc = (fn.description || ``)
        .replaceAll('*/', '')
        .split('\n')
        .join('\n* ')

      return `/**
      * ${jsDoc}
      */
      export function ${fn.fnName}(variables: ${fn.variableSignature}, accessToken: string): Promise<${fn.returnSignature}>;`
    }
  })

  const source = `// GENERATED VIA \`netlify-plugin-netligraph\`, EDIT WITH CAUTION!
${functionDecls.join('\n\n')}
`

  const formatted = Prettier.format(source, {
    tabWidth: 2,
    semi: false,
    singleQuote: true,
    parser: 'babel-ts',
  })

  return formatted
}

const sourceOperationsFilename = 'netligraphOperationsLibrary.graphql'

export const readGraphQLOperationsSourceFile = (basePath) => {
  const fullFilename = `${basePath}/${sourceOperationsFilename}`

  if (!fs.existsSync(fullFilename)) {
    fs.closeSync(fs.openSync(fullFilename, 'w'))
  }
  const source = fs.readFileSync(fullFilename, 'utf8')

  return source
}

export const readAndParseGraphQLOperationsSourceFile = (basePath) => {
  const source = readGraphQLOperationsSourceFile(basePath)

  try {
    const parsedGraphQLDoc = parse(source, {
      noLocation: true,
    })

    return [parsedGraphQLDoc]
  } catch (error) {
    return []
  }
}

export const generateFunctionsFile = (basePath, schema, operationsDoc, queries) => {
  const functionDefinitions = queries.map((query) => queryToFunctionDefinition(schema, query))
  const clientSource = generateJavaScriptClient(schema, operationsDoc, functionDefinitions)
  const typeDefinitionsSource = generateTypeScriptDefinitions(schema, functionDefinitions)

  fs.writeFileSync(`${basePath}/netligraphFunctions.mjs`, clientSource, 'utf8')
  fs.writeFileSync(`${basePath}/netligraphFunctions.d.ts`, typeDefinitionsSource, 'utf8')
}

export const writeGraphQLOperationsSourceFile = (basePath, queries) => {
  const functionDefinitions = queries.map((query) => queryToFunctionDefinition(schema, query))

  const querySource = ''

  const graphqlSource = `/* GENERATED VIA \`netlify-plugin-netligraph\`, EDIT WITH CAUTION! */
${querySource}`

  fs.writeFileSync(basePath + '/netlifyOperationsLibrary.graphql', graphqlSource, 'utf8')
}
