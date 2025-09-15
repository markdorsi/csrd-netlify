import type { Handler, Context } from '@netlify/functions'
import { getStore, getDeployStore, listStores } from '@netlify/blobs'

const STORE_NAME = 'test-store'
const TEST_KEY = 'test-data'

function getBlobStore() {
  console.log('🔍 STEP 1: Checking ALL environment variables')

  // Log ALL environment variables to see what's available
  const allEnvVars = Object.keys(process.env).reduce((acc, key) => {
    if (key.includes('NETLIFY') || key.includes('SITE') || key.includes('DEPLOY') || key.includes('CONTEXT') || key.includes('BLOB')) {
      acc[key] = process.env[key]
    }
    return acc
  }, {} as Record<string, string | undefined>)

  console.log('Netlify-related environment variables:', allEnvVars)

  const env = {
    CONTEXT: process.env.CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
    DEPLOY_ID: process.env.DEPLOY_ID,
    SITE_ID: process.env.SITE_ID,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
    AWS_REGION: process.env.AWS_REGION,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
    // Check for additional Netlify-specific vars
    NETLIFY: process.env.NETLIFY,
    NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID,
    URL: process.env.URL
  }
  console.log('Key environment variables:', env)

  let storeCreationResults: any = {
    attempted: [],
    failed: [],
    success: null
  }

  // Since automatic configuration isn't working, let's try manual configuration
  // The errors indicate we need siteID and token for global store, deployID for deploy store

  const siteId = process.env.SITE_ID || process.env.NETLIFY_SITE_ID
  const deployId = process.env.DEPLOY_ID

  // Try global store with siteID (token should be auto-provided in Netlify context)
  if (siteId) {
    console.log('🔍 STEP 2: Attempting global store with manual siteID...')
    storeCreationResults.attempted.push('global-manual')

    try {
      console.log(`🔍 Using siteID: ${siteId}`)
      // According to the Netlify Blobs docs, in a Netlify Function the token should be auto-provided
      // Try with consistency option first to see if that helps
      const globalStore = getStore(STORE_NAME, { consistency: 'eventual' })
      console.log('✅ STEP 2 SUCCESS: Global store with manual siteID created')
      storeCreationResults.success = 'global-manual'
      return globalStore
    } catch (globalError) {
      console.log('❌ STEP 2 FAILED: Global store with manual siteID failed')
      console.log('Global store error details:', {
        message: (globalError as Error).message,
        name: (globalError as Error).name,
        stack: (globalError as Error).stack
      })
      storeCreationResults.failed.push({ type: 'global-manual', error: (globalError as Error).message })
    }
  } else {
    console.log('❌ STEP 2 SKIPPED: No siteID available for global store')
    storeCreationResults.failed.push({ type: 'global-manual', error: 'No siteID available' })
  }

  // Try deploy store with deployID
  if (deployId) {
    console.log('🔍 STEP 3: Attempting deploy store with manual deployID...')
    storeCreationResults.attempted.push('deploy-manual')

    try {
      console.log(`🔍 Using deployID: ${deployId}`)
      const deployStore = getDeployStore({ name: STORE_NAME, deployID: deployId })
      console.log('✅ STEP 3 SUCCESS: Deploy store with manual deployID created')
      storeCreationResults.success = 'deploy-manual'
      return deployStore
    } catch (deployError) {
      console.log('❌ STEP 3 FAILED: Deploy store with manual deployID failed')
      console.log('Deploy store error details:', {
        message: (deployError as Error).message,
        name: (deployError as Error).name,
        stack: (deployError as Error).stack
      })
      storeCreationResults.failed.push({ type: 'deploy-manual', error: (deployError as Error).message })
    }
  } else {
    console.log('❌ STEP 3 SKIPPED: No deployID available for deploy store')
    storeCreationResults.failed.push({ type: 'deploy-manual', error: 'No deployID available' })
  }

  // Try basic stores as fallback (this will likely fail but let's be thorough)
  console.log('🔍 STEP 4: Attempting basic global store fallback...')
  storeCreationResults.attempted.push('global-basic')

  try {
    console.log('🔍 Calling getStore with just store name...')
    const globalStore = getStore(STORE_NAME)
    console.log('✅ STEP 4 SUCCESS: Basic global store created')
    storeCreationResults.success = 'global-basic'
    return globalStore
  } catch (globalError) {
    console.log('❌ STEP 4 FAILED: Basic global store failed')
    storeCreationResults.failed.push({ type: 'global-basic', error: (globalError as Error).message })
  }

  console.log('🔍 STEP 5: Attempting basic deploy store fallback...')
  storeCreationResults.attempted.push('deploy-basic')

  try {
    console.log('🔍 Calling getDeployStore with just store name...')
    const deployStore = getDeployStore(STORE_NAME)
    console.log('✅ STEP 5 SUCCESS: Basic deploy store created')
    storeCreationResults.success = 'deploy-basic'
    return deployStore
  } catch (deployError) {
    console.log('❌ STEP 5 FAILED: Basic deploy store failed')
    storeCreationResults.failed.push({ type: 'deploy-basic', error: (deployError as Error).message })
  }

  console.log('💥 FINAL RESULT: All store creation attempts failed')
  throw new Error(`All stores failed. Results: ${JSON.stringify(storeCreationResults, null, 2)}`)
}

