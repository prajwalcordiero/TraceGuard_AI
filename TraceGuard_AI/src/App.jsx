import React, { useState, useEffect } from "react";
import SoftAurora from "./components/SoftAurora";
import Lightfall from "./components/Lightfall";
import DocumentationPage from "./components/DocumentationPage";
import Dashboard from "./components/Dashboard";
import APKThreatAnalysis from "./components/APKThreatAnalysis";
import FinancialThreatAnalysis from "./components/FinancialThreatAnalysis";
import SplineRobot from "./components/Splinerobot";
import "./App.css";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  // Handle browser navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);

    return () =>
      window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Simple router
  const navigateTo = (newPath) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Render pages
  const renderPage = () => {
    switch (path) {
      case "/docs":
        return <DocumentationPage onBack={() => navigateTo("/")} />;

      case "/dashboard":
        return <Dashboard navigateTo={navigateTo} />;

      case "/apk-analysis":
        return <APKThreatAnalysis onBack={() => navigateTo("/dashboard")} />;

      case "/financial-analysis":
        return (
          <FinancialThreatAnalysis onBack={() => navigateTo("/dashboard")} />
        );

      default:
        return (
          <>
            <header className="navbar">
              <div
                className="logo"
                onClick={() => navigateTo("/")}
                style={{ cursor: "pointer" }}
              >
                <span className="pulse-dot"></span>
                <div className="logo-text">
                  <span className="logo-main">TRACE</span>
                  <span className="logo-accent">GUARD</span>
                  <span className="logo-ai"> AI</span>
                </div>
              </div>

              <nav>
                <button
                  className={`nav-link-btn ${
                    path === "/" ? "nav-active" : ""
                  }`}
                  onClick={() => navigateTo("/")}
                >
                  Home
                </button>

                <button
                  className={`nav-link-btn ${
                    path === "/docs" ? "nav-active" : ""
                  }`}
                  onClick={() => navigateTo("/docs")}
                >
                  Documentation
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => navigateTo("/dashboard")}
                >
                  Launch Portal
                </button>
              </nav>
            </header>

            <main className="hero-section">
              <div className="hero-layout">
                {/* LEFT SIDE */}
                <div className="hero-content animate-fade">

                  <h1>
                    SHERLOCK <span>PK</span>
                  </h1>

                  <p>
                    TraceGuard AI uses Artificial Intelligence to detect malware, financial fraud, APK threats, and suspicious activities in real time.
                  </p>

                  <div className="cta-group">
                    <button
                      className="btn-primary"
                      onClick={() => navigateTo("/dashboard")}
                    >
                      Initialize System
                    </button>

                    <button
                      className="btn-outline"
                      onClick={() => navigateTo("/docs")}
                    >
                      Read Documentation
                    </button>
                  </div>
                </div>

                {/* RIGHT SIDE - SPLINE ROBOT */}
                <div className="robot-section">
                  <SplineRobot />
                </div>
              </div>
            </main>
          </>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Background Effects */}
      <SoftAurora />
      <Lightfall />

      {/* Render Current Page */}
      {renderPage()}
    </div>
  );
}