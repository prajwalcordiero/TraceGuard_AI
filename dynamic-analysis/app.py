"""
TraceGuard AI - Combined analysis server with embedded dashboard UI.

Runs the full pipeline (static extraction -> malware heuristics ->
nested APK check -> dynamic emulator execution with kill switch ->
correlation) and serves a dashboard to view results, all from one
file. No separate HTML file needed - the page is embedded below.

Run with:  python app.py
Then open: http://localhost:5000
"""

import os
import sys
import time
import uuid
import queue
import threading
import tempfile
import traceback

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from apk_extractor import analyze_apk
from emulator_controller import (
    start_emulator, install_apk, launch_app,
    simulate_interaction, stop_emulator,
)
from kill_switch import KillSwitchMonitor
from pcap_parser import parse_pcap
from correlate import correlate
from malware_heuristics import run_malware_heuristics
from nested_apk_detector import find_nested_apks

app = Flask(__name__)
CORS(app)

AVD_NAME = "dynamic-analysis-clean"
CAPTURE_SECONDS = 45

job_queue = queue.Queue()
jobs = {}


def worker_loop():
    while True:
        job_id, apk_path = job_queue.get()
        jobs[job_id]["status"] = "running"
        jobs[job_id]["stage"] = "Running static analysis..."

        try:
            static_result = analyze_apk(apk_path)
            package_name = static_result["package_name"]

            jobs[job_id]["stage"] = "Running malware heuristics..."
            heuristics_result = run_malware_heuristics(apk_path)

            jobs[job_id]["stage"] = "Checking for nested APKs..."
            nested = find_nested_apks(apk_path)

            jobs[job_id]["stage"] = "Booting emulator (this can take a few minutes)..."
            pcap_path = f"capture_{job_id}.pcap"
            emu_proc = start_emulator(AVD_NAME, pcap_path)

            kill_switch_result = {"triggered": False, "reason": None}

            try:
                jobs[job_id]["stage"] = "Installing and launching app..."
                install_apk(apk_path)
                launch_app(package_name)
                simulate_interaction(taps=5, delay=2)

                def on_danger(pattern, line):
                    kill_switch_result["triggered"] = True
                    kill_switch_result["reason"] = f"{pattern} — {line}"

                monitor = KillSwitchMonitor(on_trigger=on_danger)
                monitor.start()

                jobs[job_id]["stage"] = f"Monitoring for up to {CAPTURE_SECONDS}s..."
                waited = 0
                while waited < CAPTURE_SECONDS and not kill_switch_result["triggered"]:
                    time.sleep(1)
                    waited += 1
                monitor.stop()

            finally:
                jobs[job_id]["stage"] = "Stopping emulator..."
                stop_emulator(emu_proc)
                time.sleep(3)

            jobs[job_id]["stage"] = "Parsing captured traffic..."
            dynamic_result = parse_pcap(pcap_path)
            correlation_result = correlate(static_result["iocs"], dynamic_result)

            jobs[job_id]["status"] = "done"
            jobs[job_id]["result"] = {
                "static": static_result,
                "malware_heuristics": heuristics_result,
                "nested_apks": nested,
                "dynamic": dynamic_result,
                "correlation": correlation_result,
                "kill_switch": kill_switch_result,
            }

            if os.path.exists(pcap_path):
                os.remove(pcap_path)

        except Exception as e:
            error_text = f"{e}\n{traceback.format_exc()}"
            print(f"\n[ERROR] Job {job_id} failed:\n{error_text}\n")
            jobs[job_id]["status"] = "error"
            jobs[job_id]["error"] = error_text

        finally:
            if os.path.exists(apk_path):
                os.remove(apk_path)
            job_queue.task_done()


@app.route("/api/analyze", methods=["POST"])
def analyze():
    file = request.files.get("apk")
    if not file:
        return jsonify({"error": "No APK uploaded"}), 400

    job_id = str(uuid.uuid4())
    tmp_path = os.path.join(tempfile.gettempdir(), f"{job_id}.apk")
    file.save(tmp_path)

    jobs[job_id] = {"status": "queued", "stage": "Queued", "result": None, "error": None}
    job_queue.put((job_id, tmp_path))

    return jsonify({"job_id": job_id, "queue_position": job_queue.qsize()})


@app.route("/api/status/<job_id>", methods=["GET"])
def status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Unknown job_id"}), 404
    return jsonify(job)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "queue_size": job_queue.qsize()})


@app.route("/", methods=["GET"])
def index():
    return Response(INDEX_HTML, mimetype="text/html")


