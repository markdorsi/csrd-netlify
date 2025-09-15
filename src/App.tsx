import React from 'react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>Netlify Emissions Estimator</h1>
          <p>Calculate and report carbon emissions from your Netlify usage</p>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <h2>Welcome to Netlify Emissions Estimator</h2>
          <p>
            This tool helps you calculate carbon emissions from your Netlify infrastructure usage.
            It provides both Scope 1+2 (via AWS CCFT inputs) and total-chain proxy estimates using
            transparent, adjustable factors.
          </p>

          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/estimate" className="btn btn-primary">
              Start New Estimate
            </Link>
            <Link to="/blobtest" className="btn btn-outline">
              🗄️ View Stored Data
            </Link>
          </div>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <h3>📊 Comprehensive Analysis</h3>
            <p>
              Calculate emissions from bandwidth, storage, build processes, and serverless functions
              with sensitivity analysis (low/mid/high estimates).
            </p>
          </div>

          <div className="card">
            <h3>📋 Printable Reports</h3>
            <p>
              Generate professional, branded reports with customer logos and detailed methodology
              that can be printed or saved as PDF.
            </p>
          </div>

          <div className="card">
            <h3>💾 Data Storage</h3>
            <p>
              Save and retrieve estimates per tenant using Netlify Blobs, with support for
              multi-tenant usage and historical tracking.
            </p>
          </div>
        </div>

        <div className="card">
          <h3>Methodology</h3>
          <p>
            Our calculations use industry-standard carbon intensity factors and Power Usage
            Effectiveness (PUE) values. You can view and adjust all factors used in the
            calculations for full transparency.
          </p>
          <ul style={{ marginTop: '16px', paddingLeft: '24px' }}>
            <li>Network emissions: 10-72 Wh per GB transferred (configurable)</li>
            <li>Grid intensity: 0.494 kg CO₂e per kWh (global average, adjustable)</li>
            <li>PUE: 1.135 (modern data center average, adjustable)</li>
            <li>Scope 1+2: Based on your AWS CCFT data inputs</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App