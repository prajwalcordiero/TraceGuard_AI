import React from "react";
import "./DocumentationPage.css";

export default function DocumentationPage({ onBack }) {
  return (
    <main className="docs-page">
      <div className="docs-container">


        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>

        <h1>TraceGuard AI</h1>

        

        {/* <section className="doc-card">
          <h2>Overview</h2>
          <p>
            TraceGuard AI monitors user activity in real time and flags
            suspicious behaviour using AI, while keeping false positives low.
          </p>
        </section> */}

        <section className="doc-card">
          <h2>Core Features</h2>
          <ul className="doc-list">
            <li>Threat detection using AI algorithms</li>
            <li>Real-time monitoring of traffic and behaviour</li>
            <li>Instant alerts the moment a threat is found</li>
            <li>Multi-level secure authentication</li>
            <li>AI-based attack prediction</li>
            <li>Interactive analytics dashboard</li>
          </ul>
        </section>

        {/* <section className="doc-card">
          <h2>System Architecture</h2>
          <p>User → TraceGuard Server → AI Detection Engine → Threat Database → Admin Dashboard</p>
        </section> */}

        <section className="doc-card">
          <h2>Technologies Used</h2>
          <div className="tech-tags">
            <span>React.js</span>
            <span>Node.js</span>
            <span>Express</span>
            <span>Python</span>
            <span>TensorFlow</span>
          </div>
        </section>

        <section className="doc-card">
          <h2>Security Modules</h2>
          <ul className="doc-list">
            <li>Multi-factor authentication</li>
            <li>Role-based access control</li>
            <li>Encrypted password storage</li>
            <li>Behaviour monitoring</li>
          </ul>
        </section>

        <footer className="docs-footer">
          <h3>TraceGuard AI</h3>
        </footer>

      </div>
    </main>
  );
}