import React, { Suspense, useMemo, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { Board } from "./Board.jsx";
import { Scenery } from "./Scenery.jsx";
import { SceneDice } from "./SceneDice.jsx";
import { CameraRig } from "./CameraRig.jsx";
import { cameraBus } from "./cameraBus.js";
import { buildBoardLayout, CELL } from "./boardLayout.js";

/* ============================================================
   ESCENA 3D — parquet + casilleros plásticos + fichas con salto
   y giro + dado con física + cámara perspectiva cinematográfica.
   ============================================================ */

const CENTER = { x: 0, z: 0 }; // el dado se lanza al centro del tablero

/* ============================================================
   DIRECCIÓN DE LUZ — "atardecer, alguien preparó la mesa para jugar".
   La sala NO está iluminada de forma pareja: la ÚNICA luz real de
   ambiente es el sol entrando por la ventana del fondo; el resto son
   focos cálidos y localizados (veladores). ambientLight: desactivada
   a propósito, PERMANENTE (le da profundidad a la escena; no reactivar).
   ============================================================ */
function Lights() {
  return (
    <>
      {/* HEMISFÉRICA: solo evita que las sombras sean negro puro (con el sol
          MUY rasante esto incluía las caras de arriba de los casilleros — se
          subió un poco para que el color del casillero siga siendo legible,
          sigue muy por debajo de una luz "notoria"). */}
      <hemisphereLight args={["#463a48", "#201a24", 0.24]} />

      {/* SOL DE ATARDECER — LUZ PRINCIPAL de la sala, entra por la ventana
          grande del fondo. Ángulo bajo (como un atardecer real) → sombras
          largas y suaves; viaja desde el fondo (-Z, la ventana) hacia la
          cámara, así que ilumina el lado del sofá/planta que mira a la
          ventana y roza el tablero/mesa. Elevación ~20° (no 11°): suficiente
          para que la cara de ARRIBA de los casilleros reciba luz directa
          legible, sin dejar de sentirse un sol bajo de atardecer. */}
      <directionalLight
        castShadow
        position={[-2, 34, -92]}
        intensity={1.75}
        color="#ff9a5a"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.05}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={5}
        shadow-camera-far={185}
        shadow-radius={3}
      />

      {/* TOQUE VIOLETA casi imperceptible: solo tiñe sombras/zonas oscuras
          (identidad del juego), sin leerse como una luz en sí misma. */}
      <directionalLight position={[9, 9, 26]} intensity={0.05} color="#7d63d6" />

      {/* LÁMPARA DE PIE (rincón del sofá): ilumina de verdad esa esquina —
          sofá, mesita y planta —, pero se apaga antes de llegar a la mesa. */}
      <pointLight position={[23, 11, -74]} color="#ffb46a" intensity={68} distance={58} decay={2} castShadow={false} />

      {/* LÁMPARA DE ESCRITORIO (sobre la mesa): foco chico y cálido, muy
          localizado — se nota que está prendida, sin iluminar todo el tablero. */}
      <pointLight position={[-24, 8, -9]} color="#ffbf80" intensity={13} distance={17} decay={2} castShadow={false} />
      {/* (Los casilleros ya no dependen de la luz de la sala: su color lo
          garantiza una autoiluminación sutil en el material — ver Board.jsx.) */}
    </>
  );
}

/* Depth of Field con FOCO DINÁMICO: el plano de foco sigue exactamente lo que
   la cámara mira (dado, avatar o tablero, vía cameraBus.focus) → el protagonista
   de cada momento SIEMPRE nítido; solo el fondo se difumina. Efecto sutil. */
function PostFX() {
  const { gl, scene, camera, size } = useThree();
  const dofRef = useRef(null);
  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);
    comp.addPass(new RenderPass(scene, camera));
    const dof = new DepthOfFieldEffect(camera, {
      worldFocusRange: 26,      // banda nítida alrededor del foco (protagonista)
      bokehScale: 1.6,          // desenfoque más sutil y natural (antes 2.4)
      resolutionScale: 0.5,     // barato para móvil (el blur va en el fondo)
    });
    dof.target = new THREE.Vector3(0, 0.4, 0); // se actualiza cada frame (foco dinámico)
    dofRef.current = dof;
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    comp.addPass(new EffectPass(camera, dof, tone));
    return comp;
  }, [gl, scene, camera]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame((_, delta) => {
    const f = cameraBus.focus;
    if (dofRef.current) dofRef.current.target.set(f.x, f.y, f.z); // foco = lo que mira la cámara
    composer.render(delta);
  }, 1);
  return null;
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
      shadows="soft"
      flat
      camera={{ fov: 35, position: [0, 16, 34], near: 0.1, far: 240 }}
      dpr={[1, 1.25]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", display: "block", touchAction: "pan-y" }}
    >
      {/* Sin niebla: la profundidad la da el Depth of Field (PostFX) y el
          contraste de luces, no una bruma. El fondo cálido lo pone Scenery. */}

      <Lights />
      <CameraRig layout={layout} teams={teams} activeIndex={activeIndex} overview={overview} />

      <Suspense fallback={null}>
        <Reflections />
        <Scenery layout={layout} />
        <Board teams={teams} activeIndex={activeIndex} moving={moving} layout={layout} />
        <SceneDice show={showDice} rolling={rolling} value={dieFace} originXZ={CENTER} surface={0} />
      </Suspense>
      <PostFX />
    </Canvas>
  );
}
