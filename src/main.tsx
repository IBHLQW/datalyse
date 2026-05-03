import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './style.css';

// Cache-busting deploy: 2026-04-28-07-30
console.log('Datalyse main.tsx loaded - Version 1.1.5');

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
