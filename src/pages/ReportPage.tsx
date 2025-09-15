import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { EmissionRun } from '../lib/types'

export default function ReportPage() {
  const { tenantId, period } = useParams<{ tenantId: string; period: string }>()
  const [run, setRun] = useState<EmissionRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !period) return

    const fetchRun = async () => {
      try {
        const response = await fetch(`/api/get-run?tenant_id=${tenantId}&period=${period}`)
        if (!response.ok) {
          throw new Error('Run not found')
        }
        const data = await response.json()
        setRun(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchRun()
  }, [tenantId, period])

  const formatNumber = (num: number, decimals = 1) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p>Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <p>Error: {error || 'Report not found'}</p>
          <Link to="/estimate" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Create New Estimate
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print">
        <header className="header">
          <div className="container">
            <h1>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                Netlify Emissions Estimator
              </Link>
            </h1>
            <p>Emissions Report</p>
          </div>
        </header>
      </div>

      <div className="container">
        <div className="report-header">
          <h1 className="report-title">Carbon Emissions Report</h1>
          <div className="report-subtitle">
            {run.inputs.tenant_id.toUpperCase()} • Period: {run.inputs.period}
          </div>
          <div className="report-meta">
            Generated on {formatDate(run.created_at)} • Prepared by Netlify Emissions Estimator
          </div>
        </div>

        <div className="card page-break-inside">
          <h2>Executive Summary</h2>
          <ul>
            <li>
              <strong>Total network emissions (mid-range estimate):</strong> {formatNumber(run.results.totalChain.mid.kg)} kg CO₂e
            </li>
            <li>
              <strong>Per GB transferred:</strong> {formatNumber(run.results.totalChain.mid.perGbG, 2)} g CO₂e
            </li>
            <li>
              <strong>Per user:</strong> {formatNumber(run.results.totalChain.mid.perUserKg, 2)} kg CO₂e
            </li>
            <li>
              <strong>Per system:</strong> {formatNumber(run.results.totalChain.mid.perSystemKg, 2)} kg CO₂e
            </li>
            {(run.results.scope12.marketKg > 0 || run.results.scope12.locationKg > 0) && (
              <li>
                <strong>Scope 1+2 (CCFT):</strong> {formatNumber(run.results.scope12.marketKg)} kg CO₂e (market-based)
              </li>
            )}
          </ul>
        </div>

        {(run.results.scope12.marketKg > 0 || run.results.scope12.locationKg > 0) && (
          <div className="card page-break-inside">
            <h2>Scope 1+2 Emissions</h2>
            <p>Based on AWS Climate Change Foot Tool (CCFT) data provided by customer.</p>

            <table style={{ width: '100%', marginTop: '16px' }}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Market-based</th>
                  <th>Location-based</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total emissions</td>
                  <td>{formatNumber(run.results.scope12.marketKg)} kg CO₂e</td>
                  <td>{formatNumber(run.results.scope12.locationKg)} kg CO₂e</td>
                </tr>
                <tr>
                  <td>Per user</td>
                  <td>{formatNumber(run.results.scope12.perUserMarketKg, 2)} kg CO₂e</td>
                  <td>{formatNumber(run.results.scope12.perUserLocationKg, 2)} kg CO₂e</td>
                </tr>
                <tr>
                  <td>Per system</td>
                  <td>{formatNumber(run.results.scope12.perSystemMarketKg)} kg CO₂e</td>
                  <td>{formatNumber(run.results.scope12.perSystemLocationKg)} kg CO₂e</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="card page-break-inside">
          <h2>Total Chain Emissions (Proxy)</h2>
          <p>Estimated emissions including network infrastructure, representing a proxy for Scope 1+2+3 emissions.</p>

          <table style={{ width: '100%', marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Total (kg CO₂e)</th>
                <th>Per GB (g CO₂e)</th>
                <th>Per User (kg CO₂e)</th>
                <th>Per System (kg CO₂e)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Low estimate</strong></td>
                <td>{formatNumber(run.results.totalChain.low.kg)}</td>
                <td>{formatNumber(run.results.totalChain.low.perGbG, 2)}</td>
                <td>{formatNumber(run.results.totalChain.low.perUserKg, 2)}</td>
                <td>{formatNumber(run.results.totalChain.low.perSystemKg, 2)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f0f9ff' }}>
                <td><strong>Mid estimate</strong></td>
                <td>{formatNumber(run.results.totalChain.mid.kg)}</td>
                <td>{formatNumber(run.results.totalChain.mid.perGbG, 2)}</td>
                <td>{formatNumber(run.results.totalChain.mid.perUserKg, 2)}</td>
                <td>{formatNumber(run.results.totalChain.mid.perSystemKg, 2)}</td>
              </tr>
              <tr>
                <td><strong>High estimate</strong></td>
                <td>{formatNumber(run.results.totalChain.high.kg)}</td>
                <td>{formatNumber(run.results.totalChain.high.perGbG, 2)}</td>
                <td>{formatNumber(run.results.totalChain.high.perUserKg, 2)}</td>
                <td>{formatNumber(run.results.totalChain.high.perSystemKg, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card page-break-inside">
          <h2>Input Data</h2>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Period</td>
                <td>{run.inputs.period}</td>
                <td>YYYY-MM</td>
              </tr>
              <tr>
                <td>Bandwidth</td>
                <td>{formatNumber(run.inputs.bandwidth_gb, 0)}</td>
                <td>GB</td>
              </tr>
              {run.inputs.storage_tb_months && (
                <tr>
                  <td>Storage</td>
                  <td>{formatNumber(run.inputs.storage_tb_months)}</td>
                  <td>TB-months</td>
                </tr>
              )}
              {run.inputs.build_minutes && (
                <tr>
                  <td>Build minutes</td>
                  <td>{formatNumber(run.inputs.build_minutes, 0)}</td>
                  <td>minutes</td>
                </tr>
              )}
              {run.inputs.functions_gb_seconds && (
                <tr>
                  <td>Functions</td>
                  <td>{formatNumber(run.inputs.functions_gb_seconds, 0)}</td>
                  <td>GB-seconds</td>
                </tr>
              )}
              <tr>
                <td>Users</td>
                <td>{run.inputs.users_count || 1}</td>
                <td>count</td>
              </tr>
              <tr>
                <td>Systems</td>
                <td>{run.inputs.systems_count || 1}</td>
                <td>count</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card page-break-inside">
          <h2>Emission Factors</h2>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Factor</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Grid carbon intensity</td>
                <td>{run.factors.gridIntensityKgPerKWh}</td>
                <td>kg CO₂e/kWh</td>
                <td>Global average</td>
              </tr>
              <tr>
                <td>Power Usage Effectiveness (PUE)</td>
                <td>{run.factors.pue}</td>
                <td>ratio</td>
                <td>Modern data center average</td>
              </tr>
              <tr>
                <td>Network energy (low)</td>
                <td>{run.factors.networkWhPerGb.low}</td>
                <td>Wh/GB</td>
                <td>Conservative estimate</td>
              </tr>
              <tr>
                <td>Network energy (mid)</td>
                <td>{run.factors.networkWhPerGb.mid}</td>
                <td>Wh/GB</td>
                <td>Mid-range estimate</td>
              </tr>
              <tr>
                <td>Network energy (high)</td>
                <td>{run.factors.networkWhPerGb.high}</td>
                <td>Wh/GB</td>
                <td>High-end estimate</td>
              </tr>
            </tbody>
          </table>
        </div>

        {run.inputs.notes && (
          <div className="card page-break-inside">
            <h2>Notes</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{run.inputs.notes}</p>
          </div>
        )}

        <div className="methodology">
          <h2>Methodology</h2>
          <p>
            This report calculates carbon emissions from Netlify infrastructure usage using industry-standard
            methodologies and transparent emission factors. The calculations include:
          </p>

          <h3>Network Emissions</h3>
          <p>
            Network emissions are calculated using the formula: <br/>
            <strong>Emissions = Bandwidth × Network Energy Intensity × PUE × Grid Carbon Intensity</strong>
          </p>

          <h3>Sensitivity Analysis</h3>
          <p>
            Three scenarios (low, mid, high) reflect uncertainty in network infrastructure energy consumption,
            based on different estimates of energy required per GB of data transferred.
          </p>

          <h3>Scope 1+2 vs Total Chain</h3>
          <ul>
            <li><strong>Scope 1+2:</strong> Direct emissions from energy consumption, based on customer-provided CCFT data</li>
            <li><strong>Total Chain (proxy):</strong> Includes network infrastructure emissions as a proxy for full value chain (Scope 1+2+3)</li>
          </ul>
        </div>

        <div className="footnotes">
          <p>
            <strong>Disclaimer:</strong> This report provides estimates based on available data and industry-standard
            methodologies. Actual emissions may vary. For regulatory reporting, please consult with qualified
            carbon accounting professionals.
          </p>
          <p>
            Generated by Netlify Emissions Estimator v1.0.0 on {formatDate(run.created_at)}
          </p>
        </div>

        <div className="no-print card">
          <h2>Actions</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              🖨️ Print / Save as PDF
            </button>
            <Link to="/estimate" className="btn btn-outline">
              📊 New Estimate
            </Link>
            <button
              className="btn btn-outline"
              onClick={() => {
                const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `emissions-report-${run.tenant_id}-${run.period}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              💾 Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}