import type { Handler } from '@netlify/functions'

console.log('✅ Get-run function loaded')

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { tenant_id: tenantId, period } = event.queryStringParameters || {}

    console.log('Get run request:', { tenantId, period })

    if (!tenantId || !period) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required parameters: tenant_id and period'
        })
      }
    }

    console.log('Attempting to get run via storage function...')

    const runResponse = await fetch('/.netlify/functions/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'get',
        key: `runs/${tenantId}/${period}`
      })
    })

    if (!runResponse.ok) {
      throw new Error(`Storage function error: ${runResponse.status}`)
    }

    const storageResult = await runResponse.json()
    const run = storageResult.found ? storageResult.value : null

    console.log('Run retrieved via storage function:', run ? 'Found' : 'Not found')

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
    console.error('Error stack:', (error as Error).stack)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve run',
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      })
    }
  }
}