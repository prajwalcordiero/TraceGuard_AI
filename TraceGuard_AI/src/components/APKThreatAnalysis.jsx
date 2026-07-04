import React from "react";
import "./APKThreatAnalysis.css";

export default function APKThreatAnalysis({ onBack }) {
  return (
    <main className="analysis-page">

      <div className="analysis-container">

        <div className="security-tag">
          // APK THREAT ANALYSIS //
        </div>

        <h1>APK Threat Analysis</h1>

        <p>
          Analyze Android APK files using Artificial Intelligence to
          identify malware, trojans, spyware, ransomware,
          suspicious permissions and hidden threats before installation.
        </p>

        <div className="coming-soon-card">

          <div className="icon">
            📱
          </div>

          <h2>APK Scanner</h2>

          <p>
            Upload an APK file to perform AI-powered static and
            dynamic security analysis.
          </p>

          <button className="upload-btn">
            Upload APK
          </button>

        </div>

        <button
          className="btn-primary"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

      </div>

    </main>
  );
}