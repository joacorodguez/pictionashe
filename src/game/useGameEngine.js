import { useState, useRef, useEffect, useMemo } from "react";
import { BANK } from "../bank.js";
import { Sound } from "../audio/sound.js";
import { colorAt, shuffle, prefersReduced, TIMER_DEFAULT } from "./constants.js";
import { cameraBus, wait } from "../three/cameraBus.js";

/* ============================================================
   useGameEngine — LÓGICA DEL JUEGO (headless, sin presentación)
   Dueña de toda la máquina de estados y las mecánicas:
   turnos, dado, movimiento + rebote, cartas, cronómetro y
   resolución de rondas. No sabe NADA de cómo se dibuja.
   El comportamiento es idéntico al de la versión 2D original.
   ============================================================ */
export function useGameEngine() {
  const [phase, setPhase] = useState("setup");
  const [numTeams, setNumTeams] = useState(2);
  const [difficulty] = useState("dificil");
  const [timerDuration, setTimerDuration] = useState(TIMER_DEFAULT);
  const [avatarSel, setAvatarSel] = useState([null, null, null, null]);
  const [diceType, setDiceType] = useState(null); // 'digital' | 'fisico'
  const [teams, setTeams] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [turnNum, setTurnNum] = useState(1);
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [dieFace, setDieFace] = useState(1);
  const [diceShown, setDiceShown] = useState(false);
  const [moving, setMoving] = useState(false);
  const seqTokenRef = useRef(0); // aborta secuencias en curso al cambiar de turno
  const [awaitingCard, setAwaitingCard] = useState(false);
  const [pendingFinal, setPendingFinal] = useState(false);
  const [pendingColor, setPendingColor] = useState(null);
  const [card, setCard] = useState(null);
  const [choiceIdx, setChoiceIdx] = useState(null);
  const [roundType, setRoundType] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DEFAULT);
  const usedRef = useRef({});
  const lastTwoRef = useRef({});

  const nextIdx = (i) => (i + 1) % numTeams;

  const canStart = useMemo(() => {
    const ch = avatarSel.slice(0, numTeams);
    if (ch.some(a => !a)) return false;
    return new Set(ch).size === numTeams;
  }, [avatarSel, numTeams]);

  const pickAvatar = (ti, id) => setAvatarSel(prev => { const n = [...prev]; n[ti] = n[ti] === id ? null : id; return n; });

  const resetTurnFlags = () => {
    seqTokenRef.current++;                 // corta cualquier secuencia en vuelo
    setRolling(false); setMoving(false); setDiceShown(false); setAwaitingCard(false); setBusy(false);
    setCard(null); setChoiceIdx(null); setRoundType(null); setPendingFinal(false); setPendingColor(null);
    cameraBus.set("MAIN");                 // cada turno arranca en la vista principal
  };

  // Paso previo: elegir tipo de dado antes de iniciar.
  const goToDiceChoice = () => { Sound.ensure(); setPhase("dicechoice"); };
  const backToSetup = () => setPhase("setup");
  const startGame = (type) => {
    usedRef.current = {}; lastTwoRef.current = {};
    if (type) setDiceType(type);
    setTeams(avatarSel.slice(0, numTeams).map(id => ({ avatarId: id, position: 0 })));
    setActiveIndex(Math.floor(Math.random() * numTeams)); setTurnNum(1); setPhase("board"); resetTurnFlags(); Sound.turn();
  };
  const startTurn = (idx) => { setActiveIndex(idx); setTurnNum(n => n + 1); resetTurnFlags(); setPhase("board"); Sound.turn(); };

  const computePath = (pos, val) => { const p = []; let cur = pos, dir = 1; for (let k = 0; k < val; k++) { if (cur === 60) dir = -1; cur += dir; p.push(cur); } return p; };

  /* --- Secuencia sincronizada con la cámara ---------------------------
     Regla de oro: ninguna acción arranca mientras la cámara se mueve.
     Cada paso pide un encuadre, ESPERA a que la cámara llegue
     (cameraBus.waitArrived) y hace una pausa corta (0.3-0.4s) antes de
     seguir. Los tiempos están pensados para verse bien en un celular. */
  const aborted = (token) => token !== seqTokenRef.current;

  const flicker = (val, token) => new Promise((res) => {
    let ticks = prefersReduced() ? 2 : 15, i = 0;
    const iv = setInterval(() => {
      if (aborted(token)) { clearInterval(iv); res(); return; }
      setDieFace(1 + Math.floor(Math.random() * 6)); i++;
      if (i >= ticks) { clearInterval(iv); setDieFace(val); res(); }
    }, prefersReduced() ? 60 : 85);
  });

  const runMove = (val, token) => new Promise((resolve) => {
    const startPos = teams[activeIndex].position;
    const path = computePath(startPos, val);
    if (!path.length) { resolve(startPos); return; }
    setMoving(true);
    const stepDelay = prefersReduced() ? 40 : 680;
    let i = 0;
    const step = () => {
      if (aborted(token)) { resolve(path[Math.max(0, i - 1)] ?? startPos); return; }
      const p = path[i]; setTeams(prev => { const n = prev.map(t => ({ ...t })); n[activeIndex].position = p; return n; }); Sound.move(); i++;
      if (i < path.length) setTimeout(step, stepDelay);
      else {
        const finalPos = path[path.length - 1];
        // deja terminar el último salto y el giro al frente antes de la carta
        setTimeout(() => { setMoving(false); resolve(finalPos); }, prefersReduced() ? 60 : 1050);
      }
    };
    step(); // 1er paso: la ficha gira sola (anticipación) antes de saltar
  });

  const runRoll = async (val, physical) => {
    const token = ++seqTokenRef.current;
    setBusy(true);
    const pause = prefersReduced() ? 0 : 350;
    // 1) vista principal del tablero + pausa corta
    cameraBus.set("MAIN"); await cameraBus.waitArrived(); await wait(pause);
    if (aborted(token)) return;
    // 2) recién ahí se lanza el dado
    setDiceShown(true); setRolling(true); Sound.diceRoll();
    if (!physical) await flicker(val, token); else { setDieFace(val); await wait(prefersReduced() ? 60 : 700); }
    if (aborted(token)) return;
    // 3) el dado frena y se asienta
    setRolling(false); Sound.diceResult(val);
    await wait(prefersReduced() ? 60 : 520);
    if (aborted(token)) return;
    // 4) la cámara se acerca al dado y sostiene para leer la cara
    cameraBus.set("DICE_REVEAL"); await cameraBus.waitArrived();
    await wait(prefersReduced() ? 150 : 1300);
    if (aborted(token)) return;
    setDiceShown(false);
    // 5) vuelve a la vista principal + pausa
    cameraBus.set("MAIN"); await cameraBus.waitArrived(); await wait(pause);
    if (aborted(token)) return;
    // 6) coloca la cámara de seguimiento ANTES de mover
    cameraBus.set("CHASE"); await cameraBus.waitArrived(); await wait(pause);
    if (aborted(token)) return;
    // 7) mueve el avatar (gira, salta, y al final gira al frente)
    const finalPos = await runMove(val, token);
    if (aborted(token)) return;
    // 8) recién cuando termina el avatar aparece la carta
    setBusy(false);
    setAwaitingCard(true); setPendingColor(colorAt(finalPos)); setPendingFinal(finalPos === 60);
  };

  const doRollDigital = () => { if (busy) return; runRoll(1 + Math.floor(Math.random() * 6), false); };
  const rollPhysical = (n) => { if (busy) return; runRoll(n, true); };

  const pickTwo = (cat) => {
    const pool = BANK[cat]; if (!usedRef.current[cat]) usedRef.current[cat] = new Set(); let used = usedRef.current[cat];
    let avail = pool.filter(t => !used.has(t));
    if (avail.length < 2) { used.clear(); usedRef.current[cat] = used; const last = lastTwoRef.current[cat] || []; avail = pool.filter(t => !last.includes(t)); if (avail.length < 2) avail = [...pool]; }
    const two = shuffle(avail).slice(0, 2); two.forEach(t => used.add(t)); lastTwoRef.current[cat] = two; return two;
  };
  const makeCard = (cat, isFinal) => {
    const [a, b] = pickTwo(cat); const isRed = cat === "rojo"; let options;
    if (isRed || isFinal) options = [{ text: a, allPlay: true }, { text: b, allPlay: true }];
    else { const r = Math.random() < 0.5; options = [{ text: a, allPlay: r }, { text: b, allPlay: !r }]; }
    return { category: cat, isRed, isFinal, options };
  };

  const levantarCarta = () => { if (busy) return; Sound.cardFlip(); const isFinal = pendingFinal;
    setCard(makeCard(isFinal ? "rojo" : pendingColor, isFinal)); setChoiceIdx(null); setAwaitingCard(false); setPhase("reveal"); };
  const jugarCartaFinal = () => { Sound.cardFlip(); setCard(makeCard("rojo", true)); setChoiceIdx(null); setPhase("reveal"); };
  const verCarta = () => { Sound.cardFlip(); setPhase("options"); };
  const selectOption = (idx) => { setChoiceIdx(idx); setPhase("confirm"); };
  const backToOptions = () => { setChoiceIdx(null); setPhase("options"); };
  const confirmChoice = () => { const chosen = card.options[choiceIdx]; setRoundType(card.isFinal ? "final" : (chosen.allPlay ? "todos" : "normal")); setPhase("countdown"); setCountdown(5); };

  const endRound = () => { setPhase("result"); };
  const endRoundEarly = () => { if (phase === "timer") endRound(); };
  const resolve = (w) => {
    if (roundType === "normal") { if (w === activeIndex) { Sound.correct(); startTurn(activeIndex); } else startTurn(nextIdx(activeIndex)); }
    else if (roundType === "todos") { if (w != null) { Sound.correct(); startTurn(w); } else startTurn(nextIdx(activeIndex)); }
    else if (roundType === "final") { if (w === activeIndex) { Sound.victory(); setPhase("victory"); return; } else if (w != null) { Sound.correct(); startTurn(w); } else startTurn(nextIdx(activeIndex)); }
  };
  const finalizeGame = () => { cameraBus.reset(); setPhase("setup"); setTeams([]); setAvatarSel([null, null, null, null]); setDiceType(null); setNumTeams(2); setTimerDuration(TIMER_DEFAULT); resetTurnFlags(); setActiveIndex(0); setTurnNum(1); };

  /* Cuenta regresiva de preparación (5s) */
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setSecondsLeft(timerDuration); setPhase("timer"); return; }
    Sound.countdown(countdown > 1 ? countdown : 1);
    const to = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(to);
  }, [phase, countdown, timerDuration]);

  /* Cronómetro de la ronda */
  useEffect(() => {
    if (phase !== "timer") return;
    if (secondsLeft <= 0) { Sound.alarm(); endRound(); return; }
    if (secondsLeft <= 10) Sound.tick();
    const to = setTimeout(() => setSecondsLeft(s => s - 1), 1000); return () => clearTimeout(to);
  }, [phase, secondsLeft]);

  /* Derivados de presentación (puntero y paso actual) */
  const leaderIdx = teams.length ? teams.reduce((best, t, i, arr) => t.position > arr[best].position ? i : best, 0) : -1;
  const leaderHasLead = teams.length && teams.some(t => t.position > 0) && teams.filter(t => t.position === teams[leaderIdx].position).length === 1;

  let step = 1;
  if (phase === "board") step = awaitingCard ? 3 : (moving ? 2 : 1);
  else if (phase === "reveal") step = 3;
  else if (phase === "options" || phase === "confirm") step = 4;
  else if (phase === "countdown" || phase === "timer") step = 5;
  else if (phase === "result") step = 6;

  const active = teams[activeIndex];

  return {
    // estado
    phase, numTeams, difficulty, timerDuration, avatarSel, diceType, teams, activeIndex, turnNum,
    busy, rolling, dieFace, diceShown, moving, awaitingCard, pendingFinal, pendingColor,
    card, choiceIdx, roundType, countdown, secondsLeft,
    // derivados
    canStart, active, nextIdx, leaderIdx, leaderHasLead, step,
    // setters de configuración (setup)
    setNumTeams, setTimerDuration, setAvatarSel, pickAvatar,
    // acciones de juego
    goToDiceChoice, backToSetup, startGame, startTurn, doRollDigital, rollPhysical,
    levantarCarta, jugarCartaFinal, verCarta, selectOption, backToOptions, confirmChoice,
    endRound, endRoundEarly, resolve, finalizeGame,
  };
}
