import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { hexToRGB } from '../utils/hexToRGB';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

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

export default function SoftAurora() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    container.appendChild(gl.canvas);

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
        uEnableMouse: { value: true },
      },
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      const rect = gl.canvas.getBoundingClientRect();
      targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height];
    };
    window.addEventListener('mousemove', handleMouseMove);

    let frameId;
    const update = (time) => {
      frameId = requestAnimationFrame(update);
      program.uniforms.uTime.value = time * 0.001;
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      program.uniforms.uMouse.value[0] = currentMouse[0];
      program.uniforms.uMouse.value[1] = currentMouse[1];
      renderer.render({ scene: mesh });
    };
    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 0 }} />;
}