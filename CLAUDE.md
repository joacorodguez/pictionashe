# CLAUDE.md

# Pictionahse

## Proyecto

Pictionahse es un juego casual para dispositivos móviles orientado a jugadores de entre 15 y 30 años.

El objetivo es crear una experiencia que se sienta como un videojuego comercial publicado en App Store o Google Play.

La prioridad absoluta del proyecto es la calidad visual, la experiencia de usuario y un código limpio y mantenible.

---

# Fuentes de verdad

Antes de realizar cualquier cambio, consulta siempre los siguientes documentos:

1. docs/GAME_RULES.md
2. docs/DESIGN_SYSTEM.md
3. CLAUDE.md

Nunca contradigas esos documentos.

---

# Filosofía del proyecto

Este NO es un sitio web.

NO es un dashboard.

NO es una aplicación de escritorio.

Debe sentirse como un videojuego.

Toda decisión debe favorecer la inmersión y la calidad visual.

---

# Público objetivo

Edad:

15 a 30 años.

El juego debe transmitir:

- diversión
- competencia
- humor
- dinamismo
- calidad premium

Evitar un estilo demasiado infantil.

---

# Stack tecnológico

Frontend

- React
- TypeScript
- Vite

Estilos

- TailwindCSS

Animaciones

- Framer Motion

Estado global

- Zustand

Audio

- Howler.js

Partículas

- PixiJS (solo cuando realmente aporte valor)

---

# Arquitectura

Crear una estructura basada en features.

Ejemplo:

src/

features/

board/

cards/

dice/

game/

players/

settings/

ui/

shared/

components/

hooks/

utils/

assets/

---

# Organización

Cada componente debe tener una única responsabilidad.

Evitar componentes gigantes.

Priorizar composición.

No duplicar código.

---

# Assets

Todos los recursos gráficos deben cargarse desde:

assets/

Nunca dibujar assets complejos con CSS.

Nunca reemplazar assets mediante emojis.

Nunca recrear assets mediante SVG simples.

Si falta un asset:

Crear un placeholder temporal y solicitar el asset correspondiente.

---

# Dirección artística

Toda la dirección artística está definida en:

docs/DESIGN_SYSTEM.md

No inventar estilos nuevos.

No mezclar estilos.

Todo debe mantener la misma identidad visual.

---

# Interfaz

Debe sentirse como un juego AAA casual.

No como una página web.

Los botones deben tener:

- volumen
- profundidad
- reflejos
- sombras suaves

Todos los paneles deben compartir el mismo lenguaje visual.

---

# Tablero

El tablero siempre debe construirse mediante componentes.

Nunca como una imagen única.

Debe ser completamente responsive.

Debe adaptarse a cualquier tamaño de pantalla.

---

# Casilleros

Utilizar un único componente reutilizable.

Solo cambia:

- color
- posición
- rotación

No crear componentes distintos para cada casillero.

---

# Avatares

Los avatares siempre son assets.

Nunca recrearlos mediante CSS.

Nunca reemplazarlos por iconos.

Mantener:

- materiales
- iluminación
- escala
- proporciones

---

# Animaciones

Utilizar Framer Motion.

Las animaciones deben sentirse físicas.

Agregar pequeñas microanimaciones siempre que mejoren la experiencia.

Priorizar:

- bounce
- scale
- glow
- fade
- easing

Evitar movimientos bruscos.

---

# Sonidos

Todo sonido debe gestionarse mediante un AudioManager.

Nunca reproducir sonidos directamente desde componentes.

---

# Responsive

La prioridad absoluta es Mobile.

Desktop es secundario.

Todo debe probarse primero en resoluciones móviles.

---

# Rendimiento

Mantener 60 FPS siempre que sea posible.

Evitar renders innecesarios.

Lazy load cuando corresponda.

Optimizar imágenes.

---

# Forma de trabajar

NO desarrolles varias funcionalidades grandes al mismo tiempo.

Trabajaremos por fases.

Al finalizar cada fase debes detenerte y esperar aprobación.

No avances sin confirmación.

---

# Fases

1. Arquitectura del proyecto
2. Home
3. Tablero
4. Movimiento
5. Dados
6. Cartas
7. Sistema de turnos
8. Animaciones
9. Pulido visual
10. Optimización

---

# Si una tarea requiere un asset

No improvisarlo.

Indicar claramente:

- nombre del asset
- tamaño recomendado
- formato recomendado
- carpeta donde debe guardarse

---

# Estándares de código

Usar TypeScript estricto.

Evitar any.

Componentes pequeños.

Funciones cortas.

Nombres descriptivos.

Código legible.

---

# Antes de dar una tarea por terminada

Verificar:

- ¿Parece un videojuego?
- ¿Respeta el Design System?
- ¿Es responsive?
- ¿Tiene buenas animaciones?
- ¿El código es limpio?
- ¿Se puede reutilizar?
- ¿Mantiene 60 FPS?

Si alguna respuesta es "no", mejorar la implementación antes de continuar.

---

# Regla principal

La calidad es más importante que la velocidad.

Prefiero construir un juego excelente en varias iteraciones antes que terminar uno mediocre rápidamente.