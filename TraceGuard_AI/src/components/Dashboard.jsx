import React, { useRef, useState } from "react";
import "./Dashboard.css";

function DropModule({
  title,
  description,
  badge,
  fileName,
  onFile,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) onFile(file.name);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file.name);
  };

  return (
    <div className="drop-module">
      <div className="drop-module-header">
        <h2>{title}</h2>

        <span
          className={`drop-badge ${
            badge === "Required" ? "required" : "optional"
          }`}
        >
          {badge}
        </span>
      </div>

      <div
        className={`drop-box ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p>{description}</p>

        <div
          className="drop-zone"
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            className="drop-input"
            type="file"
            onChange={handleChange}
          />

          {fileName ? (
            <span className="drop-zone-text uploaded">
              {fileName}
            </span>
          ) : (
            <span className="drop-zone-text">
              <strong>Drag & Drop File</strong>
              <br />
              <small>or Click to Upload</small>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ navigateTo }) {
  const [callLogs, setCallLogs] = useState("");
  const [apkFile, setApkFile] = useState("");
  const [financialFile, setFinancialFile] = useState("");

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">

        {/* Back Button */}
        <div className="dashboard-topbar">
          <button
            className="back-btn"
            onClick={() => navigateTo("/")}
          >
            ← Back to Home
          </button>
        </div>

        {/* Header */}
        

        <h1>Threat Analysis Dashboard</h1>

        <p>
          Upload files to begin AI-powered cyber threat detection.
        </p>

        {/* Cards */}
        <div className="dashboard-grid">

          <DropModule
            title="Call Log Analysis"
            badge="Optional"
            fileName={callLogs}
            onFile={setCallLogs}
          />

          <DropModule
            title="APK Threat Analysis"
            badge="Required"
            fileName={apkFile}
            onFile={setApkFile}
          />

          <DropModule
            title="Financial Analysis"
            badge="Optional"
            fileName={financialFile}
            onFile={setFinancialFile}
          />

        </div>
      </div>
    </main>
  );
}