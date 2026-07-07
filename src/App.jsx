import React, { useState, useEffect, useMemo } from "react";
import { BANK } from "./bank.js";
import { AVATARS, TEAM_COLORS, avatarOf, Crown } from "./avatars.jsx";
import { AVATAR_TO_COLOR } from "./three/models.js";
import {
  CATS, CAT_META, colorAt, DIFFS_UI,
  TIMER_MIN, TIMER_MAX, TIMER_STEP, TIMER_DEFAULT, fmtTime,
  prefersReduced, validateBank,
} from "./game/constants.js";
import { Sound } from "./audio/sound.js";
import { useGameEngine } from "./game/useGameEngine.js";
import { GameCanvas } from "./three/GameCanvas.jsx";
import { CardStage } from "./three/Card3D.jsx";
import { preloadAllModels } from "./three/models.js";
import menuBg from "../assets/backgrounds/menu-background.webp";

/* ============================================================
   PICTIONAHSE 3D — capa de PRESENTACIÓN (HUD + escena 3D).
   La lógica vive en useGameEngine; acá solo se dibuja.
   Etapa 1: la vista 2D del tablero se reemplaza por una escena
   3D (escaparate de assets). El resto del HUD sigue igual.
   ============================================================ */

preloadAllModels();

const HEX = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

/* ----- Paleta ----- */
const C = {
  bg1: "#3A3357", bg2: "#171326",
  panel: "#2A2542", panelHi: "#342E52", panelSoft: "#3C3560",
  cream: "#FBF3E4", creamDark: "#E7D8B8",
  onLight: "#22243a",
  text: "#F2EEFB", textSoft: "#C4BDDD", muted: "#8F87AE",
  purple: "#6C3FD6", purpleDark: "#4E2AA6",
  blue: "#2E7FD0", blueDark: "#1E5EA1",
  line: "#443C68",
  gold: "#F5C518",
  danger: "#C7362F", dangerHi: "#E24B4B",
  good: "#4CA85B", goodHi: "#5FCF5B",
};

/* ----- Paleta del MENÚ (violeta claro y moderno, glassmorphism) ----- */
const M = {
  main: "#6F49E8", hi: "#8458FF",
  cardBorder: "rgba(255,255,255,0.18)",
  glow: "rgba(132,88,255,0.35)",
  text: "#F7F3FF", textSoft: "rgba(232,225,255,0.82)", muted: "rgba(201,191,232,0.6)",
};

const CSS = `
*{box-sizing:border-box}
@keyframes pk-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes pk-shake{0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-6px) rotate(-12deg)}40%{transform:translateY(0) rotate(10deg)}60%{transform:translateY(-4px) rotate(-8deg)}80%{transform:translateY(0) rotate(6deg)}}
@keyframes pk-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}
@keyframes pk-flip{0%{transform:perspective(600px) rotateY(90deg);opacity:0}100%{transform:perspective(600px) rotateY(0);opacity:1}}
@keyframes pk-fall{0%{transform:translateY(-12vh) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:.9}}
@keyframes pk-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pk-glow{0%,100%{box-shadow:0 6px 0 ${C.purpleDark}, 0 0 0 0 rgba(108,63,214,.55)}50%{box-shadow:0 6px 0 ${C.purpleDark}, 0 0 0 12px rgba(108,63,214,0)}}
/* --- menú --- */
@keyframes pk-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes pk-drift{0%{transform:scale(1.14) translate(0,0)}100%{transform:scale(1.14) translate(-7px,-5px)}}
@keyframes pk-breathe{0%,100%{opacity:.5}50%{opacity:.82}}
@keyframes pk-float{0%{transform:translateY(0);opacity:0}12%{opacity:.75}88%{opacity:.75}100%{transform:translateY(-130px);opacity:0}}
@keyframes pk-selpop{0%{transform:scale(1)}45%{transform:scale(1.09)}100%{transform:scale(1)}}
@keyframes pk-startglow{0%,100%{box-shadow:0 8px 22px rgba(132,88,255,.45), 0 0 0 0 rgba(132,88,255,.5), inset 0 1px 0 rgba(255,255,255,.4)}50%{box-shadow:0 10px 30px rgba(132,88,255,.6), 0 0 0 14px rgba(132,88,255,0), inset 0 1px 0 rgba(255,255,255,.5)}}
.pk-scroll::-webkit-scrollbar{height:8px;width:8px}
.pk-scroll::-webkit-scrollbar-thumb{background:#5a4f80;border-radius:8px}
button{font-family:inherit;cursor:pointer}
button:focus-visible{outline:3px solid ${C.purple};outline-offset:2px}
.pk-btn:active{transform:translateY(1px)}
.pk-mbtn{transition:transform .18s cubic-bezier(.2,.85,.3,1.3), box-shadow .22s ease, background .22s ease, border-color .22s ease}
.pk-mbtn:hover{transform:translateY(-2px)}
.pk-mbtn:active{transform:translateY(1px) scale(.97)}
.pk-start{transition:transform .2s cubic-bezier(.2,.85,.3,1.3), box-shadow .25s ease, filter .2s}
.pk-start:hover{transform:translateY(-3px) scale(1.02);filter:brightness(1.05)}
.pk-start:active{transform:translateY(1px) scale(.99)}
.pk-avacard{transition:transform .2s cubic-bezier(.2,.85,.3,1.3), box-shadow .2s, filter .2s}
.pk-avacard:hover{transform:translateY(-4px) scale(1.03)}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}
`;

/* Tarjeta de vidrio del menú (glassmorphism suave) */
const mcard = (extra = {}) => ({
  background: "rgba(111,73,232,0.22)",
  backdropFilter: "blur(13px) saturate(1.25)", WebkitBackdropFilter: "blur(13px) saturate(1.25)",
  border: `1px solid ${M.cardBorder}`, borderRadius: 22,
  boxShadow: "0 14px 36px rgba(16,7,44,.42), inset 0 1px 0 rgba(255,255,255,.18)",
  ...extra,
});
/* Botón segmentado del menú (seleccionado / apagado, mismo estilo) */
const segBtn = (sel) => sel ? ({
  background: "linear-gradient(180deg,#8458FF,#6F49E8)", color: "#fff",
  border: "1px solid rgba(255,255,255,.55)",
  boxShadow: "0 7px 18px rgba(132,88,255,.5), inset 0 1px 0 rgba(255,255,255,.45)",
}) : ({
  background: "rgba(255,255,255,0.055)", color: M.textSoft,
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
});

