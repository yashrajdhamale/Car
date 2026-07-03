// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router';
import { UserProvider } from './context/UserContext';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

// Platform initializer (adds .app-mode or .web-mode and lazy-loads app CSS)
import { initializePlatformStyles } from './utils/platform.ts';

// Call this synchronously before React mounts so body class exists early
initializePlatformStyles();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootEl);
root.render(
    <UserProvider>
      <AppRouter />
    </UserProvider>
);
