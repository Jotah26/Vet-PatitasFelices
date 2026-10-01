import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { config } from '@fortawesome/fontawesome-svg-core'
import { DataProvider } from './data/store'
import { ToastProvider } from './components/Toast'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
import './styles/index.css'

config.autoAddCss = false

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
