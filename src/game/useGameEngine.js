import { useState, useRef, useEffect, useMemo } from "react";
import { BANK } from "../bank.js";
import { Sound } from "../audio/sound.js";
import { colorAt, shuffle, prefersReduced, TIMER_DEFAULT } from "./constants.js";

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
  const [moving, setMoving] = useState(false);
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
    setRolling(false); setMoving(false); setAwaitingCard(false); setBusy(false);
    setCard(null); setChoiceIdx(null); setRoundType(null); setPendingFinal(false); setPendingColor(null);
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

  const doRollDigital = () => {
    if (busy) return; setBusy(true); setRolling(true); Sound.diceRoll();
    const val = 1 + Math.floor(Math.random() * 6); let ticks = prefersReduced() ? 2 : 20, i = 0;
    const iv = setInterval(() => {
      setDieFace(1 + Math.floor(Math.random() * 6)); i++;
      if (i >= ticks) { clearInterval(iv); setDieFace(val); setRolling(false); Sound.diceResult(val); setTimeout(() => moveActive(val), 850); }
    }, prefersReduced() ? 60 : 90);
  };

  const rollPhysical = (n) => { if (busy) return; setBusy(true); setRolling(true); setDieFace(n); Sound.diceRoll();
    setTimeout(() => { setRolling(false); Sound.diceResult(n); setTimeout(() => moveActive(n), 850); }, 700); };

  const moveActive = (val) => {
    setMoving(true); const startPos = teams[activeIndex].position; const path = computePath(startPos, val); let i = 0;
    const step = () => {
      const p = path[i]; setTeams(prev => { const n = prev.map(t => ({ ...t })); n[activeIndex].position = p; return n; }); Sound.move(); i++;
      if (i < path.length) { setTimeout(step, prefersReduced() ? 40 : 700); } // lento, casillero por casillero
      else {
        const finalPos = path[path.length - 1];
        setTimeout(() => {              // pausa al llegar (la ficha gira a mirar la cámara, aún cerca)
          setMoving(false); setBusy(false); // fin → la cámara vuelve lento a la vista general
          setTimeout(() => { setAwaitingCard(true); setPendingColor(colorAt(finalPos)); setPendingFinal(finalPos === 60); }, 1300); // recién después, la carta
        }, 800);
      }
    };
    // la cámara se acerca ~1.5s (y la ficha gira de espaldas) antes de arrancar el recorrido
    if (path.length) setTimeout(step, prefersReduced() ? 40 : 1500); else { setMoving(false); setAwaitingCard(true); setBusy(false); }
  };

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
  const finalizeGame = () => { setPhase("setup"); setTeams([]); setAvatarSel([null, null, null, null]); setDiceType(null); setNumTeams(2); setTimerDuration(TIMER_DEFAULT); resetTurnFlags(); setActiveIndex(0); setTurnNum(1); };

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
    busy, rolling, dieFace, moving, awaitingCard, pendingFinal, pendingColor,
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
