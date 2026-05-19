import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { I18nProvider } from './hooks/useI18n.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

import { BrowserRouter } from 'react-router-dom'
import { Buffer } from 'buffer'

// Manual polyfill as fail-safe for Vite
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
