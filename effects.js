// Wait for dependencies to hook into window
window.addEventListener('DOMContentLoaded', () => {
  const checkOGL = setInterval(() => {
    if (window.OGL) {
      clearInterval(checkOGL);
      initBackgrounds();
    }
  }, 30);

  initInterface();
});

function initInterface() {
  const authModal = document.getElementById('auth-modal');
  const openBtn = document.getElementById('open-auth-btn');
  const heroBtn = document.getElementById('hero-auth-btn');
  const closeBtn = document.getElementById('close-auth-btn');

  const showModal = () => authModal.classList.add('active');
  const hideModal = () => authModal.classList.remove('active');

  openBtn.addEventListener('click', showModal);
  heroBtn.addEventListener('click', showModal);
  closeBtn.addEventListener('click', hideModal);

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) hideModal();
  });
}

function initBackgrounds() {
  const { Renderer, Program, Mesh, Triangle } = window.OGL;

  const hexToRGB = hex => {
    const c = hex.replace('#', '').padEnd(6, '0');
    return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255];
  };

  /* ========================================================================
     1. SOFT AURORA COMPONENT (FULL EXTENDED LENGTH)
     ======================================================================== */
  (() => {
    const container = document.getElementById('aurora-container');
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    container.appendChild(gl.canvas);

    window.addEventListener('resize', resize);
    function resize() {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      if (program) program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    }

    const vertexShader = `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`;
    const fragmentShader = `
      precision highp float;
      uniform float uTime; uniform vec3 uResolution; uniform float uSpeed; uniform float uScale; uniform float uBrightness;
      uniform vec3 uColor1; uniform vec3 uColor2; uniform float uNoiseFreq; uniform float uNoiseAmp;
      uniform float uBandHeight; uniform float uBandSpread; uniform float uOctaveDecay; uniform float uLayerOffset;
      uniform float uColorSpeed; uniform vec2 uMouse; uniform float uMouseInfluence; uniform bool uEnableMouse;
      #define TAU 6.28318
      vec3 gradientHash(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 234.6)), dot(p, vec3(269.5, 183.3, 198.3)), dot(p, vec3(169.5, 283.3, 156.9)));
        vec3 h = fract(sin(p) * 43758.5453123);
        float phi = acos(2.0 * h.x - 1.0); float theta = TAU * h.y;
        return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
      }
      float quinticSmooth(float t) { float t2 = t * t; float t3 = t * t2; return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3; }
      vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(TAU * (c * t + d)); }
      float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
        float x = px * frequency; float y = py * frequency;
        float fx = floor(x); float fy = floor(y); float fz = floor(pz);
        float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);
        float d000 = dot(gradientHash(vec3(fx, fy, fz)), vec3(x - fx, y - fy, pz - fz));
        float d100 = dot(gradientHash(vec3(cx, fy, fz)), vec3(x - cx, y - fy, pz - fz));
        float d010 = dot(gradientHash(vec3(fx, cy, fz)), vec3(x - fx, y - cy, pz - fz));
        float d110 = dot(gradientHash(vec3(cx, cy, fz)), vec3(x - cx, y - cy, pz - fz));
        float d001 = dot(gradientHash(vec3(fx, fy, cz)), vec3(x - fx, y - fy, pz - cz));
        float d101 = dot(gradientHash(vec3(cx, fy, cz)), vec3(x - cx, y - fy, pz - cz));
        float d011 = dot(gradientHash(vec3(fx, cy, cz)), vec3(x - fx, y - cy, pz - cz));
        float d111 = dot(gradientHash(vec3(cx, cy, cz)), vec3(x - cx, y - cy, pz - cz));
        float sx = quinticSmooth(x - fx); float sy = quinticSmooth(y - fy); float sz = quinticSmooth(pz - fz);
        return amplitude * mix(mix(mix(d000, d100, sx), mix(d010, d110, sx), sy), mix(mix(d001, d101, sx), mix(d011, d111, sx), sy), sz);
      }
      float auroraGlow(float t, vec2 shift) {
        vec2 uv = gl_FragCoord.xy / uResolution.y; uv += shift;
        float noiseVal = 0.0; float freq = uNoiseFreq; float amp = uNoiseAmp; vec2 samplePos = uv * uScale;
        for (float i = 0.0; i < 3.0; i += 1.0) { noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t); amp *= uOctaveDecay; freq *= 2.0; }
        float yBand = uv.y * 10.0 - uBandHeight * 10.0; return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy; float t = uSpeed * 0.4 * uTime;
        vec2 shift = vec2(0.0); if (uEnableMouse) { shift = (uMouse - 0.5) * uMouseInfluence; }
        vec3 col = vec3(0.0);
        col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
        col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;
        col *= uBrightness; float alpha = clamp(length(col), 0.0, 1.0); gl_FragColor = vec4(col, alpha * 0.25);
      }
    `;

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [0, 0, 0] },
        uSpeed: { value: 0.15 },
        uScale: { value: 0.8 },
        uBrightness: { value: 0.6 },
        uColor1: { value: hexToRGB('#00f0ff') }, 
        uColor2: { value: hexToRGB('#7000ff') },
        uNoiseFreq: { value: 1.8 },
        uNoiseAmp: { value: 0.9 },
        uBandHeight: { value: 0.35 },
        uBandSpread: { value: 2.5 },
        uOctaveDecay: { value: 0.2 },
        uLayerOffset: { value: 0.8 },
        uColorSpeed: { value: 0.3 },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: 0.1 },
        uEnableMouse: { value: true }
      }
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });
    resize();

    window.addEventListener('mousemove', (e) => {
      const rect = gl.canvas.getBoundingClientRect();
      targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height];
    });

    function update(time) {
      requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      program.uniforms.uMouse.value[0] = currentMouse[0];
      program.uniforms.uMouse.value[1] = currentMouse[1];
      renderer.render({ scene: mesh });
    }
    requestAnimationFrame(update);
  })();

  /* ========================================================================
     2. LIGHTFALL COMPONENT
     ======================================================================== */
  (() => {
    const container = document.getElementById('lightfall-container');
    if (!container) return;

    const renderer = new Renderer({ dpr: window.devicePixelRatio || 1, alpha: true, antialias: true });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    container.appendChild(canvas);

    const baseColors = ['#00f0ff', '#7000ff', '#ffffff'];
    const arr = [hexToRGB(baseColors[0]), hexToRGB(baseColors[1]), hexToRGB(baseColors[2]), hexToRGB(baseColors[0]), hexToRGB(baseColors[0]), hexToRGB(baseColors[0]), hexToRGB(baseColors[0]), hexToRGB(baseColors[0])];

    const uniforms = {
      iResolution: { value: [0, 0, 1] }, iMouse: { value: [0, 0] }, iTime: { value: 0 },
      uColor0: { value: arr[0] }, uColor1: { value: arr[1] }, uColor2: { value: arr[2] }, uColor3: { value: arr[3] }, uColor4: { value: arr[4] }, uColor5: { value: arr[5] }, uColor6: { value: arr[6] }, uColor7: { value: arr[7] },
      uColorCount: { value: 3 }, uBgColor: { value: hexToRGB('#030712') }, uMouseColor: { value: [0, 0.8, 1] },
      uSpeed: { value: 0.5 }, uStreakCount: { value: 2 }, uStreakWidth: { value: 0.8 }, uStreakLength: { value: 0.8 },
      uGlow: { value: 0.7 }, uDensity: { value: 0.5 }, uTwinkle: { value: 0.5 }, uZoom: { value: 2.5 },
      uBgGlow: { value: 0.05 }, uOpacity: { value: 0.4 }, uMouseEnabled: { value: 1.0 }, uMouseStrength: { value: 0.4 }, uMouseRadius: { value: 0.4 }
    };

    const vertexShader = `attribute vec2 position; attribute vec2 uv; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;
    const fragmentShader = `
      precision highp float;
      uniform vec3 iResolution; uniform vec2 iMouse; uniform float iTime;
      uniform vec3 uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3; uniform vec3 uColor4; uniform vec3 uColor5; uniform vec3 uColor6; uniform vec3 uColor7; uniform int uColorCount;
      uniform vec3 uBgColor; uniform vec3 uMouseColor; uniform float uSpeed; uniform int uStreakCount; uniform float uStreakWidth; uniform float uStreakLength;
      uniform float uGlow; uniform float uDensity; uniform float uTwinkle; uniform float uZoom; uniform float uBgGlow; uniform float uOpacity;
      uniform float uMouseEnabled; uniform float uMouseStrength; uniform float uMouseRadius;
      varying vec2 vUv;
      vec3 palette(float h) {
        int count = uColorCount; if (count < 1) count = 1;
        int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
        if (idx <= 0) return uColor0; if (idx == 1) return uColor1; if (idx == 2) return uColor2; if (idx == 3) return uColor3;
        if (idx == 4) return uColor4; if (idx == 5) return uColor5; if (idx == 6) return uColor6; return uColor7;
      }
      vec3 tanhv(vec3 x) { vec3 e = exp(-2.0 * x); return (1.0 - e) / (1.0 + e); }
      vec2 sceneC(vec2 frag, vec2 r) {
        vec2 P = (frag + frag - r) / r.x; float z = 0.0; float d = 1e3; vec4 O = vec4(0.0);
        for (int k = 0; k < 39; k++) {
          if (d <= 1e-4) break;
          O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
          d = 1.0 - sqrt(length(O * O)); z += d;
        }
        return vec2(O.x, atan(O.z, O.y));
      }
      void mainImage(out vec4 o, vec2 C) {
        vec2 r = iResolution.xy; vec2 uv0 = (C + C - r) / r.x;
        float T = 0.1 * iTime * uSpeed + 9.0; float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5)); vec2 Y = vec2(5e-3, 6.28318530718 / angRings);
        vec2 c0 = sceneC(C, r); vec2 cdx = sceneC(C + vec2(1.0, 0.0), r); vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
        vec2 dCx = cdx - c0; vec2 dCy = cdy - c0;
        dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5); dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
        vec2 fw = abs(dCx) + abs(dCy); C = c0;
        vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
        vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);
        float mGlow = 0.0;
        if (uMouseEnabled > 0.5) {
          vec2 mN = (iMouse + iMouse - r) / r.x; float md = length(uv0 - mN);
          mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength; O.rgb += uMouseColor * mGlow * 0.25;
        }
        float zr = 5e-4 * uStreakWidth; vec2 rr = vec2(max(length(fw), 1e-5)); float tail = 19.0 / max(uStreakLength, 0.05);
        for (int m = 0; m < 16; m++) {
          if (m >= uStreakCount) break;
          float jf = float(m) + 1.0; float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
          vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0); Pp -= floor(Pp / Y + 0.5) * Y;
          float h = fract(8663.0 * ic); vec3 col = palette(h);
          float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle) * (1.0 + mGlow * 2.0);
          vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
          vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner); O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
          C.x += Y.x / 8.0;
        }
        vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0))); o = vec4(colr, uOpacity);
      }
      void main() { vec4 color; mainImage(color, vUv * iResolution.xy); gl_FragColor = color; }
    `;

    const program = new Program(gl, { vertex: vertexShader, fragment: fragmentShader, uniforms });
    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    }
    resize();
    new ResizeObserver(resize).observe(container);

    window.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scale = renderer.dpr || 1;
      uniforms.iMouse.value = [(e.clientX - rect.left) * scale, (rect.height - (e.clientY - rect.top)) * scale];
    });

    function loop(t) {
      requestAnimationFrame(loop);
      uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    requestAnimationFrame(loop);
  })();
}