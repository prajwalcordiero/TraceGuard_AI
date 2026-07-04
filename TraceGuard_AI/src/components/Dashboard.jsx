import React from "react";
import "./Dashboard.css";

export default function Dashboard({ navigateTo }) {
  return (
    <main className="dashboard-page">

      <div className="dashboard-container">

        <div className="security-tag">
          // TRACEGUARD AI DASHBOARD //
        </div>

        <h1>Welcome to TraceGuard AI</h1>

        <p>
          Select one of the intelligent modules below to continue.
        </p>

        <div className="dashboard-grid">

          {/* Google Maps */}

          <div
            className="dashboard-card"
            onClick={() =>
              window.open("https://www.google.com/maps", "_blank")
            }
          >
            <div className="card-icon">📍</div>

            <h2>Google Maps</h2>

            <p>
              Open Google Maps and access live location services.
            </p>

            <button className="dashboard-btn">
              Open Maps →
            </button>
          </div>

          {/* APK */}

          <div
            className="dashboard-card"
            onClick={() => navigateTo("/apk-analysis")}
          >
            <div className="card-icon">📱</div>

            <h2>APK Threat Analysis</h2>

            <p>
              Scan Android APK files using AI-powered malware detection.
            </p>

            <button className="dashboard-btn">
              Open Module →
            </button>
          </div>

          {/* Financial */}

          <div
            className="dashboard-card"
            onClick={() => navigateTo("/financial-analysis")}
          >
            <div className="card-icon">💳</div>

            <h2>Financial Threat Analysis</h2>

            <p>
              Detect fraudulent transactions, phishing attacks and banking threats.
            </p>

            <button className="dashboard-btn">
              Open Module →
            </button>
          </div>

        </div>

      </div>

    </main>
  );
}