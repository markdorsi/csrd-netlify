import type { Handler } from '@netlify/functions'

// Simple in-memory storage for testing (will reset on each function cold start)
let memoryStore: Record<string, any> = {}

export const handler: Handler = async (event, context) => {
  console.log('🚀 SIMPLE STORAGE TEST FUNCTION STARTED')
  console.log('📋 Function details:', {
    method: event.httpMethod,
    query: event.queryStringParameters,
    path: event.path
  })

  try {
    const action = event.httpMethod === 'POST'
      ? JSON.parse(event.body || '{}').action
      : event.queryStringParameters?.action

    console.log(`✅ Action: "${action}"`)

    switch (action) {
      case 'write': {
        console.log('📝 WRITE OPERATION - Using in-memory storage')

        const data = JSON.parse(event.body || '{}').data || {
          message: 'Simple storage test data',
          timestamp: new Date().toISOString()
        }

        const key = 'test-data'
        memoryStore[key] = data

        console.log('✅ Data written to memory store')

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'write',
            key: key,
            data: data,
            storeType: 'memory',
            timestamp: new Date().toISOString()
          })
        }
      }

      case 'read': {
        console.log('📖 READ OPERATION - Reading from in-memory storage')

        const key = 'test-data'
        const data = memoryStore[key] || null

        console.log('✅ Data read from memory store:', data ? 'Found' : 'Not found')

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'read',
            key: key,
            data: data,
            found: data !== null,
            storeType: 'memory',
            timestamp: new Date().toISOString()
          })
        }
      }

      case 'list': {
        console.log('📋 LIST OPERATION - Listing memory store contents')

        const keys = Object.keys(memoryStore)
        const entries = Object.entries(memoryStore).map(([key, value]) => ({
          key,
          data: value
        }))

        console.log(`✅ Found ${keys.length} entries in memory store`)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'list',
            keys: keys,
            entries: entries,
            count: keys.length,
            storeType: 'memory',
            timestamp: new Date().toISOString()
          })
        }
      }

      case 'env': {
        console.log('🔍 ENV OPERATION - Checking environment')

        // Get all environment variables related to Netlify
        const netlifyEnv: Record<string, string> = {}
        Object.keys(process.env).forEach(key => {
          if (key.includes('NETLIFY') || key.includes('SITE') || key.includes('DEPLOY') || key.includes('BLOB')) {
            netlifyEnv[key] = process.env[key] || 'undefined'
          }
        })

        console.log('✅ Environment variables collected')

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            action: 'env',
            netlifyEnvironment: netlifyEnv,
            functionContext: {
              region: process.env.AWS_REGION,
              functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
              runtime: process.env.AWS_EXECUTION_ENV
            },
            timestamp: new Date().toISOString()
          })
        }
      }

      default: {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Invalid action',
            received: action,
            availableActions: ['write', 'read', 'list', 'env']
          })
        }
      }
    }

  } catch (error) {
    console.log('💥 ERROR in simple storage test')
    console.error('Error details:', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Simple storage test failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      })
    }
  }
}