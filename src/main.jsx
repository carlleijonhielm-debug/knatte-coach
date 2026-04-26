import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Replace the artifact-only window.storage with localStorage
// so persistence works in any browser.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      try {
        const value = localStorage.getItem(key)
        return value !== null ? { key, value } : null
      } catch (e) { return null }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value)
        return { key, value }
      } catch (e) { return null }
    },
    async delete(key) {
      try {
        localStorage.removeItem(key)
        return { key, deleted: true }
      } catch (e) { return null }
    },
    async list(prefix = '') {
      try {
        const keys = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith(prefix)) keys.push(k)
        }
        return { keys }
      } catch (e) { return null }
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
