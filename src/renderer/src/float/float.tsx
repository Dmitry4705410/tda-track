import { settings } from '@gravity-ui/date-utils'
import { configure, ThemeProvider, Toaster, ToasterProvider } from '@gravity-ui/uikit'
import ReactDOM from 'react-dom/client'
import React from 'react'
import '../index.css'
import FloatApp from "@renderer/float/FloatApp";

configure({ lang: 'ru' })
const toaster = new Toaster()
settings.loadLocale('ru').then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ToasterProvider toaster={toaster}>
        <ThemeProvider theme="dark" lang="ru">
          <FloatApp/>
        </ThemeProvider>
      </ToasterProvider>
    </React.StrictMode>
  )
})
