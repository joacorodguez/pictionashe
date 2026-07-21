/* ============================================================
   cameraBus — puente entre la LÓGICA (headless) y la CÁMARA (R3F).
   La lógica pide un estado de cámara (MAIN, DICE_REVEAL, CHASE…) y
   ESPERA a que la cámara realmente llegue antes de seguir. Así
   ninguna acción arranca mientras la cámara todavía se mueve.
   Es un singleton sin React ni three: solo estado + señal "llegó".
   ============================================================ */

export const cameraBus = {
  state: "MAIN",          // estado de encuadre deseado
  arrived: true,          // ¿la cámara ya llegó a ese encuadre?
  focus: { x: 0, y: 0.4, z: 0 }, // punto de mundo que la cámara enfoca (lo escribe
                                 // el rig cada frame; lo lee el DoF para su plano de
                                 // foco dinámico → el protagonista siempre nítido).
  _resolvers: [],

  /** Pide un encuadre nuevo. Reinicia la señal de llegada. */
  set(state) {
    if (state !== this.state) { this.state = state; this.arrived = false; }
  },

  /** La cámara avisa que llegó al encuadre actual (la llama el rig). */
  markArrived() {
    if (this.arrived) return;
    this.arrived = true;
    const rs = this._resolvers; this._resolvers = [];
    rs.forEach((r) => r());
  },

  /** Promesa que resuelve cuando la cámara llega (con tope de seguridad). */
  waitArrived(timeout = 2600) {
    if (this.arrived) return Promise.resolve();
    return new Promise((res) => {
      let done = false;
      const r = () => { if (!done) { done = true; res(); } };
      this._resolvers.push(r);
      setTimeout(r, timeout); // nunca se cuelga si algo raro pasa
    });
  },

  reset() { this.state = "MAIN"; this.arrived = true; this._resolvers = []; },
};

/** Pausa simple para las esperas de la secuencia. */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
