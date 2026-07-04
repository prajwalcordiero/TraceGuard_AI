import React from "react";
import "./ThreatLandscape.css";

const THREAT_REASONS = [
  { id: "01", title: "Unpatched Vulnerabilities", description: "Outdated software leaves open backdoors for malware to exploit without interaction.", icon: "🔓" },
  { id: "02", title: "Social Engineering", description: "Phishing emails trick employees into bypassing perimeter security protocols.", icon: "🎣" },
  { id: "03", title: "Weak Authentication", description: "Compromised passwords allow attackers to walk right through the front door.", icon: "🔑" },
  { id: "04", title: "Misconfigured Cloud", description: "Improperly secured buckets expose sensitive configuration files to the internet.", icon: "☁️" },
  { id: "05", title: "Zero-Day Exploits", description: "Actors deploy unknown attack vectors before vendors can patch the flaw.", icon: "☣️" },
  { id: "06", title: "Insider Threats", description: "Employees with legitimate access intentionally or accidentally leak company data.", icon: "👤" }
];

export default function ThreatLandscape() {
  return (
    <section className="threat-landscape-section">
      <div className="threat-header">
        <div style={{color: '#00f0ff', fontFamily: 'monospace', letterSpacing: '2px'}}>// THREAT INTELLIGENCE //</div>
        <h2>The Anatomy of a Cyber Breach</h2>
        <p>Modern cyberattacks are rarely random. Threat actors systematically target these six critical vulnerabilities to bypass security.</p>
      </div>

      <div className="threat-grid">
        {THREAT_REASONS.map((threat) => (
          <div className="threat-card" key={threat.id}>
            <div className="threat-card-header">
              <span className="threat-icon">{threat.icon}</span>
              <span className="threat-id">{threat.id}</span>
            </div>
            <h3>{threat.title}</h3>
            <p>{threat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}