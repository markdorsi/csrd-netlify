import type { Handler } from '@netlify/functions'
import { getEmissionsStore } from '../../src/lib/hybrid-storage'

// Storage operations
interface StorageRequest {
  operation: 'set' | 'get' | 'delete' | 'list'
  key?: string
  value?: any
  prefix?: string
}

export const handler: Handler = async (event, context) => {
  console.log('🗄️ Hybrid storage function called:', {
    method: event.httpMethod,
    path: event.path
  })

  const store = getEmissionsStore()

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

    console.log('Hybrid storage request:', { operation: request.operation, key: request.key })

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

        await store.set(request.key, request.value)
        const timestamp = new Date().toISOString()

        console.log(`✅ Stored key via hybrid storage: ${request.key}`)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            operation: 'set',
            key: request.key,
            stored_at: timestamp
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

        const value = await store.get(request.key)
        const found = value !== null

        console.log(`📖 Get key via hybrid storage: ${request.key}, found: ${found}`)

        return {
          statusCode: found ? 200 : 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: found,
            operation: 'get',
            key: request.key,
            value: value,
            stored_at: found ? new Date().toISOString() : null,
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

        const existingValue = await store.get(request.key)
        const existed = existingValue !== null

        if (existed) {
          await store.delete(request.key)
        }

        console.log(`🗑️ Delete key via hybrid storage: ${request.key}, existed: ${existed}`)

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
        const results = await store.list(prefix)

        console.log(`📋 List via hybrid storage with prefix: "${prefix}", found: ${results.length} keys`)

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            operation: 'list',
            prefix,
            count: results.length,
            keys: results,
            cache_stats: store.getCacheStats()
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
    console.error('💥 Hybrid storage function error:', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Hybrid storage operation failed',
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      })
    }
  }
}