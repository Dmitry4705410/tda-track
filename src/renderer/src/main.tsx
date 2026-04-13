import { settings } from '@gravity-ui/date-utils'
import { configure, ThemeProvider, Toaster, ToasterComponent, ToasterProvider } from '@gravity-ui/uikit'
import ReactDOM from 'react-dom/client'
import React from 'react'
import App from './App'
import './index.css'

configure({ lang: 'ru' })

const toaster = new Toaster()

settings.loadLocale('ru').then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ToasterProvider toaster={toaster}>
        <ThemeProvider theme="dark" lang="ru">
          <App/>
          <ToasterComponent />
        </ThemeProvider>
      </ToasterProvider>
    </React.StrictMode>
  )
})
