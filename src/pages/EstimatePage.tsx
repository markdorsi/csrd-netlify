import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataEntryForm from '../components/DataEntryForm'
import ResultsDisplay from '../components/ResultsDisplay'
import { calculate } from '../lib/calculations'
import type { Inputs, Factors, CalculationResults, EmissionRun } from '../lib/types'

export default function EstimatePage() {
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [currentInputs, setCurrentInputs] = useState<Inputs | null>(null)
  const [currentFactors, setCurrentFactors] = useState<Factors | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const navigate = useNavigate()

  const handleCalculate = async (inputs: Inputs, factors: Factors) => {
    setLoading(true)
    try {
      // Calculate locally first
      const calculatedResults = calculate(inputs, factors)

      setResults(calculatedResults)
      setCurrentInputs(inputs)
      setCurrentFactors(factors)

      // Optionally call server-side calculation for auditability
      try {
        const response = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs, factors })
        })

        if (response.ok) {
          const serverResults = await response.json()
          setResults(serverResults.results)
        }
      } catch (error) {
        console.warn('Server-side calculation failed, using client-side results:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentInputs || !currentFactors || !results) return

    setSaveLoading(true)
    try {
      const run: EmissionRun = {
        tenant_id: currentInputs.tenant_id,
        period: currentInputs.period,
        inputs: currentInputs,
        factors: currentFactors,
        results,
        created_at: new Date().toISOString()
      }

      const response = await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(run)
      })

      if (response.ok) {
        alert('Run saved successfully!')
        navigate(`/report/${currentInputs.tenant_id}/${currentInputs.period}`)
      } else {
        throw new Error('Failed to save run')
      }
    } catch (error) {
      alert('Failed to save run: ' + (error as Error).message)
    } finally {
      setSaveLoading(false)
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
          <p>Calculate emissions from your Netlify usage</p>
        </div>
      </header>

      <div className="container">
        <DataEntryForm
          onSubmit={handleCalculate}
          loading={loading}
        />

        {results && currentInputs && currentFactors && (
          <>
            <ResultsDisplay
              results={results}
              inputs={currentInputs}
              factors={currentFactors}
            />

            <div className="card no-print">
              <h2>Save Results</h2>
              <p style={{ marginBottom: '16px' }}>
                Save this calculation run to Netlify Blobs for future reference and reporting.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : '💾 Save Run'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}