/* Fondo del menú: imagen desenfocada + overlay violeta + glow cálido + partículas */
function MenuParticles() {
  const dots = useMemo(() => Array.from({ length: prefersReduced() ? 0 : 14 }).map(() => ({
    left: Math.random() * 100, size: 2 + Math.random() * 3, delay: Math.random() * 9, dur: 9 + Math.random() * 7, op: 0.35 + Math.random() * 0.4,
  })), []);
  return dots.map((d, i) => (
    <span key={i} aria-hidden style={{ position: "absolute", bottom: -12, left: `${d.left}%`, width: d.size, height: d.size, borderRadius: "50%", background: "rgba(255,240,214,.95)", boxShadow: "0 0 6px rgba(255,224,178,.85)", opacity: d.op, animation: `pk-float ${d.dur}s linear ${d.delay}s infinite` }} />
  ));
}
function MenuBackground() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "-7%", backgroundImage: `url(${menuBg})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(3.5px) saturate(1.14)", transform: "scale(1.12)", animation: "pk-drift 17s ease-in-out infinite alternate" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(60,40,124,.28) 0%, rgba(42,25,96,.4) 52%, rgba(26,15,60,.56) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", background: "radial-gradient(58% 42% at 76% 24%, rgba(255,196,120,.28), rgba(255,170,90,0) 62%)", animation: "pk-breathe 6.5s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(125% 92% at 50% 42%, rgba(111,73,232,0) 48%, rgba(24,13,54,.42) 100%)" }} />
      <MenuParticles />
    </div>
  );
}

/* ---------------- Logo (imagen oficial de assets) ---------------- */
function Logo({ size = 1, banner = true }) {
  return (
    <div style={{ display: "inline-block", textAlign: "center" }}>
      <img src="/logo.webp" alt="Pictionahse" style={{ width: `${230 * size}px`, maxWidth: "82vw", height: "auto", display: "block", margin: "0 auto", filter: "drop-shadow(0 6px 12px rgba(0,0,0,.5)) drop-shadow(0 0 18px rgba(132,88,255,.35))" }} />
      {banner && (
        <div style={{ marginTop: 2, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(111,73,232,0.34)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          color: "#fff", fontWeight: 800, fontSize: `${0.62 * size}rem`, letterSpacing: 1.5, padding: "6px 18px", borderRadius: 999,
          border: "1px solid rgba(255,255,255,.28)", boxShadow: "0 6px 16px rgba(132,88,255,.35), inset 0 1px 0 rgba(255,255,255,.25)" }}>
          <span style={{ opacity: .85 }}>✦</span>MÍMICA, RISAS Y A GANAR<span style={{ opacity: .85 }}>✦</span></div>
      )}
    </div>
  );
}

/* ---------------- Iconos SVG ---------------- */
function IconSound({ on, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9 H8 L13 4.5 V19.5 L8 15 H4 Z" fill="#fff" />
      {on ? (
        <>
          <path d="M16 9 Q18.4 12 16 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.5 6.6 Q22.5 12 18.5 17.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </>
      ) : (
        <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" stroke="#FF7B7B" strokeWidth="2.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
function IconBook({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5.5 Q8.5 3.5 4 4.5 V18.5 Q8.5 17.5 12 19.5 Q15.5 17.5 20 18.5 V4.5 Q15.5 3.5 12 5.5 Z" fill="#fff" opacity=".92" />
      <path d="M12 5.5 V19.5" stroke="#2A2542" strokeWidth="1.6" />
    </svg>
  );
}
function IconFlag({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3 V21" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 4 H18 L15 8 L18 12 H7 Z" fill="#fff" />
    </svg>
  );
}
function IconLock({ size = 12, color = "#cfc8e8" }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 20 23" fill="none" aria-hidden>
      <rect x="2" y="9" width="16" height="12" rx="3" fill={color} />
      <path d="M6 9 V6.5 A4 4 0 0 1 14 6.5 V9" stroke={color} strokeWidth="2.6" fill="none" />
      <circle cx="10" cy="15" r="2" fill="#2A2542" />
    </svg>
  );
}
function IconCamera({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8 H7 L8.5 6 H15.5 L17 8 H20 A1.5 1.5 0 0 1 21.5 9.5 V18 A1.5 1.5 0 0 1 20 19.5 H4 A1.5 1.5 0 0 1 2.5 18 V9.5 A1.5 1.5 0 0 1 4 8 Z" fill="#fff" />
      <circle cx="12" cy="13.2" r="3.6" fill="#2A2542" />
      <circle cx="12" cy="13.2" r="1.7" fill="#fff" />
    </svg>
  );
}
function IconCard({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="12" height="17" rx="2.4" fill="#fff" opacity=".55" transform="rotate(-8 9 12)" />
      <rect x="8" y="3" width="12" height="17" rx="2.4" fill="#fff" transform="rotate(6 14 12)" />
    </svg>
  );
}

/* Avatar del HUD: foto oficial del personaje (webp) con zoom, en disco */
function AvatarImg({ id, size = 40, active = false, dim = false, crown = false, style }) {
  const color = AVATAR_TO_COLOR[id] || "azul";
  return (
    <span style={{
      position: "relative", display: "inline-block", width: size, height: size, flex: "0 0 auto", borderRadius: "50%",
      backgroundImage: `url(/ui/avatars/${color}.webp)`, backgroundSize: "172%", backgroundPosition: "50% 20%", backgroundRepeat: "no-repeat",
      boxShadow: active ? `0 0 0 3px ${C.goodHi}, 0 3px 7px rgba(0,0,0,.45)` : `0 0 0 2px rgba(255,255,255,.4), 0 3px 7px rgba(0,0,0,.45)`,
      filter: dim ? "grayscale(1) brightness(.7)" : "none", opacity: dim ? 0.55 : 1, ...style,
    }}>
      {crown && <Crown size={size * 0.52} style={{ position: "absolute", top: -size * 0.26, left: "50%", transform: "translateX(-50%) rotate(-8deg)" }} />}
    </span>
  );
}

/* Tarjeta grande de selección de equipo (imagen oficial + estados) */
const UI_AVATAR_SRC = (id) => `/ui/avatars/${AVATAR_TO_COLOR[id] || "azul"}.webp`;
function TeamSelectCard({ id, selected, taken, onClick }) {
  const a = avatarOf(id);
  return (
    <button className={taken ? "pk-btn" : "pk-btn pk-avacard"} onClick={taken ? undefined : onClick} disabled={taken} aria-label={a.name}
      style={{
        position: "relative", flex: "0 0 auto", width: 152, borderRadius: 20, overflow: "hidden", padding: 0, cursor: taken ? "not-allowed" : "pointer",
        border: selected ? `3px solid ${C.goodHi}` : `3px solid ${taken ? C.line : "rgba(255,255,255,.22)"}`,
        boxShadow: selected
          ? "0 0 26px rgba(95,207,91,.65), 0 10px 22px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.25)"
          : "0 0 16px rgba(132,88,255,.28), 0 8px 18px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.18)",
        transform: selected ? "scale(1.05)" : "scale(1)",
        opacity: taken ? 0.6 : 1, filter: taken ? "grayscale(.85) brightness(.72)" : "saturate(1.1)", background: "#1c1730",
      }}>
      <img src={UI_AVATAR_SRC(id)} alt={a.name} draggable="false" style={{ display: "block", width: "100%", height: "auto" }} />
      {taken && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "rgba(0,0,0,.5)", borderRadius: 12, padding: 9 }}><IconLock size={22} /></span></span>}
      {selected && <span style={{ position: "absolute", top: 8, right: 8, background: C.goodHi, color: "#0a2a0a", borderRadius: 999, width: 27, height: 27, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, boxShadow: "0 2px 6px rgba(0,0,0,.45)" }}>✓</span>}
    </button>
  );
}

function Triangle({ small }) {
  return (
    <span title="Todos juegan" aria-label="Todos juegan" style={{
      display: "inline-flex", alignItems: "center", gap: 6, background: "#1c1630", color: "#fff", borderRadius: 999,
      padding: small ? "2px 8px" : "4px 10px", fontSize: small ? 11 : 13, fontWeight: 800, border: "2px solid rgba(255,255,255,.6)" }}>
      <span style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: `11px solid ${C.gold}` }} />
      Todos juegan
    </span>
  );
}

function Confetti() {
  const cols = ["#F5B429", "#2E8FD4", "#EE7B33", "#5AB44E", "#E24B4B", C.gold];
  const pieces = useMemo(() => Array.from({ length: prefersReduced() ? 0 : 80 }).map((_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2.4 + Math.random() * 1.8, color: cols[i % 6], size: 7 + Math.random() * 8, rot: Math.random() * 360
  })), []);
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 50 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{ position: "absolute", top: 0, left: `${p.left}%`, width: p.size, height: p.size * 1.4, background: p.color, borderRadius: 2, transform: `rotate(${p.rot}deg)`, animation: `pk-fall ${p.dur}s linear ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

