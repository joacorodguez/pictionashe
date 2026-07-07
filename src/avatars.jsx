import React from "react";

/* ============================================================
   ARTE SVG — avatares (fichas 3D sobre pedestal), corona, etc.
   Nada de emojis: todo dibujado a mano en SVG.
   ============================================================ */

export const TEAM_COLORS = {
  zorro: { main: "#E8641F", dark: "#9C3F0C", light: "#FF8A45", card: "#7A3D14" },
  panda: { main: "#58A83C", dark: "#376F24", light: "#7BCF5C", card: "#2C4A22" },
  leon:  { main: "#2E7FD0", dark: "#1C5490", light: "#5AA4E8", card: "#173D63" },
  buho:  { main: "#7A3FBF", dark: "#522683", light: "#A06BE0", card: "#3D2360" },
};

// Los avatares son fichas de color (no animales): nombres definitivos por color.
export const AVATARS = [
  { id: "zorro", name: "Naranja" },
  { id: "panda", name: "Verde" },
  { id: "leon",  name: "Azul" },
  { id: "buho",  name: "Rojo" },
];
export const avatarOf = (id) => AVATARS.find((a) => a.id === id) || AVATARS[0];

/* ---- Corona dorada (logo, líder, victoria) ---- */
export function Crown({ size = 28, style }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 64 46" style={style} aria-hidden>
      <defs>
        <linearGradient id="crownG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE27A" />
          <stop offset="0.55" stopColor="#F5C518" />
          <stop offset="1" stopColor="#D89B0D" />
        </linearGradient>
      </defs>
      <path d="M6 36 L4 12 L19 24 L32 5 L45 24 L60 12 L58 36 Z" fill="url(#crownG)" stroke="#8A5E06" strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="6" y="35" width="52" height="7" rx="3" fill="url(#crownG)" stroke="#8A5E06" strokeWidth="2" />
      <circle cx="4" cy="11" r="3.4" fill="#FFE27A" stroke="#8A5E06" strokeWidth="1.6" />
      <circle cx="32" cy="5" r="3.8" fill="#FFE27A" stroke="#8A5E06" strokeWidth="1.6" />
      <circle cx="60" cy="11" r="3.4" fill="#FFE27A" stroke="#8A5E06" strokeWidth="1.6" />
      <circle cx="32" cy="38" r="2.6" fill="#B9455B" stroke="#8A5E06" strokeWidth="1.2" />
    </svg>
  );
}

/* ---- Pedestal (disco 3D del color del equipo) ---- */
function Pedestal({ color }) {
  const c = TEAM_COLORS[color] || TEAM_COLORS.zorro;
  return (
    <g>
      <ellipse cx="60" cy="120" rx="44" ry="13" fill="rgba(0,0,0,.35)" />
      <path d="M17 106 L17 116 A43 13 0 0 0 103 116 L103 106 Z" fill={c.dark} />
      <ellipse cx="60" cy="106" rx="43" ry="13" fill={c.main} />
      <ellipse cx="60" cy="105" rx="34" ry="9.5" fill={c.light} opacity="0.55" />
      <ellipse cx="60" cy="105.5" rx="30" ry="8" fill={c.main} />
    </g>
  );
}

