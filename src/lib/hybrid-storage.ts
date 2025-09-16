import { getStore, getDeployStore } from '@netlify/blobs'
import type { EmissionRun, Tenant, CustomFactors } from './types'

interface CacheEntry<T> {
  data: T
  timestamp: number
  version: number
}

interface HybridStorageOptions {
  cacheTimeout?: number // Cache timeout in milliseconds (default: 5 minutes)
  consistency?: 'strong' | 'eventual'
}

// Module-level cache that persists across function invocations within the same container
const globalMemoryCache = new Map<string, CacheEntry<any>>()
let globalVersion = 0

export class HybridStorage {
  private blobStore: any
  private cacheTimeout: number

  constructor(storeName: string, options: HybridStorageOptions = {}) {
    this.cacheTimeout = options.cacheTimeout || 300000 // 5 minutes default

    try {
      // Use environment-aware store selection
      if (process.env.CONTEXT === 'production') {
        this.blobStore = getStore(storeName, { consistency: options.consistency })
        console.log('🌐 Using global Netlify Blobs store for production')
      } else {
        // Try deploy store for non-production, fallback to global store
        try {
          this.blobStore = getDeployStore(storeName)
          console.log('🚀 Using deploy-scoped Netlify Blobs store for development')
        } catch (deployError) {
          console.log('⚠️ Deploy store failed, falling back to global store:', deployError.message)
          this.blobStore = getStore(storeName, { consistency: options.consistency })
          console.log('🌐 Using global Netlify Blobs store as fallback')
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize Netlify Blobs store:', error.message)
      // If blobs completely fail, we'll use memory-only mode
      this.blobStore = null
      console.log('💾 Running in memory-only mode (no persistence)')
    }
  }

  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < this.cacheTimeout
  }

  private setCacheEntry<T>(key: string, data: T): void {
    globalVersion++
    globalMemoryCache.set(key, {
      data,
      timestamp: Date.now(),
      version: globalVersion
    })
  }

  private getCacheEntry<T>(key: string): T | null {
    const entry = globalMemoryCache.get(key)
    if (!entry) return null

    if (!this.isCacheValid(entry)) {
      globalMemoryCache.delete(key)
      return null
    }

    return entry.data
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fast path)
    const cached = this.getCacheEntry<T>(key)
    if (cached !== null) {
      console.log(`📦 Cache hit for key: ${key}`)
      return cached
    }

    if (!this.blobStore) {
      console.log(`💾 Memory-only mode: key ${key} not found in cache`)
      return null
    }

    try {
      // Fallback to blob storage (persistent)
      console.log(`🔍 Cache miss, fetching from blobs: ${key}`)
      const data = await this.blobStore.get(key, { type: 'json' })

      if (data) {
        // Cache the result for future reads
        this.setCacheEntry(key, data)
        console.log(`💾 Cached blob data for key: ${key}`)
      }

      return data
    } catch (error) {
      console.error(`❌ Error fetching from blobs for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    // Always update memory cache first (fast response)
    this.setCacheEntry(key, value)
    console.log(`📦 Updated cache for key: ${key}`)

    if (this.blobStore) {
      try {
        // Write to persistent storage if available
        console.log(`💾 Writing to blobs: ${key}`)
        await this.blobStore.setJSON(key, value)
        console.log(`✅ Successfully wrote to blobs: ${key}`)
      } catch (error) {
        console.error(`❌ Error writing to blobs for key ${key}:`, error)
        console.log(`💾 Continuing in memory-only mode for key: ${key}`)
        // Don't throw error - we can still function with memory-only
      }
    } else {
      console.log(`💾 Memory-only mode: stored ${key} in cache only`)
    }

    // Invalidate related cache entries to maintain consistency
    this.invalidateRelatedEntries(key)
  }

  async delete(key: string): Promise<void> {
    // Remove from memory cache first
    globalMemoryCache.delete(key)
    console.log(`📦 Removed from cache: ${key}`)

    if (this.blobStore) {
      try {
        // Remove from persistent storage if available
        console.log(`🗑️ Deleting from blobs: ${key}`)
        await this.blobStore.delete(key)
        console.log(`✅ Successfully deleted from blobs: ${key}`)
      } catch (error) {
        console.error(`❌ Error deleting from blobs for key ${key}:`, error)
        console.log(`💾 Continuing - deleted from memory cache only`)
        // Don't throw error - memory deletion still succeeded
      }
    } else {
      console.log(`💾 Memory-only mode: deleted ${key} from cache only`)
    }

    // Invalidate related cache entries
    this.invalidateRelatedEntries(key)
  }

  async list(prefix?: string): Promise<Array<{ key: string; stored_at: string; preview: string | string[] }>> {
    const items: Array<{ key: string; stored_at: string; preview: string | string[] }> = []

    if (this.blobStore) {
      try {
        console.log(`📋 Listing blobs with prefix: ${prefix || 'all'}`)
        const result = await this.blobStore.list(prefix ? { prefix } : {})

        for (const blob of result.blobs) {
          try {
            // Get metadata for timestamp if available
            const metadata = await this.blobStore.getMetadata(blob.key)
            const stored_at = metadata?.metadata?.created_at || new Date().toISOString()

            // Get a preview of the data
            const data = await this.get(blob.key)
            let preview: string | string[]

            if (data) {
              if (typeof data === 'object') {
                // Create a preview from object keys/properties
                const keys = Object.keys(data).slice(0, 3)
                preview = keys.length > 0 ? keys : ['object']
              } else {
                preview = String(data).substring(0, 50)
              }
            } else {
              preview = 'no data'
            }

            items.push({
              key: blob.key,
              stored_at,
              preview
            })
          } catch (error) {
            console.warn(`⚠️ Could not get metadata for ${blob.key}:`, error)
            items.push({
              key: blob.key,
              stored_at: new Date().toISOString(),
              preview: 'metadata unavailable'
            })
          }
        }
      } catch (error) {
        console.error('❌ Error listing blobs:', error)
      }
    }

    // Also include items from memory cache
    for (const [key, entry] of globalMemoryCache) {
      if (!prefix || key.startsWith(prefix)) {
        // Check if this key is already in the items from blobs
        if (!items.find(item => item.key === key)) {
          let preview: string | string[]
          if (typeof entry.data === 'object') {
            const keys = Object.keys(entry.data).slice(0, 3)
            preview = keys.length > 0 ? keys : ['object']
          } else {
            preview = String(entry.data).substring(0, 50)
          }

          items.push({
            key,
            stored_at: new Date(entry.timestamp).toISOString(),
            preview
          })
        }
      }
    }

    console.log(`📋 Found ${items.length} items (blobs + cache) with prefix: ${prefix || 'all'}`)
    return items.sort((a, b) => new Date(b.stored_at).getTime() - new Date(a.stored_at).getTime())
  }

  private invalidateRelatedEntries(key: string): void {
    // Invalidate cache entries that might be affected by this change
    if (key.startsWith('runs/')) {
      // If a run is updated, invalidate tenant-related caches
      const parts = key.split('/')
      if (parts.length >= 2) {
        const tenantPrefix = `tenants/${parts[1]}`
        for (const [cacheKey] of globalMemoryCache) {
          if (cacheKey.startsWith(tenantPrefix)) {
            globalMemoryCache.delete(cacheKey)
            console.log(`🔄 Invalidated related cache: ${cacheKey}`)
          }
        }
      }
    }
  }

  // Utility methods for cache management
  clearCache(): void {
    globalMemoryCache.clear()
    console.log('🧹 Cleared all cache entries')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: globalMemoryCache.size,
      keys: Array.from(globalMemoryCache.keys())
    }
  }

  // Force cache refresh for a key
  async refresh(key: string): Promise<any> {
    globalMemoryCache.delete(key)
    return await this.get(key)
  }
}

// Singleton instance for the main emissions data store
let emissionsStore: HybridStorage | null = null

export function getEmissionsStore(): HybridStorage {
  if (!emissionsStore) {
    emissionsStore = new HybridStorage('emissions-data', {
      consistency: 'eventual', // Fast reads for better UX
      cacheTimeout: 300000 // 5 minutes
    })
  }
  return emissionsStore
}

// Specialized functions for the emissions estimator
export async function saveRun(run: EmissionRun): Promise<void> {
  const store = getEmissionsStore()
  const key = `runs/${run.tenant_id}/${run.period}`

  // Add metadata
  const runWithMetadata = {
    ...run,
    saved_at: new Date().toISOString(),
    version: 1
  }

  await store.set(key, runWithMetadata)
}

export async function getRun(tenantId: string, period: string): Promise<EmissionRun | null> {
  const store = getEmissionsStore()
  const key = `runs/${tenantId}/${period}`
  return await store.get<EmissionRun>(key)
}

export async function listRuns(tenantId: string): Promise<string[]> {
  const store = getEmissionsStore()
  const prefix = `runs/${tenantId}/`
  const items = await store.list(prefix)

  return items
    .filter(item => item.key.startsWith(prefix))
    .map(item => item.key.replace(prefix, ''))
    .sort()
}

export async function saveTenant(tenant: Tenant): Promise<void> {
  const store = getEmissionsStore()
  const key = `tenants/${tenant.tenant_id}`

  const tenantWithMetadata = {
    ...tenant,
    updated_at: new Date().toISOString()
  }

  await store.set(key, tenantWithMetadata)
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const store = getEmissionsStore()
  const key = `tenants/${tenantId}`
  return await store.get<Tenant>(key)
}

export async function saveCustomFactors(tenantId: string, factors: CustomFactors): Promise<void> {
  const store = getEmissionsStore()
  const key = `factors/${tenantId}`

  const factorsWithMetadata = {
    ...factors,
    updated_at: new Date().toISOString()
  }

  await store.set(key, factorsWithMetadata)
}

export async function getCustomFactors(tenantId: string): Promise<CustomFactors | null> {
  const store = getEmissionsStore()
  const key = `factors/${tenantId}`
  return await store.get<CustomFactors>(key)
}