import { calculate, validateInputs } from './calculations'
import { DEFAULT_FACTORS } from './factors'
import type { Inputs, Factors } from './types'

// Test calculation with sample data from the spec
export function testCalculations() {
  const sampleInputs: Inputs = {
    tenant_id: 'anwb',
    period: '2025-07',
    bandwidth_gb: 100000,
    storage_tb_months: 1.2,
    build_minutes: 1200,
    functions_gb_seconds: 5_000_000,
    users_count: 1500,
    systems_count: 12,
    ccft_scope12_market_kg: 1800,
    ccft_scope12_location_kg: 2600
  }

  const factors: Factors = DEFAULT_FACTORS

  console.log('Testing emissions calculations...')
  console.log('Sample inputs:', sampleInputs)
  console.log('Factors:', factors)

  // Validate inputs
  const errors = validateInputs(sampleInputs)
  if (errors.length > 0) {
    console.error('Validation errors:', errors)
    return false
  }

  // Calculate results
  const results = calculate(sampleInputs, factors)
  console.log('Calculation results:', results)

  // Basic sanity checks
  const tests = [
    {
      name: 'Scope 1+2 market emissions should match input',
      test: results.scope12.marketKg === 1800
    },
    {
      name: 'Scope 1+2 location emissions should match input',
      test: results.scope12.locationKg === 2600
    },
    {
      name: 'Per-user market emissions should be calculated',
      test: results.scope12.perUserMarketKg === 1800 / 1500
    },
    {
      name: 'Total chain mid estimate should be positive',
      test: results.totalChain.mid.kg > 0
    },
    {
      name: 'Low estimate should be less than high estimate',
      test: results.totalChain.low.kg < results.totalChain.high.kg
    },
    {
      name: 'Per-GB emissions should be calculated',
      test: results.totalChain.mid.perGbG > 0
    }
  ]

  let passed = 0
  let failed = 0

  tests.forEach(test => {
    if (test.test) {
      console.log(`✓ ${test.name}`)
      passed++
    } else {
      console.log(`✗ ${test.name}`)
      failed++
    }
  })

  console.log(`\nTest summary: ${passed} passed, ${failed} failed`)
  return failed === 0
}

// Run test if called directly
if (typeof window === 'undefined') {
  testCalculations()
}