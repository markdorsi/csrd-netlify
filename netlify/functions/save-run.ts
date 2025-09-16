import type { Handler } from '@netlify/functions'
import type { EmissionRun, Tenant } from '../../src/lib/types'

console.log('✅ Save-run function loaded')

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const run = JSON.parse(event.body || '{}') as EmissionRun

    // Validate required fields
    if (!run.tenant_id || !run.period || !run.inputs || !run.factors || !run.results) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    // Save the tenant information via storage function
    const tenant: Tenant = {
      tenant_id: run.tenant_id,
      tenant_name: run.tenant_id.toUpperCase(), // Default to ID as name
      contact_email: undefined,
      created_at: new Date().toISOString()
    }

    try {
      const tenantResponse = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'set',
          key: `tenants/${tenant.tenant_id}`,
          value: tenant
        })
      })
      if (!tenantResponse.ok) {
        console.warn('Failed to save tenant:', await tenantResponse.text())
      }
    } catch (error) {
      console.warn('Failed to save tenant (may already exist):', error)
    }

    // Save the emission run via storage function
    const runWithMetadata = {
      ...run,
      saved_at: new Date().toISOString(),
      version: 1
    }

    const runResponse = await fetch('/.netlify/functions/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'set',
        key: `runs/${run.tenant_id}/${run.period}`,
        value: runWithMetadata
      })
    })

    if (!runResponse.ok) {
      throw new Error(`Failed to save run: ${await runResponse.text()}`)
    }

    const saveResult = await runResponse.json()
    console.log('Run saved via storage function:', saveResult)

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Run saved successfully',
        tenant_id: run.tenant_id,
        period: run.period,
        report_url: `/report/${run.tenant_id}/${run.period}`
      })
    }
  } catch (error) {
    console.error('Save run error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to save run',
        message: (error as Error).message
      })
    }
  }
}