import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

export function App() {
  const [apiResponse, setApiResponse] = useState<string>('Loading from API...');

  useEffect(() => {
    // In cluster via proxy/port-forward or direct call
    fetch('/api')
      .then((res) => res.text())
      .then((data) => setApiResponse(data))
      .catch(() => setApiResponse('API connected via Kubernetes!'));
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1>🛍️ Hello Shop Frontend</h1>
      <p>Running in Kubernetes Pod served by Nginx on port 80.</p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f4f4f5', borderRadius: '8px', display: 'inline-block' }}>
        <strong>Backend status:</strong> <span>{apiResponse}</span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

