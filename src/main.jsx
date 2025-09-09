import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ActivityProvider } from './discord/ActivityProvider'
import { ActivityProvider as MockActivityProvider } from './discord/MockActivityProvider'
import { ErrorBoundary } from './components/ErrorBoundary'

// Use real provider now that backend is tunneled
const Provider = ActivityProvider; // Backend is now accessible via tunnel

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider>
      <App />
    </Provider>
  </ErrorBoundary>
)
