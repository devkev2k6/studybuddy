import React from 'react';
import ReactDOM from 'react-dom/client';
import { GuardianDashboard } from './components/dashboard/GuardianDashboard';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GuardianDashboard />
    </React.StrictMode>
  );
}
