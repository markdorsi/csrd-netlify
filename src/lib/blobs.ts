import { getStore, getDeployStore } from '@netlify/blobs';
import type { Tenant, EmissionRun, Factors } from './types';

const STORE_NAME = 'emissions-estimator';

function getBlobStore() {
  // Use global store for production, deploy store for other environments
  if (typeof window === 'undefined' && process.env.CONTEXT === 'production') {
    return getStore(STORE_NAME);
  }
  return getDeployStore(STORE_NAME);
}

export async function saveTenant(tenant: Tenant): Promise<void> {
  const store = getBlobStore();
  const key = `tenants/${tenant.tenant_id}.json`;
  await store.setJSON(key, tenant);
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const store = getBlobStore();
  const key = `tenants/${tenantId}.json`;
  return await store.get(key, { type: 'json' });
}

export async function saveRun(run: EmissionRun): Promise<void> {
  const store = getBlobStore();
  const key = `runs/${run.tenant_id}/${run.period}.json`;
  await store.setJSON(key, run);
}

export async function getRun(tenantId: string, period: string): Promise<EmissionRun | null> {
  const store = getBlobStore();
  const key = `runs/${tenantId}/${period}.json`;
  return await store.get(key, { type: 'json' });
}

export async function listRuns(tenantId: string): Promise<string[]> {
  const store = getBlobStore();
  const prefix = `runs/${tenantId}/`;
  const { blobs } = await store.list({ prefix });

  return blobs
    .map(blob => blob.key.replace(prefix, '').replace('.json', ''))
    .sort()
    .reverse(); // Most recent first
}

export async function saveCustomFactors(tenantId: string, factors: Factors): Promise<void> {
  const store = getBlobStore();
  const key = `factors/${tenantId}.json`;
  await store.setJSON(key, factors);
}

export async function getCustomFactors(tenantId: string): Promise<Factors | null> {
  const store = getBlobStore();
  const key = `factors/${tenantId}.json`;
  return await store.get(key, { type: 'json' });
}

export async function deleteRun(tenantId: string, period: string): Promise<void> {
  const store = getBlobStore();
  const key = `runs/${tenantId}/${period}.json`;
  await store.delete(key);
}