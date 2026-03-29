let ctx = null;
let masterGain = null;
let bgNodes = null;
let lastLoopStart = 0;

function ensureCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

function setVolume(v) {
  ensureCtx();
  if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01);
}

function setMuted(m) {
  ensureCtx();
  if (masterGain) masterGain.gain.setTargetAtTime(m ? 0 : 0.7, ctx.currentTime, 0.01);
}

function tone(freq, duration=0.2, type='sine', vol=0.2, when=0) {
  const c = ensureCtx();
  const t = when || c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain).connect(masterGain);
  gain.gain.linearRampToValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t+duration);
  osc.start(t);
  osc.stop(t+duration+0.02);
}

function noiseBurst(duration=0.3, vol=0.18) {
  const c = ensureCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0;i<bufferSize;i++) {
    data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.value = vol;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 1000;
  src.connect(filter).connect(gain).connect(masterGain);
  src.start();
}

function click() { tone(900, 0.06, 'square', 0.12); }

function dropThud() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(120, 0.18, 'sine', 0.25, t);
  tone(60, 0.22, 'triangle', 0.15, t+0.01);
  tone(2200, 0.04, 'square', 0.07, t+0.05);
}

function perfectDing() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(1200, 0.08, 'sine', 0.18, t);
  tone(1600, 0.1, 'sine', 0.16, t+0.04);
  tone(2000, 0.18, 'sine', 0.14, t+0.08);
}

function confetti() {
  const c = ensureCtx();
  const t = c.currentTime;
  for (let i=0;i<7;i++) {
    tone(600 + i*120, 0.12 + i*0.01, 'sine', 0.08, t + i*0.03);
  }
}

function heistAlarm() {
  const c = ensureCtx();
  const t = c.currentTime;
  for (let i=0;i<4;i++) {
    tone(800, 0.25, 'sawtooth', 0.18, t + i*0.5);
    tone(600, 0.25, 'sawtooth', 0.18, t + i*0.5 + 0.25);
  }
}

function tick() { tone(1600, 0.05, 'square', 0.1); }

function heistSuccess() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(440, 0.18, 'sine', 0.2, t);
  tone(554, 0.18, 'sine', 0.2, t+0.16);
  tone(659, 0.22, 'sine', 0.22, t+0.32);
  tone(880, 0.35, 'sine', 0.24, t+0.5);
}

function collapse() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(80, 0.6, 'sawtooth', 0.3, t);
  tone(45, 0.8, 'sine', 0.25, t+0.02);
  for (let i=0;i<12;i++) {
    tone(3000 + Math.random()*4000, 0.15 + Math.random()*0.2, 'square', 0.05 + Math.random()*0.08, t+0.1 + i*0.03);
  }
  noiseBurst(0.6, 0.22);
}

function bombBoom() {
  const c = ensureCtx();
  const t = c.currentTime;
  noiseBurst(0.35, 0.28);
  tone(120, 0.25, 'sine', 0.28, t);
  tone(200, 0.12, 'square', 0.15, t+0.02);
}

function coinShimmer() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(2000, 0.12, 'sine', 0.06, t);
  tone(2400, 0.1, 'sine', 0.05, t+0.06);
}

function powerUp() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(523, 0.1, 'sine', 0.15, t);
  tone(659, 0.1, 'sine', 0.15, t+0.08);
  tone(784, 0.15, 'sine', 0.18, t+0.16);
}

function cashRegister() {
  const c = ensureCtx();
  const t = c.currentTime;
  tone(800, 0.05, 'square', 0.15, t);
  tone(1200, 0.08, 'sine', 0.12, t+0.05);
  tone(1600, 0.12, 'sine', 0.1, t+0.12);
}

function startBackground() {
  const c = ensureCtx();
  stopBackground();
  const now = c.currentTime;
  lastLoopStart = now;
  const bpm = 72;
  const beat = 60/bpm;
  const base = now + 0.05;
  const bassSeq = [55, 55, 58, 62, 55, 55, 60, 62];
  for (let bar=0; bar<8; bar++) {
    for (let i=0;i<bassSeq.length;i++) {
      const t = base + (bar*8 + i)*beat;
      tone(bassSeq[i], beat*0.9, 'triangle', 0.06, t);
    }
  }
  const chords = [
    [220, 277, 330],
    [233, 294, 349],
    [247, 311, 370],
    [220, 277, 330],
  ];
  chords.forEach((ch, idx) => {
    for (let b=0;b<8;b++) {
      const t = base + (idx*8 + b*2)*beat;
      ch.forEach((f, j) => tone(f*2, 0.25, 'sine', 0.032, t + j*0.01));
      tone(6000, 0.02, 'square', 0.015, t + beat*0.5);
      tone(6000, 0.02, 'square', 0.015, t + beat*1.0);
    }
  });
  const loopDur = 8*8*beat;
  bgNodes = { timeout: setTimeout(startBackground, loopDur*1000 - 50) };
}

function stopBackground() {
  if (bgNodes?.timeout) clearTimeout(bgNodes.timeout);
  bgNodes = null;
}

function init() { ensureCtx(); }

function resume() {
  const c = ensureCtx();
  if (c.state === 'suspended') c.resume();
}

export const audioEngine = {
  init,
  resume,
  setVolume,
  setMuted,
  click,
  dropThud,
  perfectDing,
  confetti,
  heistAlarm,
  tick,
  heistSuccess,
  collapse,
  bombBoom,
  coinShimmer,
  powerUp,
  cashRegister,
  startBackground,
  stopBackground,
};

// Backwards compatibility
export const audio = audioEngine;
