import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { initUpdateChecks, notifyWaiting } from './swUpdate';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

try {
  serviceWorkerRegistration.register({ onUpdate: notifyWaiting });
  if (process.env.NODE_ENV === 'production') initUpdateChecks();
} catch (err) {
  console.error('Service worker registration failed', err);
}
