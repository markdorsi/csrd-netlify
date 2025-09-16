import type { Handler } from '@netlify/functions'

console.log('✅ List-runs function loaded')

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

    const listResponse = await fetch(`${process.env.URL || 'https://csrd-netlify-518748.netlify.app'}/.netlify/functions/storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'list',
        prefix: `runs/${tenantId}/`
      })
    })

    if (!listResponse.ok) {
      throw new Error(`Storage function error: ${listResponse.status}`)
    }

    const listResult = await listResponse.json()
    const periods = listResult.keys
      .filter((item: any) => item.key.startsWith(`runs/${tenantId}/`))
      .map((item: any) => item.key.replace(`runs/${tenantId}/`, ''))
      .sort()

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