INDEX_HTML = r"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TraceGuard AI - Analysis Dashboard</title>
<style>
  :root {
    --bg: #030712;
    --surface: rgba(255,255,255,0.035);
    --border: rgba(0,240,255,0.14);
    --border-strong: rgba(0,240,255,0.35);
    --cyan: #00f0ff;
    --text: #f3f4f6;
    --muted: #9ca3af;
    --dim: #56607a;
    --red: #ef4444;
    --orange: #f97316;
    --yellow: #eab308;
    --green: #22c55e;
  }
  * { box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Courier New', monospace, system-ui;
    margin: 0;
    padding: 2.5rem 1.5rem 4rem;
  }
  .wrap { max-width: 900px; margin: 0 auto; }
  h1 { color: var(--cyan); margin: 0 0 0.3rem; font-size: 2rem; }
  p.subtitle { color: var(--muted); margin: 0 0 2rem; }

  #drop-zone {
    border: 2px dashed rgba(255,255,255,0.25);
    border-radius: 10px;
    padding: 3rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color .2s, background .2s;
  }
  #drop-zone.drag-over { border-color: var(--cyan); background: rgba(0,240,255,0.06); }
  #drop-zone p { color: var(--muted); margin: 0; }
  #file-input { display: none; }

  #status-box { margin-top: 1.5rem; display: none; }
  #status-text { color: var(--cyan); font-size: 0.9rem; }
  .spinner {
    display: inline-block; width: 10px; height: 10px; border-radius: 50%;
    background: var(--cyan); margin-right: 8px;
    animation: pulse 1s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }

  #dashboard { display: none; margin-top: 2rem; }

  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }
  .panel h2 {
    font-size: 1rem; margin: 0 0 1rem; color: var(--text);
    padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .header-row {
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
  }
  .pkg-name { font-size: 1.3rem; font-weight: bold; }
  .pkg-version { color: var(--dim); font-size: 0.85rem; }

  .badge {
    display: inline-block; font-size: 0.75rem; font-weight: bold;
    padding: 0.35rem 0.9rem; border-radius: 20px; letter-spacing: 0.5px;
  }
  .badge.NONE { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge.LOW { background: rgba(234,179,8,0.15); color: var(--yellow); }
  .badge.MEDIUM { background: rgba(249,115,22,0.15); color: var(--orange); }
  .badge.HIGH { background: rgba(239,68,68,0.15); color: var(--red); }

  .alert-banner {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.4);
    border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;
    color: #fca5a5; font-size: 0.9rem;
  }
  .ok-banner {
    background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.3);
    border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;
    color: #86efac; font-size: 0.9rem;
  }

  .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .tag {
    font-size: 0.78rem; padding: 0.3rem 0.75rem; border-radius: 20px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: var(--muted);
  }
  .tag.danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
  .tag.cyan { background: rgba(0,240,255,0.06); border-color: var(--border); color: var(--cyan); }

  .empty-note { color: var(--dim); font-size: 0.85rem; font-style: italic; }

  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { text-align: left; color: var(--dim); font-weight: normal; padding: 0.5rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
  td { padding: 0.5rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.04); }

  #raw-json {
    white-space: pre-wrap; word-break: break-word; font-size: 0.78rem;
    max-height: 400px; overflow-y: auto; color: var(--dim);
  }
  details summary { cursor: pointer; color: var(--muted); font-size: 0.85rem; }
</style>
</head>
<body>
<div class="wrap">

  <h1>TraceGuard AI</h1>
  <p class="subtitle">Drop an APK to run static + dynamic + malware heuristic analysis</p>

  <div id="drop-zone">
    <p id="drop-text">Drag &amp; drop an APK here, or click to browse</p>
    <input type="file" id="file-input" accept=".apk">
  </div>

  <div id="status-box">
    <span class="spinner"></span><span id="status-text"></span>
  </div>

  <div id="dashboard"></div>

</div>

