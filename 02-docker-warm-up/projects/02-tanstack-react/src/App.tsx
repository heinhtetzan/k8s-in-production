import React, { useState } from 'react'

type Page = 'home' | 'features' | 'solutions' | 'pricing' | 'contact'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="card">
            <span className="page-indicator">Page 1 of 5: Home</span>
            <h1>Modern Cloud Stack</h1>
            <p>Welcome to our TanStack React containerized Single Page Application.</p>
            <div className="grid">
              <div className="grid-card">
                <h3>⚡ Vite Fast Build</h3>
                <p>Lightning-fast Hot Module Replacement and production bundling.</p>
              </div>
              <div className="grid-card">
                <h3>🐳 Multi-Stage Docker</h3>
                <p>Builds with Node.js and serves via ultra-lean NGINX Alpine.</p>
              </div>
              <div className="grid-card">
                <h3>☸️ K8s Ready</h3>
                <p>Ready to deploy as a Kubernetes Deployment and Service.</p>
              </div>
            </div>
          </div>
        )
      case 'features':
        return (
          <div className="card">
            <span className="page-indicator">Page 2 of 5: Features</span>
            <h1>Framework Features</h1>
            <p>Built with TypeScript, React 18, and modern cloud deployment standards.</p>
            <div className="grid">
              <div className="grid-card">
                <h3>Type-Safe State</h3>
                <p>Predictable UI state across all application routes.</p>
              </div>
              <div className="grid-card">
                <h3>Layer Caching</h3>
                <p>Docker build cache optimizes package installations.</p>
              </div>
            </div>
          </div>
        )
      case 'solutions':
        return (
          <div className="card">
            <span className="page-indicator">Page 3 of 5: Solutions</span>
            <h1>Enterprise Architecture</h1>
            <p>Scalable cloud infrastructure patterns designed for high concurrency.</p>
            <div className="grid">
              <div className="grid-card">
                <h3>Microservices</h3>
                <p>Decoupled frontend communicating with Go, Elysia, or Python APIs.</p>
              </div>
              <div className="grid-card">
                <h3>Auto-Scaling</h3>
                <p>Horizontal Pod Autoscaling based on real-time traffic spikes.</p>
              </div>
            </div>
          </div>
        )
      case 'pricing':
        return (
          <div className="card">
            <span className="page-indicator">Page 4 of 5: Pricing</span>
            <h1>Subscription Tiers</h1>
            <p>Choose the tier that fits your engineering team size.</p>
            <div className="grid">
              <div className="grid-card">
                <h3>Developer</h3>
                <p><strong>$0/mo</strong> - Local Docker & MiniKube cluster.</p>
              </div>
              <div className="grid-card">
                <h3>Team</h3>
                <p><strong>$49/mo</strong> - Automated staging and container registry.</p>
              </div>
              <div className="grid-card">
                <h3>Enterprise</h3>
                <p><strong>Custom</strong> - Dedicated multi-cloud clusters.</p>
              </div>
            </div>
          </div>
        )
      case 'contact':
        return (
          <div className="card">
            <span className="page-indicator">Page 5 of 5: Contact</span>
            <h1>Connect with Us</h1>
            <p>Reach out to our cloud infrastructure and containerization team.</p>
            <div className="grid">
              <div className="grid-card">
                <h3>Email</h3>
                <p>devops@tanstack-app.local</p>
              </div>
              <div className="grid-card">
                <h3>Repository</h3>
                <p>github.com/learn/k8s-in-production</p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand">⚛️ TanStack React SPA</div>
        <nav className="nav-links">
          <button
            className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            Home
          </button>
          <button
            className={`nav-button ${currentPage === 'features' ? 'active' : ''}`}
            onClick={() => setCurrentPage('features')}
          >
            Features
          </button>
          <button
            className={`nav-button ${currentPage === 'solutions' ? 'active' : ''}`}
            onClick={() => setCurrentPage('solutions')}
          >
            Solutions
          </button>
          <button
            className={`nav-button ${currentPage === 'pricing' ? 'active' : ''}`}
            onClick={() => setCurrentPage('pricing')}
          >
            Pricing
          </button>
          <button
            className={`nav-button ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={() => setCurrentPage('contact')}
          >
            Contact
          </button>
        </nav>
      </header>

      <main className="content">{renderContent()}</main>

      <footer className="footer">
        &copy; 2026 TanStack React Containerized SPA. 5-Page Frontend Demo.
      </footer>
    </div>
  )
}