const glossy = (bg = C.panel) => ({
  background: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.12)), ${bg}`,
  borderRadius: 18, border: `1px solid ${C.line}`,
  boxShadow: "0 12px 28px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)"
});
const bigBtn = (bg, fg = "#fff", darkShadow = "rgba(0,0,0,.45)") => ({
  background: bg, color: fg, border: "none", borderRadius: 16, padding: "16px 20px", fontSize: 18, fontWeight: 800, width: "100%",
  boxShadow: `0 6px 0 ${darkShadow}, 0 9px 16px rgba(0,0,0,.4)`, transition: "transform .08s"
});

function DataError({ errors }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg2, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...glossy(C.panel), maxWidth: 520, padding: 24 }}>
        <h1 style={{ color: C.dangerHi, marginTop: 0 }}>Error de datos</h1>
        <p style={{ color: C.textSoft }}>No se puede iniciar la partida porque los bancos no cumplen las reglas:</p>
        <ul>{errors.slice(0, 12).map((e, i) => <li key={i}>{e}</li>)}</ul>
      </div>
    </div>
  );
}

/* ---------------- Dado (HUD 2D) ---------------- */
function pipGrid(v) { const f = { 1: [0,0,0,0,1,0,0,0,0], 2: [1,0,0,0,0,0,0,0,1], 3: [1,0,0,0,1,0,0,0,1], 4: [1,0,1,0,0,0,1,0,1], 5: [1,0,1,0,1,0,1,0,1], 6: [1,0,1,1,0,1,1,0,1] }; return f[v] || f[1]; }
function Die({ value, rolling, size = 64 }) {
  return (
    <div aria-label={`Dado: ${value}`} style={{
      width: size, height: size, borderRadius: 14, background: "radial-gradient(circle at 30% 25%,#ffffff,#f4ead2)",
      border: `2px solid ${C.creamDark}`, boxShadow: `0 6px 0 ${C.creamDark}, 0 10px 14px rgba(0,0,0,.5), inset 0 2px 3px rgba(255,255,255,.9)`,
      display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(3,1fr)", placeItems: "center", padding: size * 0.16,
      animation: rolling ? "pk-shake .4s ease-in-out infinite" : "none" }}>
      {pipGrid(value).map((on, i) => <span key={i} style={{ width: size * 0.15, height: size * 0.15, borderRadius: "50%", background: on ? C.onLight : "transparent" }} />)}
    </div>
  );
}

/* Tarjeta de equipo */
function TeamCard({ t, active, leader }) {
  const a = avatarOf(t.avatarId);
  const tc = TEAM_COLORS[t.avatarId] || TEAM_COLORS.zorro;
  return (
    <div style={{ position: "relative", flex: "0 0 auto", minWidth: 168, display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px", borderRadius: 16,
      background: `linear-gradient(120deg, ${tc.card} 0%, #201b38 78%)`,
      border: active ? `2.5px solid ${C.goodHi}` : `2px solid ${tc.main}55`,
      boxShadow: active ? "0 0 16px rgba(95,207,91,.5), 0 6px 14px rgba(0,0,0,.45)" : "0 6px 14px rgba(0,0,0,.4)" }}>
      <AvatarImg id={t.avatarId} size={40} active={active} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontWeight: 900, color: C.text, fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}>
          Equipo {a.name} {leader && <Crown size={16} style={{ marginTop: -2 }} />}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft }}>Posición: {t.position || 0}</div>
      </div>
      {active && <span style={{ position: "absolute", bottom: -9, left: 24, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `9px solid ${C.goodHi}` }} />}
    </div>
  );
}