export const handler: Handler = async (event, context) => {
  console.log('🚀 BLOB TEST FUNCTION STARTED')
  console.log('📋 Function invocation details:', {
    method: event.httpMethod,
    query: event.queryStringParameters,
    body: event.body ? 'Present' : 'None',
    headers: Object.keys(event.headers || {}),
    path: event.path
  })

  try {
    console.log('🔍 PARSING ACTION from request...')
    const action = event.httpMethod === 'POST'
      ? JSON.parse(event.body || '{}').action
      : event.queryStringParameters?.action

    console.log(`✅ Action parsed: "${action}"`)

    if (!action) {
      console.log('❌ No action provided, returning error')
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing action parameter',
          availableActions: ['write', 'read', 'list']
        })
      }
    }

    console.log('🔍 CREATING BLOB STORE...')
    const store = getBlobStore()
    console.log('✅ Blob store created successfully, proceeding with action')

    switch (action) {
      case 'write': {
        console.log('📝 WRITE OPERATION STARTING...')

        console.log('🔍 Parsing data from request body...')
        const data = JSON.parse(event.body || '{}').data || {
          message: 'Default test data',
          timestamp: new Date().toISOString()
        }
        console.log('✅ Data to write:', data)

        console.log(`🔍 Calling store.setJSON with key: "${TEST_KEY}"`)
        await store.setJSON(TEST_KEY, data)
        console.log('✅ WRITE OPERATION COMPLETED SUCCESSFULLY')

        const response = {
          success: true,
          action: 'write',
          key: TEST_KEY,
          data: data,
          store: STORE_NAME,
          timestamp: new Date().toISOString()
        }

        console.log('📤 Returning write response:', response)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        }
      }

      case 'read': {
        console.log('📖 READ OPERATION STARTING...')

        console.log(`🔍 Calling store.get with key: "${TEST_KEY}"`)
        const data = await store.get(TEST_KEY, { type: 'json' })
        console.log('✅ READ OPERATION COMPLETED')
        console.log('📋 Read result:', data ? 'Data found' : 'No data found')
        console.log('📊 Read data preview:', data)

        const response = {
          success: true,
          action: 'read',
          key: TEST_KEY,
          data: data,
          found: data !== null,
          store: STORE_NAME,
          timestamp: new Date().toISOString()
        }

        console.log('📤 Returning read response:', response)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        }
      }

      case 'list': {
        console.log('📋 LIST OPERATION STARTING...')

        console.log('🔍 Calling store.list()...')
        const listResult = await store.list()
        const blobs = listResult.blobs || []
        console.log(`✅ List operation completed, found ${blobs.length} blobs`)
        console.log('📊 Blob details:', blobs)

        // Also try to list all stores
        console.log('🔍 Attempting to list all stores...')
        let allStores: string[] = []
        let storeListError = null
        try {
          const storesList = await listStores()
          allStores = Array.isArray(storesList.stores) ? storesList.stores : []
          console.log(`✅ Found ${allStores.length} total stores:`, allStores)
        } catch (error) {
          storeListError = (error as Error).message
          console.log('❌ Could not list all stores:', error)
        }

        const response = {
          success: true,
          action: 'list',
          store: STORE_NAME,
          blobs: blobs,
          blobCount: blobs.length,
          allStores: allStores,
          storeListError: storeListError,
          timestamp: new Date().toISOString()
        }

        console.log('📤 Returning list response:', response)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        }
      }

      default:
        console.log(`❌ Invalid action received: "${action}"`)
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Invalid action',
            received: action,
            availableActions: ['write', 'read', 'list']
          })
        }
    }

  } catch (error) {
    console.log('💥 CRITICAL ERROR in blob test function')
    console.error('❌ Error details:', {
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack
    })

    const errorResponse = {
      error: 'Blob operation failed',
      message: (error as Error).message,
      stack: (error as Error).stack,
      environment: {
        CONTEXT: process.env.CONTEXT,
        NODE_ENV: process.env.NODE_ENV,
        DEPLOY_ID: process.env.DEPLOY_ID ? 'Present' : 'Missing',
        SITE_ID: process.env.SITE_ID ? 'Present' : 'Missing'
      },
      timestamp: new Date().toISOString()
    }

    console.log('📤 Returning error response:', errorResponse)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorResponse)
    }
  }
}