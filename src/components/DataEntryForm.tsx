import React, { useState } from 'react'
import type { Inputs, Factors } from '../lib/types'
import { DEFAULT_FACTORS, validateFactors } from '../lib/factors'
import { validateInputs } from '../lib/calculations'

interface DataEntryFormProps {
  onSubmit: (inputs: Inputs, factors: Factors) => void
  initialInputs?: Partial<Inputs>
  initialFactors?: Partial<Factors>
  loading?: boolean
}

export default function DataEntryForm({
  onSubmit,
  initialInputs = {},
  initialFactors = {},
  loading = false
}: DataEntryFormProps) {
  const [inputs, setInputs] = useState<Partial<Inputs>>({
    tenant_id: '',
    period: new Date().toISOString().slice(0, 7), // YYYY-MM format
    bandwidth_gb: 0,
    storage_tb_months: 0,
    build_minutes: 0,
    functions_gb_seconds: 0,
    users_count: 1,
    systems_count: 1,
    ccft_scope12_market_kg: 0,
    ccft_scope12_location_kg: 0,
    notes: '',
    ...initialInputs
  })

  const [factors, setFactors] = useState<Partial<Factors>>({
    ...DEFAULT_FACTORS,
    ...initialFactors
  })

  const [showFactors, setShowFactors] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: keyof Inputs, value: string | number) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleFactorChange = (field: keyof Factors | string, value: number) => {
    if (field === 'networkWhPerGb.low' || field === 'networkWhPerGb.mid' || field === 'networkWhPerGb.high') {
      const [parent, child] = field.split('.')
      setFactors(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Factors] as any),
          [child]: value
        }
      }))
    } else {
      setFactors(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateInputs(inputs)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    const validatedInputs = inputs as Inputs
    const validatedFactors = validateFactors(factors)

    onSubmit(validatedInputs, validatedFactors)
  }

  const resetFactors = () => {
    setFactors({ ...DEFAULT_FACTORS })
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Usage Data Entry</h2>

      {errors.length > 0 && (
        <div className="alert alert-error">
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">Tenant ID *</label>
          <input
            type="text"
            className="form-input"
            value={inputs.tenant_id || ''}
            onChange={e => handleInputChange('tenant_id', e.target.value)}
            placeholder="e.g., anwb"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Period (YYYY-MM) *</label>
          <input
            type="month"
            className="form-input"
            value={inputs.period || ''}
            onChange={e => handleInputChange('period', e.target.value)}
            required
          />
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px 0' }}>Usage Metrics</h3>

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">Bandwidth (GB) *</label>
          <input
            type="number"
            className="form-input"
            value={inputs.bandwidth_gb || ''}
            onChange={e => handleInputChange('bandwidth_gb', parseFloat(e.target.value) || 0)}
            placeholder="125000"
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Storage (TB-months)</label>
          <input
            type="number"
            className="form-input"
            value={inputs.storage_tb_months || ''}
            onChange={e => handleInputChange('storage_tb_months', parseFloat(e.target.value) || 0)}
            placeholder="2.4"
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Build Minutes</label>
          <input
            type="number"
            className="form-input"
            value={inputs.build_minutes || ''}
            onChange={e => handleInputChange('build_minutes', parseFloat(e.target.value) || 0)}
            placeholder="1800"
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Functions (GB-seconds)</label>
          <input
            type="number"
            className="form-input"
            value={inputs.functions_gb_seconds || ''}
            onChange={e => handleInputChange('functions_gb_seconds', parseFloat(e.target.value) || 0)}
            placeholder="9500000"
            min="0"
          />
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px 0' }}>Normalization</h3>

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">Users Count</label>
          <input
            type="number"
            className="form-input"
            value={inputs.users_count || ''}
            onChange={e => handleInputChange('users_count', parseInt(e.target.value) || 1)}
            placeholder="1500"
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Systems Count</label>
          <input
            type="number"
            className="form-input"
            value={inputs.systems_count || ''}
            onChange={e => handleInputChange('systems_count', parseInt(e.target.value) || 1)}
            placeholder="12"
            min="1"
          />
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px 0' }}>CCFT Scope 1+2 (Optional)</h3>

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">Market-based (kg CO₂e)</label>
          <input
            type="number"
            className="form-input"
            value={inputs.ccft_scope12_market_kg || ''}
            onChange={e => handleInputChange('ccft_scope12_market_kg', parseFloat(e.target.value) || 0)}
            placeholder="1800"
            min="0"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location-based (kg CO₂e)</label>
          <input
            type="number"
            className="form-input"
            value={inputs.ccft_scope12_location_kg || ''}
            onChange={e => handleInputChange('ccft_scope12_location_kg', parseFloat(e.target.value) || 0)}
            placeholder="2600"
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-textarea"
          value={inputs.notes || ''}
          onChange={e => handleInputChange('notes', e.target.value)}
          placeholder="Baseline from July usage dashboard"
        />
      </div>

      <div className="collapsible">
        <div
          className="collapsible-header"
          onClick={() => setShowFactors(!showFactors)}
        >
          <span>Emission Factors (Advanced)</span>
          <span>{showFactors ? '▼' : '▶'}</span>
        </div>
        {showFactors && (
          <div className="collapsible-content">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Grid Intensity (kg CO₂e/kWh)</label>
                <input
                  type="number"
                  className="form-input"
                  value={factors.gridIntensityKgPerKWh || ''}
                  onChange={e => handleFactorChange('gridIntensityKgPerKWh', parseFloat(e.target.value) || 0)}
                  step="0.001"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">PUE (Power Usage Effectiveness)</label>
                <input
                  type="number"
                  className="form-input"
                  value={factors.pue || ''}
                  onChange={e => handleFactorChange('pue', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="1"
                />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 8px 0' }}>Network Intensity (Wh/GB)</h4>
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Low</label>
                <input
                  type="number"
                  className="form-input"
                  value={factors.networkWhPerGb?.low || ''}
                  onChange={e => handleFactorChange('networkWhPerGb.low', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mid</label>
                <input
                  type="number"
                  className="form-input"
                  value={factors.networkWhPerGb?.mid || ''}
                  onChange={e => handleFactorChange('networkWhPerGb.mid', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">High</label>
                <input
                  type="number"
                  className="form-input"
                  value={factors.networkWhPerGb?.high || ''}
                  onChange={e => handleFactorChange('networkWhPerGb.high', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={resetFactors}
              style={{ marginTop: '16px' }}
            >
              Reset to Defaults
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate Emissions'}
        </button>
      </div>
    </form>
  )
}