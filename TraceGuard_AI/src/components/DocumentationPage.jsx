import React, { useState, useEffect, useRef } from "react";
import "./DocumentationPage.css";
import {
  BookIcon,
  RocketIcon,
  LayersIcon,
  SettingsIcon,
  CodeIcon,
  ShieldCheckIcon,
  GlobeIcon,
  ActivityIcon,
  ZapIcon,
  LockIcon,
  CpuIcon,
  TrendingUpIcon,
  CheckIcon,
} from "./Icons";

const SECTIONS = [
  { id: "overview", label: "overview", icon: BookIcon },
  { id: "features", label: "features", icon: RocketIcon },
  { id: "architecture", label: "architecture", icon: LayersIcon },
  { id: "workflow", label: "workflow", icon: SettingsIcon },
  { id: "technologies", label: "technologies", icon: CodeIcon },
  { id: "security", label: "security", icon: ShieldCheckIcon },
  { id: "future", label: "roadmap", icon: GlobeIcon },
];

const FEATURES = [
  { icon: ShieldCheckIcon, title: "Threat Detection", desc: "Detect malicious activity using intelligent AI algorithms trained on live attack patterns." },
  { icon: ActivityIcon, title: "Real-time Monitoring", desc: "Track network traffic and user behaviour continuously, with no polling delay." },
  { icon: ZapIcon, title: "Instant Alerts", desc: "Notify administrators the moment a threat signature is matched." },
  { icon: LockIcon, title: "Secure Authentication", desc: "Multi-level authentication gates every sensitive resource in the system." },
  { icon: CpuIcon, title: "AI Prediction", desc: "Forecast likely attack vectors before they escalate into active incidents." },
  { icon: TrendingUpIcon, title: "Analytics Dashboard", desc: "An interactive visual dashboard surfaces attack statistics at a glance." },
];

const PIPELINE = ["User", "TraceGuard AI Server", "AI Detection Engine", "Threat Database", "Admin Dashboard"];

const WORKFLOW = [
  { title: "User login request", desc: "The client submits credentials to the auth gateway." },
  { title: "Credential validation", desc: "Identity is checked against the encrypted credential store." },
  { title: "AI behaviour analysis", desc: "The detection engine scores the session for anomalies." },
  { title: "Threat classification", desc: "Flagged sessions are ranked by severity and type." },
  { title: "Secure authentication", desc: "Clean sessions are issued a signed access token." },
  { title: "Dashboard access", desc: "The user lands on the monitoring dashboard, fully scoped to their role." },
];

const TECH = ["React.js", "Node.js", "Express", "Python", "TensorFlow", "MongoDB", "REST API", "JWT Auth"];

const SECURITY = [
  "Multi-factor authentication",
  "Role-based access control",
  "Encrypted password storage",
  "AI threat intelligence",
  "Behaviour monitoring",
  "Secure session handling",
];

export default function DocumentationPage({ onBack }) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const scrollRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const rootEl = scrollRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: rootEl,
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0,
      }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    /* CRITICAL FIX: id="docs-root" applied here */
    <div id="docs-root" className="docs-page" ref={scrollRef}>
      
      {/* ================= TOP BAR ================= */}
      <header className="docs-topbar">
        <button className="topbar-back" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to Home
        </button>

        <div className="topbar-crumb">
          <span className="pulse-dot"></span>
          TRACEGUARD <span className="crumb-sep">/</span> docs
        </div>

        <div className="topbar-version">v1.0.0</div>
      </header>

      <div className="docs-body">
        {/* ================= SIDEBAR ================= */}
        <aside className="docs-sidebar">
          <div className="sidebar-path">~/traceguard/docs $</div>

          <nav className="sidebar-nav" aria-label="Documentation sections">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  className={`sidebar-link ${activeSection === s.id ? "active" : ""}`}
                  onClick={() => scrollToSection(s.id)}
                >
                  <Icon className="sidebar-icon" width={15} height={15} />
                  <span className="sidebar-label">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <span className="status-dot-sm"></span>
            engine online
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="docs-container">

          <div className="docs-hero">
            <div className="security-tag">// TRACEGUARD AI DOCUMENTATION //</div>
            <h1>TraceGuard AI</h1>
            <p>
              AI-powered cybersecurity monitoring and intelligent threat detection
              platform, built to watch activity, surface anomalies, and secure
              digital infrastructure using machine learning.
            </p>
          </div>

          {/* ================= OVERVIEW ================= */}
          <section className="doc-card" id="overview">
            <div className="card-title"><BookIcon className="title-icon" />Project Overview</div>
            <p>
              TraceGuard AI continuously monitors user activity and system events to
              detect suspicious behaviour using artificial intelligence. Administrators
              get real-time threat alerts, while behavioural analysis keeps false
              positives low.
            </p>
          </section>

          {/* ================= FEATURES ================= */}
          <section className="doc-card" id="features">
            <div className="card-title"><RocketIcon className="title-icon" />Core Features</div>

            <div className="feature-grid">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div className="feature-box" key={f.title}>
                    <Icon className="feature-icon" />
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= ARCHITECTURE ================= */}
          <section className="doc-card" id="architecture">
            <div className="card-title"><LayersIcon className="title-icon" />System Architecture</div>
            <p className="card-subtext">Request flow through the platform, end to end.</p>

            <div className="pipeline">
              {PIPELINE.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="pipeline-step">
                    <span className="pipeline-index">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </div>
                  {i < PIPELINE.length - 1 && <span className="pipeline-pipe" aria-hidden="true">|</span>}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* ================= WORKFLOW ================= */}
          <section className="doc-card" id="workflow">
            <div className="card-title"><SettingsIcon className="title-icon" />Authentication Workflow</div>

            <div className="timeline">
              {WORKFLOW.map((step, i) => (
                <div className="timeline-step" key={step.title}>
                  <div className="timeline-marker">{i + 1}</div>
                  <div className="timeline-text">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= TECHNOLOGIES ================= */}
          <section className="doc-card" id="technologies">
            <div className="card-title"><CodeIcon className="title-icon" />Technologies Used</div>

            <div className="tech-grid">
              {TECH.map((t) => (
                <div className="tech-box" key={t}>{t}</div>
              ))}
            </div>
          </section>

          {/* ================= SECURITY ================= */}
          <section className="doc-card" id="security">
            <div className="card-title"><ShieldCheckIcon className="title-icon" />Security Modules</div>

            <ul className="security-list">
              {SECURITY.map((s) => (
                <li key={s}>
                  <span className="check-icon"><CheckIcon width={12} height={12} /></span>
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {/* ================= FUTURE ================= */}
          <section className="doc-card" id="future">
            <div className="card-title"><GlobeIcon className="title-icon" />Future Enhancements</div>
            <p>
              Future versions of TraceGuard AI will integrate blockchain-based
              authentication, advanced deep learning models, cloud-native
              deployment, distributed threat intelligence sharing, autonomous
              incident response, and predictive cyber defence for
              enterprise-scale environments.
            </p>
          </section>

          <footer className="docs-footer">
            <h3>TraceGuard AI</h3>
            <p>Intelligent Cybersecurity Through Artificial Intelligence</p>
          </footer>

        </main>
      </div>
    </div>
  );
}