import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Environment, Lightformer } from "@react-three/drei";
import { Board } from "./Board.jsx";
import { Scenery } from "./Scenery.jsx";
import { SceneDice } from "./SceneDice.jsx";
import { CameraRig } from "./CameraRig.jsx";
import { buildBoardLayout, CELL } from "./boardLayout.js";

/* ============================================================
   ESCENA 3D — parquet + casilleros plásticos + fichas con salto
   y giro + dado con física + cámara perspectiva cinematográfica.
   ============================================================ */

const CENTER = { x: 0, z: 0 }; // el dado se lanza al centro del tablero

function Lights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#ffe4c4", "#5f5060", 0.5]} />
      {/* sol de atardecer: cálido, suave (la lámpara aporta el resto) */}
      <directionalLight
        castShadow
        position={[14, 13, 9]}
        intensity={0.92}
        color="#ffcf95"
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.0004}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
      {/* relleno frío suave del lado opuesto (contraste agradable) */}
      <directionalLight position={[-9, 7, -7]} intensity={0.35} color="#bcd0ff" />
    </>
  );
}

/* Environment autocontenido: incluye una fuente CENITAL para que
   la cara superior de los casilleros refleje como los laterales. */
function Reflections() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={0.9} form="rect" position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[18, 18, 1]} color="#fff6e8" />
      <Lightformer intensity={0.7} form="rect" position={[0, 5, 6]} scale={[16, 8, 1]} color="#fff2dc" />
      <Lightformer intensity={0.45} form="rect" position={[-7, 4, -4]} rotation={[0, Math.PI / 3, 0]} scale={[9, 7, 1]} color="#cdd6ff" />
      <Lightformer intensity={0.4} form="rect" position={[7, 4, -4]} rotation={[0, -Math.PI / 3, 0]} scale={[9, 7, 1]} color="#ffe6cf" />
    </Environment>
  );
}

export function GameCanvas({ teams = [], activeIndex = 0, rolling = false, dieFace = 1, moving = false, showDice = false, overview = false }) {
  const layout = useMemo(() => buildBoardLayout(CELL), []);

  return (
    <Canvas
      shadows
      camera={{ fov: 42, position: [0, 23, 34], near: 0.1, far: 240 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", display: "block", touchAction: "pan-y" }}
    >
      {/* el fondo cálido lo pone Scenery (scene.background) */}
      <fog attach="fog" args={["#6b4f3c", 62, 150]} />

      <PerformanceMonitor />
      <AdaptiveDpr pixelated />
      <Lights />
      <CameraRig layout={layout} teams={teams} activeIndex={activeIndex} overview={overview} />

      <Suspense fallback={null}>
        <Reflections />
        <Scenery layout={layout} />
        <Board teams={teams} activeIndex={activeIndex} moving={moving} layout={layout} />
        <SceneDice show={showDice} rolling={rolling} value={dieFace} originXZ={CENTER} surface={0} />
      </Suspense>
    </Canvas>
  );
}
