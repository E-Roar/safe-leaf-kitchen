import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { I18nProvider } from './hooks/useI18n'

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