<script>
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const dropText = document.getElementById("drop-text");
  const statusBox = document.getElementById("status-box");
  const statusText = document.getElementById("status-text");
  const dashboard = document.getElementById("dashboard");

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  });

  async function uploadFile(file) {
    dropText.textContent = `📎 ${file.name}`;
    dashboard.style.display = "none";
    statusBox.style.display = "block";
    statusText.textContent = "Uploading...";

    const formData = new FormData();
    formData.append("apk", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      pollStatus(data.job_id);
    } catch (err) {
      statusText.textContent = "Error: " + err.message;
    }
  }

  function pollStatus(jobId) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const job = await res.json();

        if (job.status === "queued" || job.status === "running") {
          statusText.textContent = job.stage || job.status;
        } else if (job.status === "done") {
          clearInterval(interval);
          statusBox.style.display = "none";
          renderDashboard(job.result);
        } else if (job.status === "error") {
          clearInterval(interval);
          statusText.textContent = "Error - see console";
          console.error(job.error);
        }
      } catch (err) {
        clearInterval(interval);
        statusText.textContent = "Error: " + err.message;
      }
    }, 3000);
  }

  function tagList(items, cls) {
    if (!items || items.length === 0) return '<span class="empty-note">None found</span>';
    return '<div class="tag-list">' + items.map(i => `<span class="tag ${cls||''}">${escapeHtml(i)}</span>`).join('') + '</div>';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderDashboard(r) {
    const s = r.static;
    const mh = r.malware_heuristics;
    const nested = r.nested_apks || [];
    const dyn = r.dynamic;
    const corr = r.correlation;
    const ks = r.kill_switch;

    let html = "";

    // Header
    html += `
      <div class="panel">
        <div class="header-row">
          <div>
            <div class="pkg-name">${escapeHtml(s.package_name)}</div>
            <div class="pkg-version">v${escapeHtml(s.version)}</div>
          </div>
          <span class="badge ${mh.risk_level}">${mh.risk_level} RISK (score ${mh.risk_score})</span>
        </div>
      </div>
    `;

    // Nested APK alert
    if (nested.length > 0) {
      html += `<div class="alert-banner">🚨 <strong>Nested APK detected</strong> — this app carries ${nested.length} embedded payload(s), a common dropper pattern.
        ${nested.map(n => `<br>• ${escapeHtml(n.path_inside_outer_apk)} (${n.size_bytes} bytes)${n.disguised ? ' — disguised extension' : ''}`).join('')}
      </div>`;
    }

    // Kill switch
    if (ks.triggered) {
      html += `<div class="alert-banner">⛔ <strong>Kill switch triggered during execution:</strong> ${escapeHtml(ks.reason)}</div>`;
    } else {
      html += `<div class="ok-banner">✅ No dangerous behavior triggered the kill switch during the monitoring window.</div>`;
    }

    // Permissions
    html += `
      <div class="panel">
        <h2>Flagged Permissions (${s.permissions_flagged.length} of ${s.permissions_all.length} total)</h2>
        ${tagList(s.permissions_flagged, 'danger')}
      </div>
    `;

    // Malware heuristics
    html += `
      <div class="panel">
        <h2>Malware Heuristic Indicators</h2>
        <p style="color:var(--dim);font-size:0.8rem;margin-top:-0.5rem;">Dynamic code loading:</p>
        ${tagList(mh.dynamic_code_loading, 'danger')}
        <p style="color:var(--dim);font-size:0.8rem;">Dangerous API usage:</p>
        ${tagList(mh.dangerous_api_usage, 'danger')}
        <p style="color:var(--dim);font-size:0.8rem;">Anti-analysis / sandbox-evasion indicators:</p>
        ${tagList(mh.anti_analysis_indicators, 'danger')}
      </div>
    `;

    // IOCs
    html += `
      <div class="panel">
        <h2>Extracted Indicators (IOCs)</h2>
        <p style="color:var(--dim);font-size:0.8rem;">IP addresses:</p>
        ${tagList(s.iocs.ip, 'cyan')}
        <p style="color:var(--dim);font-size:0.8rem;">Domains:</p>
        ${tagList(s.iocs.domain, 'cyan')}
        <p style="color:var(--dim);font-size:0.8rem;">Emails:</p>
        ${tagList(s.iocs.email, 'cyan')}
      </div>
    `;

    // Dynamic network
    html += `
      <div class="panel">
        <h2>Dynamic Network Activity</h2>
        <p style="color:var(--dim);font-size:0.8rem;">Domains contacted at runtime:</p>
        ${tagList(dyn.domains, 'cyan')}
        <p style="color:var(--dim);font-size:0.8rem;">Destination IPs:</p>
        ${tagList(dyn.dest_ips, 'cyan')}
      </div>
    `;

    // Correlation
    html += `
      <div class="panel">
        <h2>Static vs Dynamic Correlation</h2>
        <p style="font-size:0.9rem;color:${corr.dynamic_only_domains.length || corr.dynamic_only_ips.length ? 'var(--red)' : 'var(--green)'};">${escapeHtml(corr.flag)}</p>
        <p style="color:var(--dim);font-size:0.8rem;">Contacted but never hardcoded (dynamic-only):</p>
        ${tagList([...corr.dynamic_only_domains, ...corr.dynamic_only_ips], 'danger')}
      </div>
    `;

    // Raw JSON
    html += `
      <div class="panel">
        <details>
          <summary>View raw JSON</summary>
          <pre id="raw-json">${escapeHtml(JSON.stringify(r, null, 2))}</pre>
        </details>
      </div>
    `;

    dashboard.innerHTML = html;
    dashboard.style.display = "block";
  }
</script>
</body>
</html>
"""


if __name__ == "__main__":
    threading.Thread(target=worker_loop, daemon=True).start()
    print("[*] Server starting on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000)