/* ---- Animales (cabeza + cuerpo, estilo figurita) ---- */
function Fox() {
  return (
    <g>
      {/* cola */}
      <path d="M92 92 Q112 84 106 64 Q118 86 100 100 Z" fill="#E8712C" />
      <path d="M104 68 Q112 80 100 92 Q110 78 102 70 Z" fill="#FFF1DF" />
      {/* cuerpo */}
      <ellipse cx="60" cy="90" rx="25" ry="21" fill="#EF7C2F" />
      <ellipse cx="60" cy="94" rx="14" ry="14" fill="#FFEBD2" />
      {/* orejas */}
      <polygon points="33,42 40,8 57,32" fill="#EF7C2F" />
      <polygon points="38,38 42,16 52,31" fill="#7C3A10" />
      <polygon points="87,42 80,8 63,32" fill="#EF7C2F" />
      <polygon points="82,38 78,16 68,31" fill="#7C3A10" />
      {/* cabeza */}
      <circle cx="60" cy="52" r="27" fill="#F1832F" />
      <ellipse cx="45" cy="64" rx="13" ry="11" fill="#FFF1DF" />
      <ellipse cx="75" cy="64" rx="13" ry="11" fill="#FFF1DF" />
      <ellipse cx="60" cy="66" rx="10" ry="8" fill="#FFF1DF" />
      {/* ojos */}
      <circle cx="48" cy="48" r="5" fill="#241407" />
      <circle cx="72" cy="48" r="5" fill="#241407" />
      <circle cx="49.8" cy="46.2" r="1.7" fill="#fff" />
      <circle cx="73.8" cy="46.2" r="1.7" fill="#fff" />
      {/* nariz + boca */}
      <ellipse cx="60" cy="61" rx="5.4" ry="4.2" fill="#241407" />
      <path d="M60 65 Q60 70 54 71 M60 65 Q60 70 66 71" stroke="#241407" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Panda() {
  return (
    <g>
      {/* cuerpo */}
      <ellipse cx="60" cy="90" rx="26" ry="21" fill="#FAFAF7" />
      <ellipse cx="38" cy="88" rx="9" ry="15" fill="#2A2A2E" transform="rotate(18 38 88)" />
      <ellipse cx="82" cy="88" rx="9" ry="15" fill="#2A2A2E" transform="rotate(-18 82 88)" />
      <ellipse cx="60" cy="95" rx="14" ry="12" fill="#FFFFFF" />
      {/* orejas */}
      <circle cx="38" cy="27" r="11" fill="#2A2A2E" />
      <circle cx="82" cy="27" r="11" fill="#2A2A2E" />
      <circle cx="38" cy="27" r="5" fill="#4A4A50" />
      <circle cx="82" cy="27" r="5" fill="#4A4A50" />
      {/* cabeza */}
      <circle cx="60" cy="50" r="28" fill="#FBFBF8" />
      {/* parches */}
      <ellipse cx="47" cy="48" rx="8.5" ry="11" fill="#2A2A2E" transform="rotate(-14 47 48)" />
      <ellipse cx="73" cy="48" rx="8.5" ry="11" fill="#2A2A2E" transform="rotate(14 73 48)" />
      <circle cx="48.5" cy="47" r="3.4" fill="#fff" />
      <circle cx="71.5" cy="47" r="3.4" fill="#fff" />
      <circle cx="49" cy="47.5" r="1.7" fill="#111" />
      <circle cx="71" cy="47.5" r="1.7" fill="#111" />
      {/* nariz + boca */}
      <ellipse cx="60" cy="62" rx="4.6" ry="3.6" fill="#2A2A2E" />
      <path d="M60 65 Q60 70 54 70 M60 65 Q60 70 66 70" stroke="#2A2A2E" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Lion() {
  return (
    <g>
      {/* cuerpo */}
      <ellipse cx="60" cy="92" rx="24" ry="19" fill="#F3A93C" />
      <ellipse cx="60" cy="96" rx="13" ry="12" fill="#FCDCA4" />
      {/* melena (picos) */}
      <g fill="#A8571B">
        <circle cx="60" cy="20" r="10" />
        <circle cx="42" cy="24" r="10" />
        <circle cx="78" cy="24" r="10" />
        <circle cx="30" cy="38" r="10" />
        <circle cx="90" cy="38" r="10" />
        <circle cx="26" cy="55" r="10" />
        <circle cx="94" cy="55" r="10" />
        <circle cx="32" cy="70" r="10" />
        <circle cx="88" cy="70" r="10" />
        <circle cx="46" cy="78" r="10" />
        <circle cx="74" cy="78" r="10" />
        <circle cx="60" cy="50" r="33" />
      </g>
      {/* orejas */}
      <circle cx="38" cy="27" r="7.5" fill="#F3A93C" />
      <circle cx="82" cy="27" r="7.5" fill="#F3A93C" />
      {/* cabeza */}
      <circle cx="60" cy="50" r="24" fill="#F5B14A" />
      <ellipse cx="60" cy="61" rx="13" ry="10" fill="#FCDCA4" />
      {/* ojos */}
      <circle cx="50" cy="46" r="4.6" fill="#3A1F05" />
      <circle cx="70" cy="46" r="4.6" fill="#3A1F05" />
      <circle cx="51.6" cy="44.4" r="1.6" fill="#fff" />
      <circle cx="71.6" cy="44.4" r="1.6" fill="#fff" />
      {/* nariz + boca */}
      <path d="M55 55 L65 55 L60 61 Z" fill="#7C4212" />
      <path d="M60 61 Q60 66 54 67 M60 61 Q60 66 66 67" stroke="#7C4212" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Owl() {
  return (
    <g>
      {/* penachos */}
      <path d="M34 26 Q30 8 44 14 L48 24 Z" fill="#5E3794" />
      <path d="M86 26 Q90 8 76 14 L72 24 Z" fill="#5E3794" />
      {/* alas */}
      <ellipse cx="32" cy="76" rx="10" ry="22" fill="#5E3794" transform="rotate(12 32 76)" />
      <ellipse cx="88" cy="76" rx="10" ry="22" fill="#5E3794" transform="rotate(-12 88 76)" />
      {/* cuerpo */}
      <ellipse cx="60" cy="64" rx="30" ry="42" fill="#7C4FB0" />
      {/* panza con plumitas */}
      <ellipse cx="60" cy="86" rx="18" ry="18" fill="#9B72C8" />
      <path d="M48 82 q6 6 12 0 q6 6 12 0 M50 92 q5 5 10 0 q5 5 10 0" stroke="#7C4FB0" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* cara */}
      <circle cx="46" cy="46" r="14" fill="#EFE3F9" />
      <circle cx="74" cy="46" r="14" fill="#EFE3F9" />
      <circle cx="46" cy="46" r="8" fill="#F5C518" />
      <circle cx="74" cy="46" r="8" fill="#F5C518" />
      <circle cx="46" cy="46" r="4" fill="#1B1024" />
      <circle cx="74" cy="46" r="4" fill="#1B1024" />
      <circle cx="47.8" cy="44.2" r="1.5" fill="#fff" />
      <circle cx="75.8" cy="44.2" r="1.5" fill="#fff" />
      {/* pico */}
      <path d="M54 56 L66 56 L60 66 Z" fill="#F2A61C" />
      {/* patas */}
      <path d="M48 104 l-3 6 M48 104 l0 7 M48 104 l3 6" stroke="#F2A61C" strokeWidth="3" strokeLinecap="round" />
      <path d="M72 104 l-3 6 M72 104 l0 7 M72 104 l3 6" stroke="#F2A61C" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

const ART = { zorro: Fox, panda: Panda, leon: Lion, buho: Owl };

/* Contenido SVG de la ficha completa (animal + pedestal), viewBox 0 0 120 136 */
export function TokenArt({ id, active }) {
  const Animal = ART[id] || Fox;
  return (
    <g>
      {active && <ellipse cx="60" cy="118" rx="52" ry="16" fill="#5FCF5B" opacity="0.45" />}
      <Pedestal color={id} />
      <g transform="translate(0,-6)"><Animal /></g>
    </g>
  );
}

/* Ficha como elemento HTML independiente */
export function Avatar({ id, size = 40, active = false, dim = false, crown = false, style }) {
  const a = avatarOf(id);
  return (
    <span
      role="img"
      aria-label={`Equipo ${a.name}`}
      title={`Equipo ${a.name}`}
      style={{
        display: "inline-flex",
        width: size,
        height: size * 1.13,
        opacity: dim ? 0.45 : 1,
        filter: dim ? "grayscale(1)" : active ? "drop-shadow(0 0 8px rgba(95,207,91,.8))" : "drop-shadow(0 3px 4px rgba(0,0,0,.5))",
        position: "relative",
        flex: "0 0 auto",
        ...style,
      }}
    >
      <svg viewBox="0 0 120 136" width="100%" height="100%">
        <TokenArt id={id} active={active} />
      </svg>
      {crown && (
        <Crown size={size * 0.5} style={{ position: "absolute", top: -size * 0.22, left: "50%", transform: "translateX(-50%) rotate(-8deg)" }} />
      )}
    </span>
  );
}

/* Cabeza sola (para medallones chicos), viewBox 0 0 120 112 */
export function HeadBadge({ id, size = 34, ring = "#fff", style }) {
  const Animal = ART[id] || Fox;
  const c = TEAM_COLORS[id] || TEAM_COLORS.zorro;
  return (
    <span style={{ display: "inline-flex", width: size, height: size, flex: "0 0 auto", ...style }} aria-hidden>
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
          <clipPath id={`hb-${id}`}><circle cx="60" cy="60" r="56" /></clipPath>
        </defs>
        <circle cx="60" cy="60" r="58" fill={c.dark} />
        <circle cx="60" cy="60" r="56" fill={c.main} />
        <g clipPath={`url(#hb-${id})`}>
          <g transform="translate(0,14) scale(1)"><Animal /></g>
        </g>
        <circle cx="60" cy="60" r="56" fill="none" stroke={ring} strokeWidth="4" opacity="0.85" />
      </svg>
    </span>
  );
}
