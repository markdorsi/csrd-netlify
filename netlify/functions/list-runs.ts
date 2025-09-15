import type { Handler } from '@netlify/functions'
import { listRuns } from '../../src/lib/simple-storage'

console.log('✅ List-runs function loaded with simple storage')

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { tenant_id: tenantId } = event.queryStringParameters || {}

    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required parameter: tenant_id'
        })
      }
    }

    const periods = await listRuns(tenantId)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        periods: periods
      })
    }
  } catch (error) {
    console.error('List runs error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to list runs',
        message: (error as Error).message
      })
    }
  }
}