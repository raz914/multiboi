import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { InputProvider } from './context/InputContext.jsx'
// import { MultiplayerProvider } from './context/MultiplayerContext.jsx' // DISABLED FOR SINGLE-PLAYER

createRoot(document.getElementById('root')).render(
  // <MultiplayerProvider> // DISABLED FOR SINGLE-PLAYER
    <InputProvider>
      <App />
    </InputProvider>
  // </MultiplayerProvider>, // DISABLED FOR SINGLE-PLAYER
  ,
)
