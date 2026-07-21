import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
   <Model> — carga un GLB, lo clona y lo NORMALIZA:
   lo centra en el origen y lo escala para que su lado mayor
   mida `targetSize`. Así no importa a qué escala se exportó
   cada modelo, todos entran coherentes en la escena.
   `anchor="bottom"` apoya el modelo sobre el suelo (y=0).
   ============================================================ */
export function Model({ url, targetSize = 1, anchor = "center", color = null, env = 0.5, sat = 0, castShadow = true, receiveShadow = false, ...props }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = castShadow;
        o.receiveShadow = receiveShadow;
        // Materiales clonados para no compartir estado entre instancias.
        if (o.material) {
          o.material = o.material.clone();
          o.material.envMapIntensity = env;
          // acabado plástico (nada metálico) pero un poco brillante
          if (o.material.metalness !== undefined) o.material.metalness = Math.min(o.material.metalness ?? 0, 0.04);
          if (o.material.roughness !== undefined) o.material.roughness = THREE.MathUtils.clamp(o.material.roughness ?? 0.5, 0.32, 0.7);
          // subir intensidad de color (saturación) sin sumar brillo
          if (sat > 0 && o.material.color) o.material.color.offsetHSL(0, sat, 0);
        } else {
          o.material = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, metalness: 0.02 });
        }
        if (color) {
          o.material.color = new THREE.Color(color);
          o.material.roughness = 0.45;
          o.material.metalness = 0.0;
        }
      }
    });
    return c;
  }, [scene, castShadow, receiveShadow, color, env, sat]);

  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    // Guarda contra GLB con caja vacía/no finita (evita NaN que rompe la escena).
    const fin = (v) => (Number.isFinite(v) ? v : 0);
    const s = (Number.isFinite(maxDim) && maxDim > 1e-4) ? targetSize / maxDim : 1;
    const p = [-fin(center.x), -fin(center.y), -fin(center.z)];
    if (anchor === "bottom") p[1] = -fin(box.min.y); // base sobre y=0
    else if (anchor === "top") p[1] = -fin(box.max.y); // tope sobre y=0
    return { scale: s, position: p };
  }, [cloned, targetSize, anchor]);

  return (
    <group {...props} scale={scale}>
      <primitive object={cloned} position={position} />
    </group>
  );
}
