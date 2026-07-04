import React from "react";
import "./FinancialThreatAnalysis.css";

export default function FinancialThreatAnalysis({ onBack }) {
  return (
    <main className="analysis-page">

      <div className="analysis-container">

        <div className="security-tag">
          // FINANCIAL THREAT ANALYSIS //
        </div>

        <h1>Financial Threat Analysis</h1>

        <p>
          This module will be used to detect financial fraud,
          suspicious transactions, phishing attempts,
          banking threats and other AI-powered financial
          security risks.
        </p>

        <div className="coming-soon-card">

          <div className="icon">
            💳
          </div>

          <h2>Module Under Development</h2>

          <p>
            The Financial Threat Analysis engine will be
            implemented here.
          </p>

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