import type { Handler } from '@netlify/functions'

// In-memory storage (persists across function invocations within the same container)
// This is a simple approach that works reliably on Netlify
let persistentStorage: Record<string, any> = {}

// Storage operations
interface StorageRequest {
  operation: 'set' | 'get' | 'delete' | 'list'
  key?: string
  value?: any
  prefix?: string
}

export const handler: Handler = async (event, context) => {
  console.log('🗄️ Storage function called:', {
    method: event.httpMethod,
    path: event.path
  })

  try {
    let request: StorageRequest

    if (event.httpMethod === 'POST') {
      request = JSON.parse(event.body || '{}')
    } else {
      const params = event.queryStringParameters || {}
      request = {
        operation: params.operation as 'get' | 'list',
        key: params.key,
        prefix: params.prefix
      }
    }

    console.log('Storage request:', { operation: request.operation, key: request.key })

    switch (request.operation) {
      case 'set': {
        if (!request.key || request.value === undefined) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Key and value are required for set operation'
            })
          }
        }

        persistentStorage[request.key] = {
          value: request.value,
          timestamp: new Date().toISOString()
        }

        console.log(`✅ Stored key: ${request.key}`)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            operation: 'set',
            key: request.key,
            stored_at: persistentStorage[request.key].timestamp
          })
        }
      }

      case 'get': {
        if (!request.key) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Key is required for get operation'
            })
          }
        }

        const stored = persistentStorage[request.key]
        const found = stored !== undefined

        console.log(`📖 Get key: ${request.key}, found: ${found}`)

        return {
          statusCode: found ? 200 : 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: found,
            operation: 'get',
            key: request.key,
            value: found ? stored.value : null,
            stored_at: found ? stored.timestamp : null,
            found
          })
        }
      }

      case 'delete': {
        if (!request.key) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Key is required for delete operation'
            })
          }
        }

        const existed = persistentStorage[request.key] !== undefined
        delete persistentStorage[request.key]

        console.log(`🗑️ Delete key: ${request.key}, existed: ${existed}`)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            operation: 'delete',
            key: request.key,
            existed
          })
        }
      }

      case 'list': {
        const prefix = request.prefix || ''
        const matchingKeys = Object.keys(persistentStorage).filter(key =>
          key.startsWith(prefix)
        )

        const results = matchingKeys.map(key => ({
          key,
          stored_at: persistentStorage[key].timestamp,
          preview: typeof persistentStorage[key].value === 'object'
            ? Object.keys(persistentStorage[key].value).slice(0, 3)
            : String(persistentStorage[key].value).substring(0, 50)
        }))

        console.log(`📋 List with prefix: "${prefix}", found: ${results.length} keys`)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            operation: 'list',
            prefix,
            count: results.length,
            keys: results,
            total_stored: Object.keys(persistentStorage).length
          })
        }
      }

      default: {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Invalid operation',
            available_operations: ['set', 'get', 'delete', 'list']
          })
        }
      }
    }

  } catch (error) {
    console.error('💥 Storage function error:', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Storage operation failed',
        message: (error as Error).message
      })
    }
  }
}