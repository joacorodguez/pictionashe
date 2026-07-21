/* ============================================================
   CONSTANTES Y HELPERS COMPARTIDOS
   Datos puros usados tanto por la lógica (useGameEngine) como
   por la presentación (HUD 2D y escena 3D). Sin JSX ni estado.
   ============================================================ */

export const CATS = ["amarillo", "azul", "naranja", "verde", "rojo"];
export const TARGET_PER_CAT = 100;

export const DIFFS_UI = [
  { id: "normal", label: "Normal", enabled: true },
  { id: "dificil", label: "Difícil", enabled: true },
];

/* Metadatos de cada categoría de color. `hex/light/dark` sirven
   tanto para el CSS del HUD como para los materiales 3D. */
export const CAT_META = {
  amarillo: { hex: "#F5B429", light: "#FFD35E", dark: "#B8811A", ink: "#5a3e00", label: "Persona, lugar o animal", short: "Persona/lugar" },
  azul:     { hex: "#2E8FD4", light: "#63B4EE", dark: "#1E6499", ink: "#04283f", label: "Objeto", short: "Objeto" },
  naranja:  { hex: "#EE7B33", light: "#FF9E58", dark: "#B4551E", ink: "#3f1900", label: "Acción", short: "Acción" },
  verde:    { hex: "#5AB44E", light: "#82D873", dark: "#3B7E33", ink: "#0c2a09", label: "Película o serie", short: "Película" },
  rojo:     { hex: "#E24B4B", light: "#F27575", dark: "#A82F2F", ink: "#3d0202", label: "Todos juegan · Mix", short: "Mix ▲" },
};

/* Patrón de colores del tablero: se repite en ciclo. El 60 cae en rojo. */
export const BOARD_ORDER = ["amarillo", "azul", "naranja", "verde", "rojo"];
export const colorAt = (n) => BOARD_ORDER[(n - 1) % 5];

export const TIMER_MIN = 45, TIMER_MAX = 120, TIMER_STEP = 15, TIMER_DEFAULT = 60;
export const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* utilidades */
export const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
export const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const prefersReduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Valida el banco de palabras al montar la app. */
/* Valida la estructura de bancos por dificultad: { normal:{...}, dificil:{...} }.
   Bloquea solo por problemas estructurales (categoría faltante, <2 opciones,
   vacías o duplicadas dentro de una misma categoría). */
export function validateBank(BANKS) {
  const errors = [];
  for (const diff of Object.keys(BANKS || {})) {
    for (const c of CATS) {
      const arr = BANKS[diff] && BANKS[diff][c];
      if (!Array.isArray(arr) || arr.length < 2) { errors.push(`${diff}/${c}: faltan opciones (mínimo 2)`); continue; }
      const seen = new Set();
      arr.forEach(opt => {
        if (!opt || !opt.trim()) errors.push(`Opción vacía en ${diff}/${c}`);
        const n = norm(opt);
        if (seen.has(n)) errors.push(`Duplicada en ${diff}/${c}: "${opt}"`); else seen.add(n);
      });
    }
  }
  return { ok: errors.length === 0, errors, total: 0 };
}
