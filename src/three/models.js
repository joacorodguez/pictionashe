/* ============================================================
   RUTAS DE MODELOS 3D + precarga
   Los GLB optimizados viven en /public/models (Vite los sirve
   en la raíz). Compresión meshopt + texturas WebP: drei los
   decodifica localmente, sin depender de CDNs.
   ============================================================ */
import { useGLTF } from "@react-three/drei";

export const MODELS = {
  tile: "/models/tile.glb",
  ground: "/models/ground.glb",
  card: "/models/game-card.glb",
  dice: "/models/dice.glb",
  avatar: {
    azul: "/models/avatar-azul.glb",
    naranja: "/models/avatar-naranja.glb",
    rojo: "/models/avatar-rojo.glb",
    verde: "/models/avatar-verde.glb",
  },
};

/* Mapeo equipo (color de la ficha) → modelo. Los avatares son
   piezas de color genéricas (decisión de diseño). */
export const TEAM_MODEL = MODELS.avatar;

/* El HUD identifica a los equipos por animal (zorro/panda/leon/buho),
   pero los modelos 3D son piezas de color. Mapeo animal → color de ficha.
   (El búho, violeta en el HUD, usa la ficha roja: no hay ficha violeta.) */
export const AVATAR_TO_COLOR = { zorro: "naranja", panda: "verde", leon: "azul", buho: "rojo" };
export const modelForAvatar = (avatarId) => MODELS.avatar[AVATAR_TO_COLOR[avatarId]] || MODELS.avatar.azul;

export const ALL_MODEL_URLS = [
  MODELS.tile, MODELS.ground, MODELS.card, MODELS.dice,
  ...Object.values(MODELS.avatar),
];

/* Precarga para que el primer render sea inmediato. */
export function preloadAllModels() {
  ALL_MODEL_URLS.forEach((url) => useGLTF.preload(url));
}
