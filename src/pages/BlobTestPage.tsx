import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface StoredData {
  key: string
  stored_at: string
  preview: string | string[]
  data?: any
}

export default function BlobTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [allData, setAllData] = useState<StoredData[]>([])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [detailData, setDetailData] = useState<any>(null)

  // Load all stored data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'list' })
      })

      const responseData = await response.json()
      if (response.ok) {
        setAllData(responseData.keys || [])
      }
    } catch (error) {
      console.error('Failed to load stored data:', error)
    }
  }

  const loadDetail = async (key: string) => {
    setSelectedKey(key)
    setDetailData(null)

    try {
      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'get', key })
      })

      const responseData = await response.json()
      if (response.ok && responseData.found) {
        setDetailData(responseData.value)
      }
    } catch (error) {
      console.error('Failed to load detail data:', error)
    }
  }

  const testStorageWrite = async () => {
    setLoading(true)
    setResult('')
    try {
      const testData = {
        message: 'Storage test data',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7),
        type: 'test-entry'
      }

      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'set',
          key: `test/data-${Date.now()}`,
          value: testData
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Write successful: ${JSON.stringify(responseData, null, 2)}`)
        loadAllData() // Refresh the list
      } else {
        setResult(`❌ Write failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Write error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testStorageList = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'list' })
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ List successful: ${JSON.stringify(responseData, null, 2)}`)
        loadAllData() // Refresh the list
      } else {
        setResult(`❌ List failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ List error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (key: string) => {
    if (!confirm(`Delete item "${key}"?`)) return

    try {
      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'delete', key })
      })

      if (response.ok) {
        loadAllData() // Refresh the list
        if (selectedKey === key) {
          setSelectedKey('')
          setDetailData(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const getDataTypeIcon = (key: string) => {
    if (key.startsWith('runs/')) return '📊'
    if (key.startsWith('tenants/')) return '👤'
    if (key.startsWith('factors/')) return '⚙️'
    if (key.startsWith('test/')) return '🧪'
    return '📄'
  }

  const formatDataType = (key: string) => {
    if (key.startsWith('runs/')) return 'Emissions Run'
    if (key.startsWith('tenants/')) return 'Tenant'
    if (key.startsWith('factors/')) return 'Custom Factors'
    if (key.startsWith('test/')) return 'Test Data'
    return 'Data'
  }

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Netlify Emissions Estimator
            </Link>
          </h1>
          <p>Storage & Data Viewer</p>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <h2>Storage Operations</h2>
          <p>Test the working storage system and manage stored data.</p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={testStorageWrite}
              disabled={loading}
            >
              {loading ? 'Writing...' : '✏️ Add Test Data'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={testStorageList}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh List'}
            </button>
          </div>

          {result && (
            <div className="card" style={{ background: '#f9fafb', marginBottom: '24px' }}>
              <h3>Operation Result</h3>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.5',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {result}
              </pre>
            </div>
          )}
        </div>

        <div className="grid grid-2">
          <div className="card">
            <h2>Stored Data ({allData.length} items)</h2>
            <div style={{ maxHeight: '500px', overflow: 'auto' }}>
              {allData.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No data stored yet. Create some emissions calculations or add test data.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {allData.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        padding: '12px',
                        border: selectedKey === item.key ? '2px solid #00ad9f' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedKey === item.key ? '#f0fdf4' : 'white'
                      }}
                      onClick={() => loadDetail(item.key)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>
                            {getDataTypeIcon(item.key)} {formatDataType(item.key)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {item.key}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            {new Date(item.stored_at).toLocaleString()}
                          </div>
                        </div>
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteItem(item.key)
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2>Data Details</h2>
            {selectedKey ? (
              <div>
                <div style={{ marginBottom: '16px', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                  <strong>Selected:</strong> {selectedKey}
                </div>
                {detailData ? (
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    maxHeight: '400px',
                    overflow: 'auto',
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {JSON.stringify(detailData, null, 2)}
                  </pre>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Loading details...</p>
                )}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                Click on an item from the list to view its details.
              </p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '32px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
          <h3>Storage Information</h3>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>📊 Emissions Runs:</strong> Stored calculations with results and methodology</li>
            <li><strong>👤 Tenants:</strong> Organization/customer information</li>
            <li><strong>⚙️ Custom Factors:</strong> Modified emission factors for specific tenants</li>
            <li><strong>🧪 Test Data:</strong> Development and testing entries</li>
          </ul>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
            All data is stored in Netlify Functions memory and persists across function invocations within the same container.
            Data may be reset during deployments or after extended periods of inactivity.
          </p>
        </div>

        <div style={{ marginTop: '24px' }}>
          <Link to="/" className="btn btn-outline">
            ← Back to Home
          </Link>
          <Link to="/estimate" className="btn btn-primary" style={{ marginLeft: '16px' }}>
            📊 Create Estimate
          </Link>
        </div>
      </div>
    </div>
  )
}