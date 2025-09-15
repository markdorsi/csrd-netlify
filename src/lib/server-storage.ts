import type { Tenant, EmissionRun, Factors } from './types'

// Server-side storage operations that work within Netlify Functions
// This uses the same in-memory storage as the storage function
let serverStorage: Record<string, any> = {}

// Server-side storage operations (direct, no HTTP calls)
export function setItem(key: string, value: any): void {
  serverStorage[key] = {
    value,
    timestamp: new Date().toISOString()
  }
}

export function getItem(key: string): any {
  const stored = serverStorage[key]
  return stored ? stored.value : null
}

export function deleteItem(key: string): boolean {
  const existed = serverStorage[key] !== undefined
  delete serverStorage[key]
  return existed
}

export function listItems(prefix: string = ''): string[] {
  return Object.keys(serverStorage).filter(key => key.startsWith(prefix))
}

// Tenant operations
export async function saveTenant(tenant: Tenant): Promise<void> {
  const key = `tenants/${tenant.tenant_id}`
  setItem(key, tenant)
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const key = `tenants/${tenantId}`
  return getItem(key)
}

// Emission run operations
export async function saveRun(run: EmissionRun): Promise<void> {
  const key = `runs/${run.tenant_id}/${run.period}`
  setItem(key, run)
}

export async function getRun(tenantId: string, period: string): Promise<EmissionRun | null> {
  const key = `runs/${tenantId}/${period}`
  return getItem(key)
}

export async function listRuns(tenantId: string): Promise<string[]> {
  const prefix = `runs/${tenantId}/`
  const keys = listItems(prefix)

  return keys
    .map(key => key.replace(prefix, ''))
    .sort()
    .reverse() // Most recent first
}

// Custom factors operations
export async function saveCustomFactors(tenantId: string, factors: Factors): Promise<void> {
  const key = `factors/${tenantId}`
  setItem(key, factors)
}

export async function getCustomFactors(tenantId: string): Promise<Factors | null> {
  const key = `factors/${tenantId}`
  return getItem(key)
}

export async function deleteRun(tenantId: string, period: string): Promise<void> {
  const key = `runs/${tenantId}/${period}`
  deleteItem(key)
}

// Debug functions
export function getStorageStats() {
  return {
    totalKeys: Object.keys(serverStorage).length,
    keys: Object.keys(serverStorage),
    storage: serverStorage
  }
}