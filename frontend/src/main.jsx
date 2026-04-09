import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// src/main.jsx
import './assets/styles/variables.css'
import './assets/styles/global.css'
import './assets/styles/components.css'
import './assets/styles/table.css'
import './assets/styles/views.css'
import './assets/styles/header.css'
import './assets/styles/admin.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)