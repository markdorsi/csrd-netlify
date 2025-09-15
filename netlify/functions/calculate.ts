import type { Handler } from '@netlify/functions'
import { calculate, validateInputs } from '../../src/lib/calculations'
import { validateFactors } from '../../src/lib/factors'
import type { Inputs, Factors } from '../../src/lib/types'

console.log('✅ Calculate function loaded successfully')

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { inputs, factors } = JSON.parse(event.body || '{}') as {
      inputs: Partial<Inputs>
      factors: Partial<Factors>
    }

    // Validate inputs
    const validationErrors = validateInputs(inputs)
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validationErrors
        })
      }
    }

    // Validate and normalize factors
    const validatedInputs = inputs as Inputs
    const validatedFactors = validateFactors(factors)

    // Calculate emissions
    const results = calculate(validatedInputs, validatedFactors)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        results,
        inputs: validatedInputs,
        factors: validatedFactors,
        calculated_at: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Calculation error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    }
  }
}