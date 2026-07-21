import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { buildBoardLayout, CELL } from "./boardLayout.js";

/* ============================================================
   ENTORNO (Etapa 4) — escena tal cual del archivo del usuario
   (envoirment3.0.glb): mesa de juego con sus objetos + living
   (sofá, planta, lámpara, mesita) + piso. NO se recompone nada:
   se usa la distribución original del GLB. Sólo se rota el conjunto
   para que el living quede al fondo y se escala/centra la MESA
   debajo del tablero (tapa a y=0), para que el tablero quede
   apoyado exactamente en el centro de la mesa.
   ============================================================ */

import envUrl from "../../assets/environment/envoirment3.0.glb";

const ENV_ROT_Y = -Math.PI / 2;   // lleva el living al fondo (-z), detrás del tablero
const MARGIN = 5;                  // aire entre el tablero y el borde corto de la mesa

/* Veta de madera cálida y realista para la mesa (tablas + variación de tono
   + fibra + reflejos suaves). Acabado satinado, sin reflejos exagerados. */
function makeTableWoodTexture() {
  const W = 1024, H = 512; const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const planks = 5, ph = H / planks;
  const tones = ["#6b4a2b", "#5e4126", "#734f2e", "#664630", "#7a5636"];
  for (let p = 0; p < planks; p++) {
    const py = p * ph;
    const bg = x.createLinearGradient(0, py, W, py + ph);
    bg.addColorStop(0, tones[p % tones.length]); bg.addColorStop(1, tones[(p + 2) % tones.length]);
    x.fillStyle = bg; x.fillRect(0, py, W, ph);
    // vetas longitudinales onduladas
    for (let i = 0; i < 44; i++) {
      const y = py + Math.random() * ph, amp = 2 + Math.random() * 5, a = 0.06 + Math.random() * 0.16;
      x.beginPath(); x.moveTo(0, y);
      for (let px = 0; px <= W; px += 16) x.lineTo(px, y + Math.sin(px * 0.012 + i) * amp);
      x.lineWidth = 0.8 + Math.random() * 1.8; x.strokeStyle = `rgba(40,26,12,${a})`; x.stroke();
    }
    // reflejos claros de fibra
    for (let i = 0; i < 10; i++) { const y = py + Math.random() * ph; x.strokeStyle = "rgba(210,175,120,.10)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + Math.sin(i) * 3); x.stroke(); }
    // junta entre tablas
    x.strokeStyle = "rgba(24,14,6,0.5)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, py); x.lineTo(W, py); x.stroke();
  }
  // manchas de tono (imperfección natural)
  for (let i = 0; i < 16; i++) { const bx = Math.random() * W, by = Math.random() * H, r = 30 + Math.random() * 90; const g = x.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, `rgba(30,18,8,${0.04 + Math.random() * 0.06})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.beginPath(); x.arc(bx, by, r, 0, Math.PI * 2); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 3); tex.anisotropy = 8;
  return tex;
}

/* Proyecta UVs planas (desde arriba, plano XZ) sobre una geometría sin UVs,
   normalizadas al bounding box, para poder texturarla. */
function planarUV(geo) {
  geo = geo.clone();
  geo.computeBoundingBox();
  const bb = geo.boundingBox, pos = geo.attributes.position;
  const sx = (bb.max.x - bb.min.x) || 1, sz = (bb.max.z - bb.min.z) || 1;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / sx;
    uv[i * 2 + 1] = (pos.getZ(i) - bb.min.z) / sz;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

export function EnvironmentProps() {
  const { scene } = useGLTF(envUrl);

  const env = useMemo(() => {
    const woodTex = makeTableWoodTexture();
    const c = scene.clone(true);
    c.rotation.y = ENV_ROT_Y;
    // el piso plano del GLB (Cube) se oculta: la sala dibuja su propio parquet
    c.traverse((o) => { if (/^cube$/i.test(o.name)) o.visible = false; });
    // higiene de render: sombras + materiales mate (sin recomponer nada)
    c.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      // MESA: veta de madera satinada (UVs planas, sin brillo metálico)
      if (/table2/i.test(o.name)) {
        o.geometry = planarUV(o.geometry);
        o.material = new THREE.MeshStandardMaterial({ map: woodTex, color: "#c8b493", roughness: 0.5, metalness: 0.04, envMapIntensity: 0.28 });
        return;
      }
      if (o.material) {
        o.material = o.material.clone();
        if (o.material.metalness !== undefined) o.material.metalness = Math.min(o.material.metalness ?? 0, 0.1);
        o.material.envMapIntensity = 0.35;
        if (o.material.color && o.material.color.getHexString() === "000000") o.material.color.setHex(0x8a8a8a);
      }
    });
    c.updateMatrixWorld(true);

    // centro real de la placa del tablero (para centrar la mesa debajo)
    const L = buildBoardLayout(CELL);
    const xs = L.cells.map((cell) => cell.x), zs = L.cells.map((cell) => cell.z);
    const bcx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const bcz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const boardFoot = Math.max((Math.max(...xs) - Math.min(...xs)) + CELL, (Math.max(...zs) - Math.min(...zs)) + CELL) + 3.2 + 2.4;

    // medir la mesa (Table2) y escalar para que el tablero entre con aire
    const tbox = new THREE.Box3();
    c.traverse((o) => { if (o.isMesh && /table2/i.test(o.name)) tbox.expandByObject(o); });
    const tsize = new THREE.Vector3(); tbox.getSize(tsize);
    const tcenter = new THREE.Vector3(); tbox.getCenter(tcenter);
    const shortSide = Math.min(tsize.x, tsize.z) || 1;
    const s = (boardFoot + 2 * MARGIN) / shortSide;
    c.scale.setScalar(s);
    c.position.set(bcx - tcenter.x * s, -tbox.max.y * s, bcz - tcenter.z * s); // mesa centrada bajo el tablero, tapa en y=0
    c.updateMatrixWorld(true);
    return c;
  }, [scene]);

  return <primitive object={env} />;
}
