import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { MODELS } from "./models.js";
import { makeCardFront, makeCardBack, OPTION_REGIONS } from "./cardTexture.js";

/* ============================================================
   CARTA 3D — game-card.glb (carta fina real) como cuerpo +
   contenido generado por código en sus dos caras. Aparición
   con escala/giro, flip dorso→frente, flotación y sombra.
   ============================================================ */

const CARD_H = 3.0;

/* Orienta el modelo (eje fino → Z), lo escala a CARD_H de alto y
   devuelve el tamaño real de la cara + semigrosor. */
function useCardBody() {
  const { scene } = useGLTF(MODELS.card);
  return useMemo(() => {
    const o = scene.clone(true);
    const box = new THREE.Box3().setFromObject(o); const size = new THREE.Vector3(); box.getSize(size); const center = new THREE.Vector3(); box.getCenter(center);
    o.position.sub(center);
    const dims = [size.x, size.y, size.z]; const thin = dims.indexOf(Math.min(...dims));
    if (thin === 0) o.rotation.y = Math.PI / 2; else if (thin === 1) o.rotation.x = -Math.PI / 2;
    o.traverse((m) => { if (m.isMesh) { m.material = new THREE.MeshStandardMaterial({ color: "#f3ead6", roughness: 0.55, metalness: 0.03 }); m.castShadow = true; } });
    const wrap = new THREE.Group(); wrap.add(o);
    const box2 = new THREE.Box3().setFromObject(wrap); const s2 = new THREE.Vector3(); box2.getSize(s2);
    const scale = CARD_H / Math.max(s2.x, s2.y);
    wrap.scale.setScalar(scale);
    return { wrap, halfThick: (s2.z * scale) / 2, faceW: s2.x * scale * 0.965, faceH: s2.y * scale * 0.965 };
  }, [scene]);
}

function CardMesh({ card, flipped, onSelect }) {
  const group = useRef();
  const inner = useRef();
  const rot = useRef(Math.PI);   // dorso al inicio
  const appear = useRef(0);      // 0→1 aparición
  const [hover, setHover] = useState(-1);
  const { wrap, halfThick, faceW, faceH } = useCardBody();
  const front = useMemo(() => makeCardFront(card), [card]);
  const back = useMemo(() => makeCardBack(card), [card]);
  const z = halfThick + 0.012;

  useFrame((rf, dt) => {
    appear.current = Math.min(1, appear.current + dt / 0.45);
    const a = 1 - Math.pow(1 - appear.current, 3); // easeOut
    const target = flipped ? 0 : Math.PI;
    rot.current += (target - rot.current) * (1 - Math.exp(-7 * dt));
    if (group.current) {
      group.current.rotation.y = rot.current + (1 - a) * 0.7;
      group.current.position.y = Math.sin(rf.clock.elapsedTime * 1.3) * 0.06;
      group.current.rotation.z = Math.sin(rf.clock.elapsedTime * 0.8) * 0.02;
    }
    if (inner.current) inner.current.scale.setScalar(0.6 + 0.4 * a);
  });

  const canPick = flipped && !!onSelect;

  return (
    <group ref={group}>
      <group ref={inner}>
        <primitive object={wrap} />
        <mesh position={[0, 0, z]}>
          <planeGeometry args={[faceW, faceH]} />
          <meshBasicMaterial map={front} toneMapped={false} transparent />
        </mesh>
        <mesh position={[0, 0, -z]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[faceW, faceH]} />
          <meshBasicMaterial map={back} toneMapped={false} transparent />
        </mesh>
        {/* zonas tocables sobre cada opción (solo con la carta dada vuelta) */}
        {canPick && OPTION_REGIONS.map((r, i) => (
          <mesh
            key={i}
            position={[0, faceH * (0.5 - r.cy), z + 0.006]}
            onClick={(e) => { e.stopPropagation(); onSelect(i); }}
            onPointerOver={(e) => { e.stopPropagation(); setHover(i); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { setHover(-1); document.body.style.cursor = "auto"; }}
          >
            <planeGeometry args={[faceW * 0.86, faceH * (r.h - 0.02)]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={hover === i ? 0.16 : 0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function CardStage({ card, flipped, onSelect, height = 460 }) {
  if (!card) return null;
  return (
    <div style={{ width: "100%", height, maxWidth: 380, margin: "0 auto" }}>
      <Canvas shadows camera={{ fov: 30, position: [0, 0.3, 8.5] }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]} style={{ touchAction: "none" }}>
        <ambientLight intensity={0.95} />
        <directionalLight castShadow position={[3, 5, 6]} intensity={0.8} shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, 4]} intensity={0.3} color="#cdd6ff" />
        <Suspense fallback={null}><CardMesh card={card} flipped={flipped} onSelect={onSelect} /></Suspense>
        <ContactShadows position={[0, -1.75, 0]} opacity={0.35} scale={6} blur={2.6} far={4} resolution={256} color="#000000" />
      </Canvas>
    </div>
  );
}
