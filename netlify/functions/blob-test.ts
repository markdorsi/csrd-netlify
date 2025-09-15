import type { Handler } from '@netlify/functions'
import { getStore, getDeployStore, listStores } from '@netlify/blobs'

const STORE_NAME = 'test-store'
const TEST_KEY = 'test-data'

function getBlobStore() {
  console.log('🔍 STEP 1: Checking environment variables')
  const env = {
    CONTEXT: process.env.CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
    DEPLOY_ID: process.env.DEPLOY_ID,
    SITE_ID: process.env.SITE_ID,
    NETLIFY_DEV: process.env.NETLIFY_DEV,
    AWS_REGION: process.env.AWS_REGION,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME
  }
  console.log('Environment variables:', env)

  let storeCreationResults: any = {
    attempted: [],
    failed: [],
    success: null
  }

  // Try global store first
  console.log('🔍 STEP 2: Attempting to create global store...')
  storeCreationResults.attempted.push('global')

  try {
    const globalStore = getStore(STORE_NAME)
    console.log('✅ STEP 2 SUCCESS: Global store created')
    storeCreationResults.success = 'global'
    return globalStore
  } catch (globalError) {
    console.log('❌ STEP 2 FAILED: Global store creation failed')
    console.log('Global store error details:', {
      message: (globalError as Error).message,
      name: (globalError as Error).name,
      stack: (globalError as Error).stack
    })
    storeCreationResults.failed.push({ type: 'global', error: (globalError as Error).message })

    // Try deploy store as fallback
    console.log('🔍 STEP 3: Attempting deploy store fallback...')
    storeCreationResults.attempted.push('deploy')

    try {
      const deployStore = getDeployStore(STORE_NAME)
      console.log('✅ STEP 3 SUCCESS: Deploy store created')
      storeCreationResults.success = 'deploy'
      return deployStore
    } catch (deployError) {
      console.log('❌ STEP 3 FAILED: Deploy store creation also failed')
      console.log('Deploy store error details:', {
        message: (deployError as Error).message,
        name: (deployError as Error).name,
        stack: (deployError as Error).stack
      })
      storeCreationResults.failed.push({ type: 'deploy', error: (deployError as Error).message })

      console.log('💥 FINAL RESULT: Both store types failed')
      throw new Error(`Both stores failed. Results: ${JSON.stringify(storeCreationResults, null, 2)}`)
    }
  }
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