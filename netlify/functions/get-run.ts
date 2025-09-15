import type { Handler } from '@netlify/functions'
import { getRun } from '../../src/lib/blobs'

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { tenant_id: tenantId, period } = event.queryStringParameters || {}

    if (!tenantId || !period) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required parameters: tenant_id and period'
        })
      }
    }

    const run = await getRun(tenantId, period)

    if (!run) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Run not found',
          tenant_id: tenantId,
          period: period
        })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(run)
    }
  } catch (error) {
    console.error('Get run error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve run',
        message: (error as Error).message
      })
    }
  }
}