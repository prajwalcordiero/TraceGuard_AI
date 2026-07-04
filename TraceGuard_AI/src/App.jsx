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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(false);

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
                  onClick={() => setIsModalOpen(true)}
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
                    TraceGuard <span>AI</span>
                  </h1>

                  <p>
                    TraceGuard AI is an intelligent cyber-security platform that
                    combines Artificial Intelligence with real-time monitoring to
                    detect malware, financial fraud, suspicious APK behaviour and
                    location-based threats before they become critical.
                  </p>

                  

                  <div className="cta-group">
                    <button
                      className="btn-primary"
                      onClick={() => setIsModalOpen(true)}
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

      {/* Authentication Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="auth-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>

            <div className="auth-header">
              <div className="auth-icon">🛡</div>
              <h2>TraceGuard AI</h2>
              <p>Secure Administrator Authentication</p>
            </div>

            <form
              className="auth-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="input-group">
                <label>Administrator ID</label>
                <input
                  type="text"
                  placeholder="admin@traceguard.ai"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>

              <div className="input-group">
                <label>Security Token</label>
                <input
                  type="password"
                  placeholder="Enter Security Token"
                />
              </div>

              <div className="auth-meta">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember this device
                </label>
                <a href="/">Forgot Password?</a>
              </div>

              <button
                type="button"
                className="btn-submit"
                onClick={() => navigateTo("/dashboard")}
              >
                Authenticate
              </button>
            </form>

            <div className="auth-footer">
              <div className="status-dot"></div>
              <span>AI Security Engine Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}