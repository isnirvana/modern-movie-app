import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// offlineFirst: still ask for data while offline, so the service worker can answer from its cache
// (the default pauses queries offline, leaving visited pages stuck loading)
const queryClient = new QueryClient({ defaultOptions: { queries: { networkMode: 'offlineFirst' } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Navigations as React transitions: the current page stays up while the next one's code loads,
          instead of flashing the loading placeholder */}
      <BrowserRouter future={{ v7_startTransition: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
