import React from 'react'
import { Link } from 'react-router-dom'
import type { CalculationResults, Inputs, Factors } from '../lib/types'

interface ResultsDisplayProps {
  results: CalculationResults
  inputs: Inputs
  factors: Factors
}

export default function ResultsDisplay({ results, inputs, factors }: ResultsDisplayProps) {
  const formatNumber = (num: number, decimals = 1) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const hasScope12Data = results.scope12.marketKg > 0 || results.scope12.locationKg > 0

  return (
    <div>
      {hasScope12Data && (
        <div className="card">
          <h2>Scope 1+2 Emissions (CCFT Data)</h2>
          <div className="metrics">
            <div className="metric-card">
              <div className="metric-value">{formatNumber(results.scope12.marketKg)}</div>
              <div className="metric-label">kg CO₂e (Market-based)</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatNumber(results.scope12.locationKg)}</div>
              <div className="metric-label">kg CO₂e (Location-based)</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatNumber(results.scope12.perUserMarketKg, 2)}</div>
              <div className="metric-label">kg CO₂e per user (Market)</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatNumber(results.scope12.perSystemMarketKg)}</div>
              <div className="metric-label">kg CO₂e per system (Market)</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Total Chain Emissions (Proxy)</h2>
        <p style={{ marginBottom: '24px', color: '#6b7280' }}>
          Estimated total emissions including network infrastructure (Scope 1+2+3 proxy)
        </p>

        <div className="grid grid-3">
          <div className="card" style={{ background: '#fef3c7', border: '2px solid #f59e0b' }}>
            <h3>Low Estimate</h3>
            <div className="metric-value" style={{ color: '#d97706' }}>
              {formatNumber(results.totalChain.low.kg)}
            </div>
            <div className="metric-label">kg CO₂e</div>
            <div style={{ marginTop: '16px' }}>
              <div>Per GB: {formatNumber(results.totalChain.low.perGbG, 2)}g CO₂e</div>
              <div>Per user: {formatNumber(results.totalChain.low.perUserKg, 2)}kg CO₂e</div>
              <div>Per system: {formatNumber(results.totalChain.low.perSystemKg, 2)}kg CO₂e</div>
            </div>
          </div>

          <div className="card" style={{ background: '#dbeafe', border: '2px solid #3b82f6' }}>
            <h3>Mid Estimate</h3>
            <div className="metric-value" style={{ color: '#1d4ed8' }}>
              {formatNumber(results.totalChain.mid.kg)}
            </div>
            <div className="metric-label">kg CO₂e</div>
            <div style={{ marginTop: '16px' }}>
              <div>Per GB: {formatNumber(results.totalChain.mid.perGbG, 2)}g CO₂e</div>
              <div>Per user: {formatNumber(results.totalChain.mid.perUserKg, 2)}kg CO₂e</div>
              <div>Per system: {formatNumber(results.totalChain.mid.perSystemKg, 2)}kg CO₂e</div>
            </div>
          </div>

          <div className="card" style={{ background: '#fee2e2', border: '2px solid #ef4444' }}>
            <h3>High Estimate</h3>
            <div className="metric-value" style={{ color: '#dc2626' }}>
              {formatNumber(results.totalChain.high.kg)}
            </div>
            <div className="metric-label">kg CO₂e</div>
            <div style={{ marginTop: '16px' }}>
              <div>Per GB: {formatNumber(results.totalChain.high.perGbG, 2)}g CO₂e</div>
              <div>Per user: {formatNumber(results.totalChain.high.perUserKg, 2)}kg CO₂e</div>
              <div>Per system: {formatNumber(results.totalChain.high.perSystemKg, 2)}kg CO₂e</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Calculation Assumptions</h2>
        <div className="grid grid-2">
          <div>
            <h3>Input Data</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Bandwidth</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{formatNumber(inputs.bandwidth_gb, 0)} GB</td>
                </tr>
                {inputs.storage_tb_months && (
                  <tr>
                    <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Storage</td>
                    <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{formatNumber(inputs.storage_tb_months)} TB-months</td>
                  </tr>
                )}
                {inputs.build_minutes && (
                  <tr>
                    <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Build minutes</td>
                    <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{formatNumber(inputs.build_minutes, 0)} minutes</td>
                  </tr>
                )}
                {inputs.functions_gb_seconds && (
                  <tr>
                    <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Functions</td>
                    <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{formatNumber(inputs.functions_gb_seconds, 0)} GB-seconds</td>
                  </tr>
                )}
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Users</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{inputs.users_count || 1}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Systems</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{inputs.systems_count || 1}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3>Emission Factors</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Grid intensity</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{factors.gridIntensityKgPerKWh} kg CO₂e/kWh</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>PUE</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{factors.pue}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Network (low)</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{factors.networkWhPerGb.low} Wh/GB</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Network (mid)</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{factors.networkWhPerGb.mid} Wh/GB</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Network (high)</td>
                  <td style={{ borderBottom: '1px solid #e5e7eb', padding: '8px' }}>{factors.networkWhPerGb.high} Wh/GB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <h4>Methodology Notes</h4>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Network emissions calculated as: (Bandwidth × Energy per GB × PUE × Grid intensity)</li>
            <li>Per-unit metrics allocated equally across users/systems</li>
            <li>Sensitivity bands reflect uncertainty in network infrastructure energy consumption</li>
            <li>Scope 1+2 data from customer-provided CCFT values when available</li>
          </ul>
        </div>
      </div>

      <div className="card no-print">
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            to={`/report/${inputs.tenant_id}/${inputs.period}`}
            className="btn btn-primary"
          >
            📋 View Printable Report
          </Link>
          <button
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            🖨️ Print / Save as PDF
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              const data = { inputs, factors, results }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `emissions-${inputs.tenant_id}-${inputs.period}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            💾 Download JSON
          </button>
        </div>
      </div>
    </div>
  )
}