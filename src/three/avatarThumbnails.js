import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { useState, useEffect } from "react";
import { MODELS } from "./models.js";

/* ============================================================
   MINIATURAS DE AVATARES — renderiza cada modelo GLB a una
   imagen (data URL) una sola vez, para usar en el HUD 2D sin
   emojis ni SVG. Un renderer offscreen por avatar, y se libera.
   ============================================================ */

let _promise = null;
const _cache = {};

function renderOne(url, size = 220) {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(url, (gltf) => {
      try {
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(2);
        renderer.setSize(size, size);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff, 1.05));
        const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2, 4, 3); scene.add(key);
        const fill = new THREE.DirectionalLight(0x9fb0ff, 0.4); fill.position.set(-2, 1, -1); scene.add(fill);

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const s = new THREE.Vector3(); box.getSize(s);
        const c = new THREE.Vector3(); box.getCenter(c);
        const maxd = Math.max(s.x, s.y, s.z) || 1;
        const sc = 1.75 / maxd;
        model.scale.setScalar(sc);
        model.position.set(-c.x * sc, -c.y * sc, -c.z * sc);
        scene.add(model);

        const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
        cam.position.set(0.35, 0.5, 2.6);
        cam.lookAt(0, 0.02, 0);

        renderer.render(scene, cam);
        const data = renderer.domElement.toDataURL("image/png");
        renderer.dispose();
        resolve(data);
      } catch (e) { resolve(null); }
    }, undefined, () => resolve(null));
  });
}

export function loadAvatarThumbs() {
  if (_promise) return _promise;
  _promise = (async () => {
    for (const [color, url] of Object.entries(MODELS.avatar)) _cache[color] = await renderOne(url);
    return _cache;
  })();
  return _promise;
}

/** Hook: devuelve el mapa color→dataURL (se completa asincrónicamente). */
export function useAvatarThumbs() {
  const [thumbs, setThumbs] = useState(_cache);
  useEffect(() => {
    let alive = true;
    loadAvatarThumbs().then((c) => { if (alive) setThumbs({ ...c }); });
    return () => { alive = false; };
  }, []);
  return thumbs;
}
