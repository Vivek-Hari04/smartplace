import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const savedTheme = localStorage.getItem("smartplace.theme");

if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)