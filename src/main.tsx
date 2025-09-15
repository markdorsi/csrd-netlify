import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import EstimatePage from './pages/EstimatePage'
import ReportPage from './pages/ReportPage'
import BlobTestPage from './pages/BlobTestPage'
import './styles/globals.css'
import './styles/print.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/estimate" element={<EstimatePage />} />
        <Route path="/report/:tenantId/:period" element={<ReportPage />} />
        <Route path="/blobtest" element={<BlobTestPage />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)