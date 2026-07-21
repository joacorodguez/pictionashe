/* ============================================================
   LAYOUT DEL TABLERO — circuito rectangular (según el plano).
   60 casilleros formando un anillo hueco con dos entrantes
   (uno arriba al centro, otro abajo al centro), más los brazos
   de INICIO (antes del 1) y FINAL (en el 60).
   Coordenadas en grilla (col, row); se convierten a mundo XZ.
   row 0 = fila de atrás (arriba en el plano).
   ============================================================ */

export const GRID_COLS = 13;
export const GRID_ROWS = 14;

/* Tamaño de celda en unidades de mundo (separación entre centros de
   casilleros). Compartido por el tablero, el suelo y la cámara.
   Reducido 25% (2 → 1.5) para que el tablero se vea más chico sobre
   la mesa, con espacio libre alrededor para los objetos decorativos. */
export const CELL = 1.5;

/* Camino 1→60 como [col, row] (0-indexado). Traza el circuito
   del plano: baja por la izquierda-arriba, recorre el borde,
   con los dos entrantes centrales. */
const PATH = [
  [1, 5],  // 1
  [0, 5],  // 2
  [0, 4],  // 3
  [0, 3],  // 4
  [0, 2],  // 5
  [0, 1],  // 6
  [0, 0],  // 7
  [1, 0],  // 8
  [2, 0],  // 9
  [3, 0],  // 10
  [4, 0],  // 11
  [5, 0],  // 12
  [5, 1],  // 13  ↓ entrante superior
  [5, 2],  // 14
  [6, 2],  // 15
  [7, 2],  // 16
  [7, 1],  // 17  ↑
  [7, 0],  // 18
  [8, 0],  // 19
  [9, 0],  // 20
  [10, 0], // 21
  [11, 0], // 22
  [12, 0], // 23  esquina sup-der
  [12, 1], // 24
  [12, 2], // 25
  [12, 3], // 26
  [12, 4], // 27
  [12, 5], // 28
  [12, 6], // 29
  [12, 7], // 30
  [12, 8], // 31
  [12, 9], // 32
  [12, 10],// 33
  [12, 11],// 34
  [12, 12],// 35
  [12, 13],// 36  esquina inf-der
  [11, 13],// 37
  [10, 13],// 38
  [9, 13], // 39
  [8, 13], // 40
  [7, 13], // 41
  [7, 12], // 42  ↑ entrante inferior
  [7, 11], // 43
  [6, 11], // 44
  [5, 11], // 45
  [5, 12], // 46  ↓
  [5, 13], // 47
  [4, 13], // 48
  [3, 13], // 49
  [2, 13], // 50
  [1, 13], // 51
  [0, 13], // 52  esquina inf-izq
  [0, 12], // 53
  [0, 11], // 54
  [0, 10], // 55
  [0, 9],  // 56
  [0, 8],  // 57
  [1, 8],  // 58  → brazo del final
  [2, 8],  // 59
  [3, 8],  // 60
];

const START_CELL = [2, 5];   // INICIO: a la derecha del casillero 1
export const FINAL_CELL = [4, 8]; // marca "Final", a la derecha del 60

const SPACING = 1.0; // los casilleros se tocan (footprint = 1)

function toXZ([col, row], sp, cx, cz) {
  return { x: (col - cx) * sp, z: (row - cz) * sp };
}

export function buildBoardLayout(tileSize = 1) {
  const sp = SPACING * tileSize;
  const cx = (GRID_COLS - 1) / 2;
  const cz = (GRID_ROWS - 1) / 2;
  const cells = PATH.map(([col, row], i) => ({ n: i + 1, col, row, ...toXZ([col, row], sp, cx, cz) }));
  const start = toXZ(START_CELL, sp, cx, cz);
  const final = toXZ(FINAL_CELL, sp, cx, cz);
  return { cells, start, final, cols: GRID_COLS, rows: GRID_ROWS, width: GRID_COLS * sp, depth: GRID_ROWS * sp };
}

/** Posición XZ de un equipo según su casillero (0 = INICIO). */
export function teamXZ(layout, position) {
  if (position <= 0) return layout.start;
  const cell = layout.cells[position - 1];
  return { x: cell.x, z: cell.z };
}
