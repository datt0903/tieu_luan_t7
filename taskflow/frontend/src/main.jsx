import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // <--- ĐỂ Ý DÒNG NÀY: Phải là ./App.jsx (có chấm xẹt)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)