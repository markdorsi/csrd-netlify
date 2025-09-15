import type { Tenant, EmissionRun, Factors } from './types'

// Storage operations that work within Netlify Functions by calling the storage function
async function storageRequest(operation: string, key?: string, value?: any, prefix?: string): Promise<any> {
  // Since we're inside a Netlify Function, we need to make an internal HTTP request
  // to our storage function. This is a bit unusual but necessary given the architecture.

  const body = JSON.stringify({
    operation,
    key,
    value,
    prefix
  })

  // In a Netlify Function context, we need to make a request to our own function
  // We'll construct the full URL based on the environment
  const baseUrl = process.env.URL || 'https://csrd-netlify-518748.netlify.app'
  const url = `${baseUrl}/.netlify/functions/storage`

  console.log(`Making storage request: ${operation} to ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  })

  const result = await response.json()

  if (!result.success && response.status !== 404) {
    throw new Error(result.error || 'Storage operation failed')
  }

  return result
}

// Tenant operations
export async function saveTenant(tenant: Tenant): Promise<void> {
  const key = `tenants/${tenant.tenant_id}`
  await storageRequest('set', key, tenant)
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const key = `tenants/${tenantId}`
  const result = await storageRequest('get', key)
  return result.found ? result.value : null
}

// Emission run operations
export async function saveRun(run: EmissionRun): Promise<void> {
  const key = `runs/${run.tenant_id}/${run.period}`
  await storageRequest('set', key, run)
}

export async function getRun(tenantId: string, period: string): Promise<EmissionRun | null> {
  const key = `runs/${tenantId}/${period}`
  try {
    const result = await storageRequest('get', key)
    return result.found ? result.value : null
  } catch (error) {
    console.log('Error getting run:', error)
    return null
  }
}

export async function listRuns(tenantId: string): Promise<string[]> {
  const prefix = `runs/${tenantId}/`
  const result = await storageRequest('list', undefined, undefined, prefix)

  return result.keys
    .map((item: any) => item.key.replace(prefix, ''))
    .sort()
    .reverse() // Most recent first
}

// Custom factors operations
export async function saveCustomFactors(tenantId: string, factors: Factors): Promise<void> {
  const key = `factors/${tenantId}`
  await storageRequest('set', key, factors)
}

export async function getCustomFactors(tenantId: string): Promise<Factors | null> {
  const key = `factors/${tenantId}`
  const result = await storageRequest('get', key)
  return result.found ? result.value : null
}

export async function deleteRun(tenantId: string, period: string): Promise<void> {
  const key = `runs/${tenantId}/${period}`
  await storageRequest('delete', key)
}