import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FrontendConfigProvider } from './frontendConfig.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FrontendConfigProvider>
      <App />
    </FrontendConfigProvider>
  </StrictMode>,
)
