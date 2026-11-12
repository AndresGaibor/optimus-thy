import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TituloPagina } from './components/TituloPagina';
import { SessionProvider } from './session/SessionContext';
import './styles/tokens.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se encontró el contenedor raíz');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <TituloPagina />
        <SessionProvider>
          <AppRoutes />
        </SessionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
