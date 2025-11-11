import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { InputProvider } from './context/InputContext.jsx'
import { MultiplayerProvider } from './context/MultiplayerContext.jsx'

createRoot(document.getElementById('root')).render(
  <MultiplayerProvider>
    <InputProvider>
      <App />
    </InputProvider>
  </MultiplayerProvider>,
)
