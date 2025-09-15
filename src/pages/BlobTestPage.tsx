import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function BlobTestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testWrite = async () => {
    setLoading(true)
    setResult('')
    try {
      const testData = {
        message: 'Hello Blobs!',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      }

      const response = await fetch('/api/blob-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'write',
          data: testData
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Write successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Write failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Write error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testRead = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/api/blob-test?action=read', {
        method: 'GET'
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Read successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Read failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Read error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testList = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/api/blob-test?action=list', {
        method: 'GET'
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ List successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ List failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ List error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSimpleWrite = async () => {
    setLoading(true)
    setResult('')
    try {
      const testData = {
        message: 'Hello Simple Storage!',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      }

      const response = await fetch('/api/simple-storage-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'write',
          data: testData
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Simple write successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Simple write failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Simple write error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSimpleRead = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/api/simple-storage-test?action=read', {
        method: 'GET'
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Simple read successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Simple read failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Simple read error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSimpleList = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/api/simple-storage-test?action=list', {
        method: 'GET'
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Simple list successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Simple list failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Simple list error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testEnv = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/api/simple-storage-test?action=env', {
        method: 'GET'
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Environment check successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Environment check failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Environment check error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testPersistentWrite = async () => {
    setLoading(true)
    setResult('')
    try {
      const testData = {
        message: 'Hello Persistent Storage!',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7),
        type: 'emissions-test'
      }

      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'set',
          key: 'test/emissions-data',
          value: testData
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Persistent write successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Persistent write failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Persistent write error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testPersistentRead = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'get',
          key: 'test/emissions-data'
        })
      })

      const responseData = await response.json()

      if (response.ok || response.status === 404) {
        setResult(`✅ Persistent read successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Persistent read failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Persistent read error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const testPersistentList = async () => {
    setLoading(true)
    setResult('')
    try {
      const response = await fetch('/.netlify/functions/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'list',
          prefix: 'test/'
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        setResult(`✅ Persistent list successful: ${JSON.stringify(responseData, null, 2)}`)
      } else {
        setResult(`❌ Persistent list failed: ${JSON.stringify(responseData, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Persistent list error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
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
          <p>Blob Storage Test Page</p>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <h2>Netlify Blobs Test</h2>
          <p>
            This page tests the Netlify Blobs functionality to debug storage issues.
          </p>

          <h3>Netlify Blobs Test</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={testWrite}
              disabled={loading}
            >
              {loading ? 'Writing...' : '📝 Write to Blob'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={testRead}
              disabled={loading}
            >
              {loading ? 'Reading...' : '📖 Read from Blob'}
            </button>

            <button
              className="btn btn-outline"
              onClick={testList}
              disabled={loading}
            >
              {loading ? 'Listing...' : '📋 List Blobs'}
            </button>
          </div>

          <h3>Simple Storage Test (Fallback)</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={testSimpleWrite}
              disabled={loading}
            >
              {loading ? 'Writing...' : '💾 Simple Write'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={testSimpleRead}
              disabled={loading}
            >
              {loading ? 'Reading...' : '🔍 Simple Read'}
            </button>

            <button
              className="btn btn-outline"
              onClick={testSimpleList}
              disabled={loading}
            >
              {loading ? 'Listing...' : '📄 Simple List'}
            </button>

            <button
              className="btn btn-outline"
              onClick={testEnv}
              disabled={loading}
            >
              {loading ? 'Checking...' : '🔬 Check Environment'}
            </button>
          </div>

          <h3>Persistent Storage Test (Production Ready)</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={testPersistentWrite}
              disabled={loading}
            >
              {loading ? 'Writing...' : '🗄️ Persistent Write'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={testPersistentRead}
              disabled={loading}
            >
              {loading ? 'Reading...' : '📚 Persistent Read'}
            </button>

            <button
              className="btn btn-outline"
              onClick={testPersistentList}
              disabled={loading}
            >
              {loading ? 'Listing...' : '📦 Persistent List'}
            </button>
          </div>

          {result && (
            <div className="card" style={{ background: '#f9fafb', marginTop: '24px' }}>
              <h3>Test Result</h3>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {result}
              </pre>
            </div>
          )}

          <div style={{ marginTop: '32px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
            <h3>How to Test</h3>
            <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Click <strong>"Write to Blob"</strong> to store test data</li>
              <li>Click <strong>"Read from Blob"</strong> to retrieve the data</li>
              <li>Click <strong>"List Blobs"</strong> to see all stored blobs</li>
              <li>Check the console and function logs for detailed error information</li>
            </ol>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link to="/" className="btn btn-outline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}