/* Chip compacto de equipo (para la barra flotante sobre el tablero) */
function TeamChip({ t, active, leader }) {
  const a = avatarOf(t.avatarId);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px", borderRadius: 999, flex: "0 0 auto",
      background: "rgba(20,16,36,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      border: active ? `2px solid ${C.goodHi}` : `1px solid ${C.line}`,
      boxShadow: active ? "0 0 12px rgba(95,207,91,.5)" : "0 2px 6px rgba(0,0,0,.45)",
    }}>
      <AvatarImg id={t.avatarId} size={30} active={active} />
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: C.text, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>{a.name}{leader && <Crown size={12} />}</div>
        <div style={{ fontSize: 10.5, color: C.textSoft }}>Pos {t.position || 0}</div>
      </div>
    </div>
  );
}

/* Barra de pasos */
const STEPS = [["🎲", "Tirar dado"], ["🧩", "Mover avatar"], ["🃏", "Levantar carta"], ["❓", "Elegir opción"], ["🎭", "Mímica"], ["🏆", "Resultado"]];
function StepTracker({ step }) {
  return (
    <div className="pk-scroll" style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", padding: "10px 6px", marginTop: 12, ...glossy(C.panel) }}>
      {STEPS.map(([ic, lb], i) => {
        const on = i + 1 === step; const done = i + 1 < step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 64, opacity: done ? 0.7 : 1 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
                background: on ? C.gold : (done ? C.good : C.panelSoft), boxShadow: on ? "0 0 12px rgba(245,197,24,.6)" : "0 3px 6px rgba(0,0,0,.4)" }}>{ic}</div>
              <span style={{ fontSize: 10, fontWeight: 800, color: on ? C.gold : C.textSoft, textAlign: "center", lineHeight: 1.1 }}>{i + 1} {lb}</span>
            </div>
            {i < STEPS.length - 1 && <span style={{ color: C.muted, fontSize: 14 }}>›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------------- Modales ---------------- */
function Modal({ children, onClose, title, maxW = 560 }) {
  useEffect(() => { const h = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,4,14,.72)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="pk-scroll" style={{ ...glossy(C.panel), maxWidth: maxW, width: "100%", maxHeight: "88vh", overflow: "auto", padding: 22, color: C.text, animation: "pk-in .25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: C.panelSoft, color: C.text, border: `1px solid ${C.line}`, borderRadius: 10, width: 38, height: 38, fontSize: 20, fontWeight: 800 }}>✕</button>
        </div>
        <div style={{ color: C.textSoft, fontSize: 15, lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}
function HowToPlay({ onClose }) {
  const Row = ({ c, t }) => <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
    <span style={{ width: 16, height: 16, clipPath: HEX, background: c, flex: "0 0 auto", marginTop: 3 }} /><span>{t}</span></div>;
  return (
    <Modal onClose={onClose} title="Cómo jugar">
      <p><b>Objetivo:</b> ser el primer equipo en llegar <b>exactamente</b> al casillero 60 y ganar su ronda final de mímica.</p>
      <p style={{ marginTop: 14, fontWeight: 800, color: C.text }}>Los colores</p>
      <Row c={CAT_META.amarillo.hex} t="Amarillo — Persona, lugar o animal" />
      <Row c={CAT_META.azul.hex} t="Azul — Objeto" />
      <Row c={CAT_META.naranja.hex} t="Naranja — Acción" />
      <Row c={CAT_META.verde.hex} t="Verde — Película o serie" />
      <Row c={CAT_META.rojo.hex} t="Rojo — Todos juegan (categoría mixta)" />
      <p style={{ marginTop: 14, fontWeight: 800, color: C.text }}>La carta y el triángulo</p>
      <p>Cada carta muestra <b>dos opciones</b>. El actor elige una. En casilleros de color, una tiene el <b>triángulo ▲ "Todos juegan"</b>; la otra es solo para tu equipo. En casilleros rojos, las dos son "Todos juegan".</p>
      <p style={{ marginTop: 14, fontWeight: 800, color: C.text }}>Rondas</p>
      <p><b>Normal:</b> actúa alguien de tu equipo y solo tu equipo adivina. Si acierta, seguís y tirás de nuevo. Si no, pasa el turno.</p>
      <p><b>Todos juegan:</b> actúa tu equipo pero adivinan todos (el actor no). El primero que acierte gana la ronda y el próximo turno.</p>
      <p style={{ marginTop: 14, fontWeight: 800, color: C.text }}>Tiempo y dado</p>
      <p>Elegís la duración antes de empezar (0:45 a 2:00). 5 segundos de preparación y luego corre el tiempo. Tirás dado digital o cargás un dado físico (1-6). Para ganar hay que caer justo en el 60: si te pasás, <b>rebotás</b>.</p>
      <p style={{ marginTop: 14, fontWeight: 800, color: C.text }}>Ganar en el 60</p>
      <p>Llegar al 60 no te hace ganar: jugás una carta roja final y solo ganás si <b>tu propio equipo</b> adivina primero.</p>
    </Modal>
  );
}

const HBtn = ({ icon, lines, onClick, danger }) => (
  <button className="pk-btn" onClick={onClick} aria-label={lines.join(" ")} title={lines.join(" ")} style={{
    background: danger ? "linear-gradient(180deg,#e24b4b,#a82f2f)" : `linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.15)), ${C.panel}`,
    color: "#fff", border: `1px solid ${danger ? "#7a1f1f" : C.line}`, borderRadius: 12, padding: "5px 10px", minHeight: 46,
    fontWeight: 800, fontSize: 10, lineHeight: 1.15, letterSpacing: 0.4,
    display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
    boxShadow: "0 4px 0 rgba(0,0,0,.4)" }}>
    {icon}
    <span>{lines.map((l, i) => <span key={i} style={{ display: "block" }}>{l}</span>)}</span>
  </button>
);

/* Tablero 3D a pantalla completa (el HUD flota por encima) */
function Board3D({ teams, activeIndex, rolling, dieFace, moving, showDice, overview }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <GameCanvas teams={teams} activeIndex={activeIndex} rolling={rolling} dieFace={dieFace} moving={moving} showDice={showDice} overview={overview} />
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(6,4,14,.78)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const resultBtn = { display: "flex", alignItems: "center", gap: 10, background: C.cream, color: C.onLight, border: `2px solid ${C.creamDark}`, borderRadius: 14, padding: "14px 16px", fontSize: 17, fontWeight: 800, width: "100%" };

function TimerView({ active, card, roundType, secondsLeft, total, onEarly }) {
  const pct = secondsLeft / total; const warn = secondsLeft <= 10; const R = 54, CIRC = 2 * Math.PI * R; const meta = CAT_META[card.category];
  return (
    <div style={overlay}><div style={{ textAlign: "center", maxWidth: 440, width: "100%" }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginBottom: 14 }}>
        <AvatarImg id={active.avatarId} size={38} active />
        <span style={{ background: meta.hex, color: meta.ink, padding: "5px 12px", borderRadius: 999, fontWeight: 800 }}>{CAT_META[card.category].label}</span>
        {roundType !== "normal" && <Triangle small />}
      </div>
      <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto" }}>
        <svg width="220" height="220" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="10" />
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear, stroke .3s", stroke: warn ? "#FF6B6F" : "#B79BFF" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 46, fontWeight: 900, color: warn ? "#FF8A8D" : "#fff", animation: warn ? "pk-pulse .6s infinite" : "none" }}>{fmtTime(secondsLeft)}</div>
          <div style={{ fontSize: 13, color: C.textSoft }}>{roundType === "normal" ? "Solo tu equipo adivina" : "Todos pueden adivinar"}</div>
        </div>
      </div>
      <p style={{ color: C.textSoft, fontSize: 14, margin: "18px 0 12px" }}>Sin hablar, sin sonidos, sin escribir. Solo mímica.</p>
      <button className="pk-btn" onClick={onEarly} style={{ ...bigBtn(C.good, "#fff", "#2f6e3a"), maxWidth: 340, margin: "0 auto" }}>Finalizar ronda antes ✋</button>
    </div></div>
  );
}

/* ============================================================
   APP — orquesta motor + escena 3D + HUD
   ============================================================ */
export default function App() {
  const validation = useMemo(() => validateBank(BANK), []);
  const g = useGameEngine();
  const [soundOn, setSoundOn] = useState(true);
  const [showHow, setShowHow] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [camOverview, setCamOverview] = useState(false);

  useEffect(() => { Sound.setMuted(!soundOn); }, [soundOn]);

  if (!validation.ok) return <div><style>{CSS}</style><DataError errors={validation.errors} /></div>;

  const {
    phase, numTeams, timerDuration, avatarSel, diceType, teams, activeIndex,
    busy, rolling, dieFace, moving, awaitingCard, pendingColor,
    card, choiceIdx, roundType, countdown, secondsLeft,
    canStart, active, leaderIdx, leaderHasLead, step,
    setNumTeams, setTimerDuration, setAvatarSel, pickAvatar,
    goToDiceChoice, startGame, doRollDigital, rollPhysical,
    levantarCarta, jugarCartaFinal, verCarta, selectOption, confirmChoice,
    endRoundEarly, resolve, finalizeGame,
  } = g;

  const doFinalize = () => { setShowEnd(false); setShowHow(false); setCamOverview(false); finalizeGame(); };
  const rollDigital = () => { setCamOverview(false); doRollDigital(); };
  const rollPhys = (n) => { setCamOverview(false); rollPhysical(n); };

  const shell = { minHeight: "100vh", background: `radial-gradient(1000px 600px at 50% -5%, ${C.bg1}, ${C.bg2} 70%)`, color: C.text, fontFamily: '"Segoe UI",system-ui,-apple-system,sans-serif' };
  const wrap = { maxWidth: 980, margin: "0 auto", padding: "14px 12px calc(26px + env(safe-area-inset-bottom))" };
  const meta = card ? CAT_META[card.category] : null;

  /* ---- SETUP ---- */
  if (phase === "setup") {
    const mLabel = { fontWeight: 900, display: "block", fontSize: 17, color: M.text, letterSpacing: 0.2, textShadow: "0 1px 6px rgba(20,10,50,.4)" };
    const mHint = { color: M.muted, fontSize: 12.5, fontWeight: 500 };
    const rise = (i) => ({ animation: `pk-rise .6s cubic-bezier(.2,.8,.3,1) both`, animationDelay: `${0.08 + i * 0.09}s` });
    return (
      <div style={{ position: "relative", minHeight: "100dvh", color: M.text, fontFamily: '"Segoe UI",system-ui,-apple-system,sans-serif' }}><style>{CSS}</style>
        <MenuBackground />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "38px 16px calc(30px + env(safe-area-inset-bottom))", textAlign: "center" }}>
          <div style={rise(0)}><Logo size={1.7} /></div>
          <div style={{ height: 26 }} />

          <div style={{ ...mcard(), padding: 20, marginBottom: 18, textAlign: "left", ...rise(1) }}>
            <label style={{ ...mLabel, marginBottom: 12 }}>Cantidad de equipos</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[2, 3, 4].map(n => { const sel = numTeams === n; return (
                <button key={`${n}-${sel}`} className="pk-btn pk-mbtn" onClick={() => { setNumTeams(n); setAvatarSel(p => p.map((v, i) => i < n ? v : null)); }}
                  style={{ flex: 1, padding: "15px 0", borderRadius: 15, fontWeight: 900, fontSize: 19, ...segBtn(sel), animation: sel ? "pk-selpop .32s ease" : "none" }}>{n}</button>
              ); })}
            </div>
          </div>

          <div style={{ ...mcard(), padding: 20, marginBottom: 18, textAlign: "left", ...rise(2) }}>
            <label style={{ ...mLabel, marginBottom: 12 }}>Dificultad</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {DIFFS_UI.map(d => { const sel = g.difficulty === d.id; return (
                <button key={`${d.id}-${sel}`} className="pk-btn pk-mbtn" disabled={!d.enabled} title={d.enabled ? d.label : "Próximamente"}
                  style={{ flex: "1 1 30%", padding: "13px 6px", borderRadius: 15, fontWeight: 800, position: "relative",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    ...segBtn(sel), color: sel ? "#fff" : (d.enabled ? M.textSoft : M.muted), opacity: d.enabled ? 1 : 0.5, cursor: d.enabled ? "pointer" : "not-allowed",
                    animation: sel ? "pk-selpop .32s ease" : "none" }}>
                  {d.label}{!d.enabled && <IconLock size={11} />}
                </button>); })}
            </div>
            <p style={{ ...mHint, margin: "12px 0 0" }}>Por ahora solo está disponible "Difícil".</p>
          </div>

          <div style={{ ...mcard(), padding: 20, marginBottom: 18, ...rise(3) }}>
            <label style={{ ...mLabel, marginBottom: 14 }}>Tiempo por ronda</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
              <button className="pk-btn pk-mbtn" aria-label="Restar" disabled={timerDuration <= TIMER_MIN} onClick={() => setTimerDuration(t => Math.max(TIMER_MIN, t - TIMER_STEP))}
                style={{ width: 58, height: 58, borderRadius: 17, fontSize: 27, fontWeight: 900, ...segBtn(timerDuration > TIMER_MIN), opacity: timerDuration <= TIMER_MIN ? 0.4 : 1 }}>−</button>
              <div style={{ minWidth: 120 }}><div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: M.text, textShadow: "0 2px 10px rgba(20,10,50,.5)" }}>{fmtTime(timerDuration)}</div><div style={{ ...mHint, marginTop: 2 }}>min : seg</div></div>
              <button className="pk-btn pk-mbtn" aria-label="Sumar" disabled={timerDuration >= TIMER_MAX} onClick={() => setTimerDuration(t => Math.min(TIMER_MAX, t + TIMER_STEP))}
                style={{ width: 58, height: 58, borderRadius: 17, fontSize: 27, fontWeight: 900, ...segBtn(timerDuration < TIMER_MAX), opacity: timerDuration >= TIMER_MAX ? 0.4 : 1 }}>+</button>
            </div>
            <p style={{ ...mHint, margin: "14px 0 0", textAlign: "center" }}>De 0:45 a 2:00, de a 15 segundos.</p>
          </div>

          <div style={{ ...mcard(), padding: 20, marginBottom: 18, textAlign: "left", ...rise(4) }}>
            <label style={{ ...mLabel, marginBottom: 4 }}>Equipos</label>
            <p style={{ ...mHint, margin: "0 0 14px" }}>Elegí un personaje para cada equipo.</p>
            {Array.from({ length: numTeams }).map((_, ti) => (
              <div key={ti} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: M.textSoft, marginBottom: 10, fontWeight: 700 }}>Equipo {ti + 1} {avatarSel[ti] && <span style={{ color: C.goodHi }}>· {avatarOf(avatarSel[ti]).name}</span>}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", padding: "6px 2px 4px" }}>
                  {AVATARS.map(a => { const takenBy = avatarSel.findIndex((v, i) => v === a.id); const mine = avatarSel[ti] === a.id; const taken = takenBy !== -1 && takenBy !== ti; return (
                    <TeamSelectCard key={a.id} id={a.id} selected={mine} taken={taken} onClick={() => pickAvatar(ti, a.id)} />
                  ); })}
                </div>
              </div>
            ))}
          </div>

          <button className="pk-btn pk-start" onClick={goToDiceChoice} disabled={!canStart} style={{
            width: "100%", borderRadius: 18, padding: "17px 20px", fontSize: 19, fontWeight: 900, letterSpacing: 0.3, marginBottom: 12, marginTop: 4,
            border: canStart ? "1px solid rgba(255,255,255,.55)" : "1px solid rgba(255,255,255,.1)",
            background: canStart ? "linear-gradient(180deg,#8458FF,#6F49E8)" : "rgba(255,255,255,0.06)",
            color: canStart ? "#fff" : M.muted, cursor: canStart ? "pointer" : "not-allowed",
            boxShadow: canStart ? "0 8px 22px rgba(132,88,255,.5), inset 0 1px 0 rgba(255,255,255,.4)" : "inset 0 1px 0 rgba(255,255,255,.06)",
            animation: canStart ? "pk-startglow 2.4s ease-in-out infinite" : "none", ...rise(5) }}>Comenzar partida</button>
          <div style={{ display: "flex", gap: 10, ...rise(5) }}>
            <button className="pk-btn pk-mbtn" onClick={() => setShowHow(true)} style={{ flex: 1, borderRadius: 16, padding: "15px 16px", fontSize: 16, fontWeight: 800, color: M.text, ...segBtn(false) }}>Cómo jugar</button>
            <button className="pk-btn pk-mbtn" onClick={() => setSoundOn(s => !s)} aria-label="Sonido" style={{ flex: "0 0 60px", borderRadius: 16, ...segBtn(false), display: "flex", alignItems: "center", justifyContent: "center" }}><IconSound on={soundOn} size={24} /></button>
          </div>
          {!canStart && <p style={{ ...mHint, marginTop: 12 }}>Elegí cantidad de equipos y un avatar único para cada uno.</p>}
        </div>
        {showHow && <HowToPlay onClose={() => setShowHow(false)} />}
      </div>
    );
  }

  /* ---- ELECCIÓN DE DADO ---- */
  if (phase === "dicechoice") {
    const rise = (i) => ({ animation: `pk-rise .6s cubic-bezier(.2,.8,.3,1) both`, animationDelay: `${0.08 + i * 0.1}s` });
    const choiceCard = (grad, glowCol, icon, title, desc, onClick, i) => (
      <button className="pk-btn pk-mbtn" onClick={onClick} style={{
        background: grad, border: "1px solid rgba(255,255,255,.5)", borderRadius: 22, padding: "24px 16px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        boxShadow: `0 12px 26px ${glowCol}, inset 0 1px 0 rgba(255,255,255,.4)`, ...rise(i) }}>
        <div style={{ fontSize: 44, filter: "drop-shadow(0 3px 5px rgba(0,0,0,.4))" }}>{icon}</div>
        <div style={{ fontWeight: 900, color: "#fff", fontSize: 20, textAlign: "center", lineHeight: 1.1, textShadow: "0 1px 6px rgba(0,0,0,.35)" }}>{title}</div>
        <div style={{ color: "rgba(255,255,255,.9)", fontSize: 13, textAlign: "center", lineHeight: 1.35 }}>{desc}</div>
      </button>
    );
    return (
      <div style={{ position: "relative", minHeight: "100dvh", color: M.text, fontFamily: '"Segoe UI",system-ui,-apple-system,sans-serif' }}><style>{CSS}</style>
        <MenuBackground />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 460, margin: "0 auto", padding: "46px 16px calc(30px + env(safe-area-inset-bottom))", textAlign: "center" }}>
          <div style={rise(0)}><Logo size={1.4} /></div>
          <h2 style={{ margin: "30px 0 6px", fontSize: 25, fontWeight: 900, color: M.text, textShadow: "0 2px 10px rgba(20,10,50,.5)", ...rise(1) }}>¿Con qué dado van a jugar?</h2>
          <p style={{ color: M.textSoft, marginTop: 0, marginBottom: 24, ...rise(1) }}>Se usa el mismo durante toda la partida.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {choiceCard("linear-gradient(180deg,#8458FF,#6F49E8)", "rgba(132,88,255,.5)", "🎲", "Dado digital", "La app tira el dado por ustedes.", () => startGame("digital"), 2)}
            {choiceCard("linear-gradient(180deg,#3E9BE0,#2E7FD0)", "rgba(46,127,208,.5)", "🎲", "Dado físico", "Tiran su dado y cargan el número.", () => startGame("fisico"), 3)}
          </div>
          <button className="pk-btn pk-mbtn" onClick={g.backToSetup} style={{ width: "100%", marginTop: 18, borderRadius: 16, padding: "15px 16px", fontSize: 16, fontWeight: 800, color: M.text, ...segBtn(false), ...rise(4) }}>Volver</button>
        </div>
      </div>
    );
  }

  /* ---- VICTORIA ---- */
  if (phase === "victory") {
    return (
      <div style={shell}><style>{CSS}</style><Confetti />
        <div style={{ ...wrap, maxWidth: 640, padding: "48px 12px calc(26px + env(safe-area-inset-bottom))", textAlign: "center", position: "relative", zIndex: 55 }}>
          <Logo size={0.85} banner={false} />
          <div style={{ marginTop: 34, animation: "pk-pop .5s ease" }}><AvatarImg id={active.avatarId} size={130} crown /></div>
          <h1 style={{ fontSize: 34, margin: "14px 0 4px", color: C.gold }}>¡Equipo {avatarOf(active.avatarId).name} gana!</h1>
          <p style={{ color: C.textSoft, fontSize: 16, marginBottom: 26 }}>Llegó al 60 y adivinó su carta final.</p>
          <button className="pk-btn" onClick={doFinalize} style={{ ...bigBtn(C.purple, "#fff", C.purpleDark), maxWidth: 340, margin: "0 auto" }}>Nueva partida</button>
        </div>
      </div>
    );
  }

  /* ---- JUEGO ---- */
  return (
    <div style={{ position: "relative", width: "100%", height: "100dvh", overflow: "hidden", background: C.bg2, color: C.text, fontFamily: '"Segoe UI",system-ui,-apple-system,sans-serif' }}>
      <style>{CSS}</style>

      {/* TABLERO a pantalla completa (elemento principal) */}
      <Board3D teams={teams} activeIndex={activeIndex} rolling={rolling} dieFace={dieFace} moving={moving} showDice={phase === "board" && !moving && (rolling || busy)} overview={camOverview} />

      {/* BARRA SUPERIOR flotante: sonido + chips (izq) · logo + cámara (der) */}
      <div style={{ position: "absolute", top: "calc(8px + env(safe-area-inset-top))", left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, pointerEvents: "none", zIndex: 6 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", minWidth: 0, pointerEvents: "auto" }}>
          <button className="pk-btn" onClick={() => setSoundOn(s => !s)} aria-label="Sonido" style={{ background: "rgba(20,16,36,.72)", backdropFilter: "blur(6px)", border: `1px solid ${C.line}`, borderRadius: 12, width: 42, height: 42, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 6px rgba(0,0,0,.4)" }}><IconSound on={soundOn} size={20} /></button>
          <div className="pk-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "56vw", paddingBottom: 2 }}>
            {teams.map((t, i) => <TeamChip key={i} t={t} active={i === activeIndex} leader={leaderHasLead && i === leaderIdx} />)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", pointerEvents: "auto", flex: "0 0 auto" }}>
          <img src="/logo.webp" alt="Pictionahse" style={{ width: 88, height: "auto", display: "block", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.55))" }} />
          <button className="pk-btn" onClick={() => setCamOverview(true)} aria-label="Vista general" title="Vista general del tablero" style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.line}`, background: camOverview ? C.purple : "rgba(20,16,36,.72)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 6px rgba(0,0,0,.4)" }}><IconCamera size={20} /></button>
        </div>
      </div>

      {/* CÓMO JUGAR / FINALIZAR (esquina inferior izquierda) */}
      <div style={{ position: "absolute", bottom: "calc(10px + env(safe-area-inset-bottom))", left: 10, display: "flex", flexDirection: "column", gap: 6, pointerEvents: "auto", zIndex: 7 }}>
        <button className="pk-btn" onClick={() => setShowEnd(true)} aria-label="Finalizar partida" title="Finalizar partida" style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid #7a1f1f", background: "linear-gradient(180deg,#e24b4b,#a82f2f)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 6px rgba(0,0,0,.4)" }}><IconFlag size={18} /></button>
        <button className="pk-btn" onClick={() => setShowHow(true)} aria-label="Cómo jugar" title="Cómo jugar" style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${C.line}`, background: "rgba(20,16,36,.72)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 6px rgba(0,0,0,.4)" }}><IconBook size={18} /></button>
      </div>

      {/* ZONA DE ACCIÓN flotante (abajo, centrada) */}
      <div style={{ position: "absolute", bottom: "calc(10px + env(safe-area-inset-bottom))", left: 64, right: 10, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 5 }}>
        <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 400 }}>
          {phase === "board" && active.position === 60 && !awaitingCard && (
            <button className="pk-btn" onClick={jugarCartaFinal} style={{ ...bigBtn(CAT_META.rojo.hex, "#fff", CAT_META.rojo.dark), display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px" }}><IconFlag size={18} /> Jugar carta final</button>
          )}
          {phase === "board" && active.position !== 60 && !awaitingCard && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 900, fontSize: 14, margin: "0 0 6px", color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.8)" }}><span style={{ color: C.goodHi }}>‹</span> Equipo {avatarOf(active.avatarId).name}, te toca <span style={{ color: C.goodHi }}>›</span></p>
              {diceType === "fisico" ? (
                <div style={{ ...glossy(C.blue), padding: "10px 10px", border: "none", boxShadow: `0 5px 0 ${C.blueDark}, 0 8px 14px rgba(0,0,0,.45)` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button key={n} disabled={busy || moving} onClick={() => rollPhys(n)} className="pk-btn" style={{ padding: "10px 0", fontSize: 19, fontWeight: 900, borderRadius: 10, border: "none", background: "rgba(255,255,255,.94)", color: C.onLight, boxShadow: "0 3px 0 rgba(0,0,0,.3)", opacity: busy ? 0.6 : 1 }}>{n}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <button className="pk-btn" disabled={busy || moving} onClick={rollDigital} style={{ background: "linear-gradient(180deg,#8458FF,#6F49E8)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: busy ? 0.7 : 1, border: "1px solid rgba(255,255,255,.5)", boxShadow: "0 5px 0 #573bb0, 0 8px 14px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.35)", width: "100%" }}>
                  <span style={{ fontWeight: 900, color: "#fff", fontSize: 19, letterSpacing: 0.5 }}>TIRAR DADO</span>
                  <Die value={dieFace} rolling={rolling} size={48} />
                </button>
              )}
            </div>
          )}
          {phase === "board" && awaitingCard && pendingColor && (
            <button className="pk-btn" onClick={levantarCarta} style={{ ...bigBtn(CAT_META[pendingColor].hex, CAT_META[pendingColor].ink, CAT_META[pendingColor].dark), display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", animation: "pk-in .3s ease" }}><IconCard size={20} /> Levantar carta</button>
          )}
        </div>
      </div>

      {/* OVERLAYS */}
      {(phase === "reveal" || phase === "options") && (
        <div style={overlay}><div style={{ maxWidth: 440, width: "100%", textAlign: "center", animation: "pk-in .3s ease" }}>
          {phase === "reveal" ? (
            <p style={{ color: C.textSoft, margin: "0 0 2px" }}>Turno de <b style={{ color: C.text }}>{avatarOf(active.avatarId).name}</b> — que mire <b>solo el actor</b>.</p>
          ) : (
            <p style={{ color: C.textSoft, margin: "0 0 2px", fontSize: 14 }}>Tocá en la carta la opción que vas a representar:</p>
          )}
          <CardStage card={card} flipped={phase === "options"} onSelect={phase === "options" ? selectOption : null} height={460} />
          {phase === "reveal" && (
            <button className="pk-btn" onClick={verCarta} style={{ ...bigBtn(C.purple, "#fff", C.purpleDark), maxWidth: 340, margin: "4px auto 0" }}>Ver carta 👀</button>
          )}
        </div></div>
      )}

      {phase === "confirm" && (
        <div style={overlay}><div style={{ ...glossy(C.panel), padding: 24, maxWidth: 440, width: "100%", textAlign: "center", animation: "pk-in .3s" }}>
          <p style={{ color: C.textSoft, marginTop: 0 }}>Vas a representar:</p>
          <div style={{ background: C.cream, color: C.onLight, borderRadius: 16, padding: "20px 14px", margin: "6px 0 14px", border: `3px solid ${meta.hex}`, boxShadow: `0 7px 0 ${meta.dark}` }}><div style={{ fontSize: 24, fontWeight: 900 }}>{card.options[choiceIdx].text}</div></div>
          <div style={{ marginBottom: 18 }}>{(card.isFinal || card.isRed || card.options[choiceIdx].allPlay) ? <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Triangle />{card.isFinal && <b style={{ color: CAT_META.rojo.hex }}>· Ronda final</b>}</div> : <span style={{ background: C.panelSoft, padding: "6px 12px", borderRadius: 999, fontWeight: 800, color: C.text, border: `1px solid ${C.line}` }}>Ronda normal · solo tu equipo</span>}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="pk-btn" onClick={g.backToOptions} style={{ ...bigBtn(C.cream, C.onLight, C.creamDark), fontSize: 16 }}>Volver</button>
            <button className="pk-btn" onClick={confirmChoice} style={bigBtn(C.good, "#fff", "#2f6e3a")}>Confirmar</button>
          </div>
        </div></div>
      )}

      {phase === "countdown" && (
        <div style={overlay}><div style={{ textAlign: "center" }}>
          <p style={{ color: C.textSoft, marginBottom: 8 }}>¡Prepárate para actuar!</p>
          <div key={countdown} style={{ fontSize: 120, fontWeight: 900, color: "#fff", textShadow: `0 0 24px ${C.purple}`, animation: "pk-pop .4s ease", lineHeight: 1 }}>{countdown}</div>
        </div></div>
      )}

      {phase === "timer" && <TimerView active={active} card={card} roundType={roundType} secondsLeft={secondsLeft} total={timerDuration} onEarly={endRoundEarly} />}

      {phase === "result" && (
        <div style={overlay}><div style={{ ...glossy(C.panel), padding: 24, maxWidth: 460, width: "100%", textAlign: "center", animation: "pk-in .3s" }}>
          <p style={{ color: C.textSoft, marginTop: 0 }}>La palabra era:</p>
          <div style={{ background: C.cream, color: C.onLight, borderRadius: 16, padding: "18px 14px", margin: "6px 0 16px", border: `3px solid ${meta.hex}`, boxShadow: `0 7px 0 ${meta.dark}` }}><div style={{ fontSize: 24, fontWeight: 900 }}>{card.options[choiceIdx].text}</div></div>
          <p style={{ fontWeight: 800, marginBottom: 12 }}>¿Quién adivinó?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {roundType === "normal" ? (
              <button className="pk-btn" onClick={() => resolve(activeIndex)} style={resultBtn}><AvatarImg id={active.avatarId} size={30} /> Adivinó {avatarOf(active.avatarId).name}</button>
            ) : (
              teams.map((t, i) => (
                <button key={i} className="pk-btn" onClick={() => resolve(i)} style={{ ...resultBtn, borderColor: (roundType === "final" && i === activeIndex) ? C.gold : C.creamDark }}>
                  <AvatarImg id={t.avatarId} size={30} /> Adivinó {avatarOf(t.avatarId).name}{roundType === "final" && i === activeIndex && <span style={{ marginLeft: "auto", fontSize: 12, color: "#b8860b", fontWeight: 800 }}>¡GANA!</span>}
                </button>
              ))
            )}
            <button className="pk-btn" onClick={() => resolve(null)} style={{ ...resultBtn, background: C.panelSoft, color: C.text, border: `2px solid ${C.line}` }}>Nadie adivinó</button>
          </div>
        </div></div>
      )}

      {showHow && <HowToPlay onClose={() => setShowHow(false)} />}
      {showEnd && (
        <Modal onClose={() => setShowEnd(false)} title="Finalizar partida" maxW={420}>
          <p>Se va a perder la partida actual. No se guarda nada.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="pk-btn" onClick={() => setShowEnd(false)} style={{ ...bigBtn(C.cream, C.onLight, C.creamDark), fontSize: 16 }}>Continuar jugando</button>
            <button className="pk-btn" onClick={doFinalize} style={bigBtn(C.dangerHi, "#fff", C.danger)}>Sí, finalizar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
