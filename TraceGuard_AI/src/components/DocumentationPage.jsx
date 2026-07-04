import React from "react";
import "./DocumentationPage.css";

export default function DocumentationPage({ onBack }) {
  return (
    <main className="docs-page">

      <div className="docs-container">

        <div className="docs-header">

          <div className="security-tag">
            // TRACEGUARD AI DOCUMENTATION //
          </div>

          <h1>TraceGuard AI</h1>

          <p>
            AI-powered Cybersecurity Monitoring and Intelligent Threat Detection
            Platform designed to monitor activities, detect anomalies and secure
            digital infrastructure using Machine Learning.
          </p>

          <button className="btn-primary" onClick={onBack}>
            ← Back to Home
          </button>

        </div>

        {/* ================= OVERVIEW ================= */}

        <section className="doc-card">

          <div className="card-title">
            📘 Project Overview
          </div>

          <p>
            TraceGuard AI is an intelligent cybersecurity platform capable of
            continuously monitoring user activities and system events to detect
            suspicious behaviour using Artificial Intelligence. The system
            provides administrators with real-time threat alerts while reducing
            false positives through intelligent behavioural analysis.
          </p>

        </section>

        {/* ================= FEATURES ================= */}

        <section className="doc-card">

          <div className="card-title">
            🚀 Core Features
          </div>

          <div className="feature-grid">

            <div className="feature-box">
              <h3>🛡 Threat Detection</h3>
              <p>
                Detect malicious activities using intelligent AI algorithms.
              </p>
            </div>

            <div className="feature-box">
              <h3>📊 Real-time Monitoring</h3>
              <p>
                Monitor network traffic and user behaviour continuously.
              </p>
            </div>

            <div className="feature-box">
              <h3>⚡ Instant Alerts</h3>
              <p>
                Notify administrators immediately whenever threats are found.
              </p>
            </div>

            <div className="feature-box">
              <h3>🔒 Secure Authentication</h3>
              <p>
                Multi-level authentication protects sensitive resources.
              </p>
            </div>

            <div className="feature-box">
              <h3>🤖 AI Prediction</h3>
              <p>
                Predict possible attacks before they become serious threats.
              </p>
            </div>

            <div className="feature-box">
              <h3>📈 Analytics Dashboard</h3>
              <p>
                Interactive visual dashboard showing attack statistics.
              </p>
            </div>

          </div>

        </section>

        {/* ================= ARCHITECTURE ================= */}

        <section className="doc-card">

          <div className="card-title">
            🏗 System Architecture
          </div>

          <div className="architecture-grid">

            <div className="arch-box">
              User
            </div>

            <div className="arrow">
              ➜
            </div>

            <div className="arch-box">
              TraceGuard AI Server
            </div>

            <div className="arrow">
              ➜
            </div>

            <div className="arch-box">
              AI Detection Engine
            </div>

            <div className="arrow">
              ➜
            </div>

            <div className="arch-box">
              Threat Database
            </div>

            <div className="arrow">
              ➜
            </div>

            <div className="arch-box">
              Admin Dashboard
            </div>

          </div>

        </section>

        {/* ================= WORKFLOW ================= */}

        <section className="doc-card">

          <div className="card-title">
            ⚙ Authentication Workflow
          </div>

          <div className="timeline">

            <div className="timeline-step">
              1. User Login Request
            </div>

            <div className="timeline-step">
              2. Credential Validation
            </div>

            <div className="timeline-step">
              3. AI Behaviour Analysis
            </div>

            <div className="timeline-step">
              4. Threat Classification
            </div>

            <div className="timeline-step">
              5. Secure Authentication
            </div>

            <div className="timeline-step">
              6. Dashboard Access
            </div>

          </div>

        </section>

        {/* ================= TECHNOLOGIES ================= */}

        <section className="doc-card">

          <div className="card-title">
            💻 Technologies Used
          </div>

          <div className="tech-grid">

            <div className="tech-box">React.js</div>

            <div className="tech-box">Node.js</div>

            <div className="tech-box">Express</div>

            <div className="tech-box">Python</div>

            <div className="tech-box">TensorFlow</div>

            <div className="tech-box">MongoDB</div>

            <div className="tech-box">REST API</div>

            <div className="tech-box">JWT Authentication</div>

          </div>

        </section>

        {/* ================= SECURITY ================= */}

        <section className="doc-card">

          <div className="card-title">
            🔐 Security Modules
          </div>

          <ul className="security-list">

            <li>✔ Multi-factor Authentication</li>

            <li>✔ Role Based Access Control</li>

            <li>✔ Encrypted Password Storage</li>

            <li>✔ AI Threat Intelligence</li>

            <li>✔ Behaviour Monitoring</li>

            <li>✔ Secure Session Handling</li>

          </ul>

        </section>

        {/* ================= FUTURE ================= */}

        <section className="doc-card">

          <div className="card-title">
            🌍 Future Enhancements
          </div>

          <p>
            Future versions of TraceGuard AI will integrate blockchain-based
            authentication, advanced deep learning models, cloud-native
            deployment, distributed threat intelligence sharing, autonomous
            incident response and predictive cyber defence mechanisms for
            enterprise-scale environments.
          </p>

        </section>

        <footer className="docs-footer">

          <h3>TraceGuard AI</h3>

          <p>
            Intelligent Cybersecurity Through Artificial Intelligence
          </p>

        </footer>

      </div>

    </main>
  );
}