/* ============================================================
   AUDIO MANAGER — Web Audio API, silenciable.
   Único punto de reproducción de sonido (los componentes nunca
   reproducen audio directamente).
   ============================================================ */
export const Sound = (() => {
  let ctx = null, master = null, muted = false;
  const ensure = () => {
    if (typeof window === "undefined") return;
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination); }
    if (ctx.state === "suspended") ctx.resume();
  };
  const setMuted = (m) => { muted = m; if (master) master.gain.value = m ? 0 : 0.9; };
  const beep = (freq, dur, type = "sine", vol = 0.4, when = 0) => {
    if (muted) return; ensure(); if (!ctx) return;
    const t = ctx.currentTime + when; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  };
  const noise = (dur, vol = 0.3) => {
    if (muted) return; ensure(); if (!ctx) return;
    const t = ctx.currentTime; const n = Math.floor(ctx.sampleRate * dur); const buf = ctx.createBuffer(1, n, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain(); g.gain.value = vol; src.connect(g); g.connect(master); src.start(t);
  };
  return {
    ensure, setMuted, isMuted: () => muted,
    diceRoll: () => { noise(0.28, 0.18); for (let i = 0; i < 5; i++) beep(220 + i * 40, 0.05, "square", 0.15, i * 0.05); },
    diceResult: (v) => { beep(300 + v * 60, 0.12, "triangle", 0.5); beep(600 + v * 60, 0.10, "sine", 0.3, 0.06); },
    move: () => beep(520, 0.06, "square", 0.22),
    cardFlip: () => { noise(0.12, 0.12); beep(440, 0.08, "triangle", 0.25, 0.02); },
    countdown: (v) => beep(v === 0 ? 880 : 440, 0.14, "sine", 0.5),
    tick: () => beep(760, 0.05, "square", 0.3),
    alarm: () => { beep(180, 0.5, "sawtooth", 0.5); beep(140, 0.5, "square", 0.35, 0.05); },
    correct: () => { [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.16, "triangle", 0.4, i * 0.09)); },
    turn: () => { beep(392, 0.1, "sine", 0.35); beep(523, 0.12, "sine", 0.3, 0.09); },
    victory: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.28, "triangle", 0.45, i * 0.13)); [261, 392].forEach((f, i) => beep(f, 0.4, "sine", 0.25, 0.1 + i * 0.13)); },
  };
})();
