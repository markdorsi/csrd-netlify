import type { Handler } from '@netlify/functions'
import { getStore, getDeployStore, listStores } from '@netlify/blobs'

const STORE_NAME = 'test-store'
const TEST_KEY = 'test-data'

function getBlobStore() {
  console.log('Environment variables:', {
    CONTEXT: process.env.CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
    DEPLOY_ID: process.env.DEPLOY_ID,
    SITE_ID: process.env.SITE_ID,
    NETLIFY_DEV: process.env.NETLIFY_DEV
  })

  try {
    console.log('Attempting to create global store...')
    const globalStore = getStore(STORE_NAME)
    console.log('✅ Global store created successfully')
    return globalStore
  } catch (globalError) {
    console.log('❌ Global store failed:', globalError)

    try {
      console.log('Attempting to create deploy store...')
      const deployStore = getDeployStore(STORE_NAME)
      console.log('✅ Deploy store created successfully')
      return deployStore
    } catch (deployError) {
      console.log('❌ Deploy store also failed:', deployError)
      throw new Error(`Both stores failed. Global: ${globalError}. Deploy: ${deployError}`)
    }
  }
}

export const handler: Handler = async (event, context) => {
  console.log('Blob test function called:', {
    method: event.httpMethod,
    query: event.queryStringParameters,
    body: event.body ? 'Present' : 'None'
  })

  try {
    const action = event.httpMethod === 'POST'
      ? JSON.parse(event.body || '{}').action
      : event.queryStringParameters?.action

    console.log('Action:', action)

    if (!action) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing action parameter',
          availableActions: ['write', 'read', 'list']
        })
      }
    }

    const store = getBlobStore()

    switch (action) {
      case 'write': {
        const data = JSON.parse(event.body || '{}').data || {
          message: 'Default test data',
          timestamp: new Date().toISOString()
        }

        console.log('Writing data to blob:', data)
        await store.setJSON(TEST_KEY, data)
        console.log('✅ Data written successfully')

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'write',
            key: TEST_KEY,
            data: data,
            store: STORE_NAME
          })
        }
      }

      case 'read': {
        console.log('Reading data from blob with key:', TEST_KEY)
        const data = await store.get(TEST_KEY, { type: 'json' })
        console.log('Read result:', data ? 'Found' : 'Not found')

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'read',
            key: TEST_KEY,
            data: data,
            found: data !== null,
            store: STORE_NAME
          })
        }
      }

      case 'list': {
        console.log('Listing all blobs in store')
        const { blobs } = await store.list()
        console.log('Found blobs:', blobs.length)

        // Also try to list all stores
        let allStores: string[] = []
        try {
          const storesList = await listStores()
          allStores = Array.isArray(storesList.stores) ? storesList.stores : []
          console.log('Available stores:', allStores)
        } catch (storeListError) {
          console.log('Could not list stores:', storeListError)
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'list',
            store: STORE_NAME,
            blobs: blobs,
            blobCount: blobs.length,
            allStores: allStores
          })
        }
      }

      default:
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
    console.error('Blob test error:', error)
    console.error('Error stack:', (error as Error).stack)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Blob operation failed',
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
        environment: {
          CONTEXT: process.env.CONTEXT,
          NODE_ENV: process.env.NODE_ENV,
          DEPLOY_ID: process.env.DEPLOY_ID ? 'Present' : 'Missing',
          SITE_ID: process.env.SITE_ID ? 'Present' : 'Missing'
        }
      })
    }
  }
}