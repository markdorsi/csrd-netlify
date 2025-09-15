import type { Tenant, EmissionRun, Factors } from './types'

// Simple storage client that works with our custom Netlify Function
class SimpleStorage {
  private async request(data: any): Promise<any> {
    const response = await fetch('/.netlify/functions/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!result.success && response.status !== 404) {
      throw new Error(result.error || 'Storage operation failed')
    }

    return result
  }

  async set(key: string, value: any): Promise<void> {
    await this.request({
      operation: 'set',
      key,
      value
    })
  }

  async get(key: string): Promise<any> {
    const result = await this.request({
      operation: 'get',
      key
    })

    return result.found ? result.value : null
  }

  async delete(key: string): Promise<void> {
    await this.request({
      operation: 'delete',
      key
    })
  }

  async list(prefix: string = ''): Promise<string[]> {
    const result = await this.request({
      operation: 'list',
      prefix
    })

    return result.keys.map((item: any) => item.key)
  }
}

// Global storage instance
const storage = new SimpleStorage()

// Tenant operations
export async function saveTenant(tenant: Tenant): Promise<void> {
  const key = `tenants/${tenant.tenant_id}`
  await storage.set(key, tenant)
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const key = `tenants/${tenantId}`
  return await storage.get(key)
}

// Emission run operations
export async function saveRun(run: EmissionRun): Promise<void> {
  const key = `runs/${run.tenant_id}/${run.period}`
  await storage.set(key, run)
}

export async function getRun(tenantId: string, period: string): Promise<EmissionRun | null> {
  const key = `runs/${tenantId}/${period}`
  return await storage.get(key)
}

export async function listRuns(tenantId: string): Promise<string[]> {
  const prefix = `runs/${tenantId}/`
  const keys = await storage.list(prefix)

  return keys
    .map(key => key.replace(prefix, ''))
    .sort()
    .reverse() // Most recent first
}

// Custom factors operations
export async function saveCustomFactors(tenantId: string, factors: Factors): Promise<void> {
  const key = `factors/${tenantId}`
  await storage.set(key, factors)
}

export async function getCustomFactors(tenantId: string): Promise<Factors | null> {
  const key = `factors/${tenantId}`
  return await storage.get(key)
}

export async function deleteRun(tenantId: string, period: string): Promise<void> {
  const key = `runs/${tenantId}/${period}`
  await storage.delete(key)
}