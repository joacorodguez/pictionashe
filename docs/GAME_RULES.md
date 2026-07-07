
PICTIONAHSE — Reglas del juego
Resumen
Pictionahse es un juego de mesa digital de mímica para 2 a 4 equipos, jugable en un solo dispositivo compartido. Combina un tablero de recorrido de 60 casilleros con rondas de actuación cronometradas. El objetivo es ser el primer equipo en llegar al casillero 60 y ganar la ronda final de mímica.

Componentes

Tablero: 60 casilleros hexagonales en serpentín. Los colores se repiten en ciclo: amarillo → azul → naranja → verde → rojo (×12). El casillero 60 es siempre rojo (meta ⭐).
Avatares: 4 animales (🦊 Zorro, 🐼 Panda, 🦁 León, 🦉 Búho). Cada equipo elige uno, sin repetir.
Dado: Digital (aleatorio 1-6) o físico (el jugador carga el resultado manualmente, 1-6).
Cartas: Cada casillero genera una carta con 2 opciones de la categoría correspondiente al color. El actor elige cuál representar.
Cronómetro: Configurable de 0:45 a 2:00 en pasos de 15 segundos. Default: 1:00.


Las 5 categorías
ColorCategoríaEjemplo🟨 AmarilloPersona, lugar o animalFreddie Mercury, Torre Eiffel, Ornitorrinco🟦 AzulObjetoTelescopio, Acordeón, Matafuegos🟧 NaranjaAcciónHacer parkour, Cocinar un asado, Bucear🟩 VerdePelícula o serieTitanic, Breaking Bad, Stranger Things🟥 RojoTodos juegan (Mix)Superman, Zombi, Director de orquesta
Banco: 500 palabras totales (100 por categoría), dificultad "Difícil". Las dificultades "Normal" y "Muy difícil" están bloqueadas para expansión futura.

Preparación

Elegir cantidad de equipos: 2, 3 o 4.
Seleccionar dificultad (solo "Difícil" disponible).
Configurar tiempo por ronda (45s a 2:00, default 1:00).
Cada equipo elige su avatar (sin repetir).
El juego sortea al azar quién empieza.


Flujo de un turno (6 pasos)
Paso 1: Tirar el dado
El equipo activo elige entre dado digital (random) o dado físico (carga el número a mano).
Paso 2: Mover la ficha
El avatar avanza casillero a casillero (animado). Si el dado lo hace pasar del 60, rebota hacia atrás (ver "Rebote").
Paso 3: Levantar carta
Se genera una carta con 2 opciones de la categoría del casillero donde cayó.
Paso 4: Elegir opción (solo el actor)
Solo el actor mira la pantalla. Cada opción indica si es ronda normal o "todos juegan" (triángulo ▲). El actor elige cuál representar.
Paso 5: Mímica
5 segundos de preparación (la palabra se muestra en pantalla), luego arranca el cronómetro. El actor actúa sin hablar ni escribir. Se puede cortar antes con "Finalizar ronda antes" si alguien adivina.
Paso 6: Resultado
Se selecciona quién adivinó (o nadie). Según el tipo de ronda, el equipo ganador sigue o pasa el turno.

Tipos de rondas
Ronda normal

Actúa: un jugador del equipo activo.
Adivina: solo el equipo del actor.
Si aciertan: el mismo equipo sigue jugando y tira de nuevo.
Si nadie acierta: pasa el turno al siguiente equipo.

Todos juegan (▲)

Actúa: un jugador del equipo activo.
Adivina: todos los equipos (el actor no).
Si alguien acierta: el equipo que acertó toma el próximo turno.
Si nadie acierta: pasa el turno al siguiente equipo.

¿Cuándo aparece cada tipo?

En casilleros amarillo, azul, naranja y verde: de las 2 opciones de la carta, una es normal y la otra es "todos juegan" (asignación aleatoria).
En casilleros rojos: las 2 opciones son siempre "todos juegan".


El rebote
Para ganar hay que caer justo en el casillero 60. Si el dado te haría pasar, rebotás:
Ejemplo: Estás en el 58 y sacás un 5 → avanzás: 59 → 60 → 59 → 58 → 57. Terminás en el 57.
Fórmula: posición_final = 60 - (dado - (60 - posición_actual))

Casillero 60: la ronda final
Llegar al 60 no es ganar. Cuando un equipo comienza su turno en el 60:

No tira dados. Aparece el botón "Jugar carta final".
Se genera una carta roja (ambas opciones son "Todos juegan").
El actor elige una opción y la representa.
Todos los equipos pueden adivinar.
Si tu propio equipo adivina primero → ¡GANASTE! 🏆
Si otro equipo adivina primero → ese equipo toma el turno, pero NO gana. El juego sigue.
Si nadie adivina → pasa el turno. Seguís en el 60 para la próxima.


Reglas de mímica
El actor NO puede:

Hablar, cantar, tararear o hacer sonidos con la boca.
Escribir, dibujar o señalar letras/números/textos.
Deletrear la palabra.
Decir ninguna parte de la respuesta.
Usar el celular para mostrar algo.

El actor SÍ puede:

Usar todo su cuerpo (manos, cara, brazos, piernas).
Indicar cantidad de palabras (levantando dedos).
Señalar que es película/serie (simular cámara o pantalla).
Hacer gestos de "suena como" (mano al oído).
Señalar qué palabra de la frase está representando.
Usar objetos del entorno (sin escribir en ellos).


Configuración técnica actual

Dificultad activa: solo "Difícil" (500 palabras). "Normal" y "Muy difícil" bloqueados (🔒).
Timer: default 60s, min 45s, max 120s, paso de 15s.
Avatares: 4 fijos (Zorro, Panda, León, Búho).
Tablero: 60 casilleros, patrón A/Z/N/V/R ×12, casillero 60 = rojo siempre.
Validación del banco: al montar se valida que haya exactamente 100 opciones por categoría, sin vacíos ni duplicados (normalizados: lowercase, sin tildes, solo alfanumérico).
Sonidos: Web Audio API, silenciables.
Sin persistencia: no guarda estado entre sesiones.


Estética visual

Tema: fondo oscuro púrpura (#3A3357 → #171326), paneles con glassmorphism.
Tablero: casilleros hexagonales con relieve (sombra de canto), layout serpentín.
Logo: "PICTIO" en blanco + "NAHSE" en amarillo/dorado (#F5C518) con corona 👑.
Tarjetas de equipo: avatar + nombre + posición, borde verde brillante en el equipo activo, 👑 en el puntero.
Dado: plano con relieve (radial-gradient crema, sombra de canto), animación shake al tirar + ciclo rápido de números.
Dado físico: grilla 1-6, se toca el número y se mueve la ficha.
Barra de pasos: 6 pasos con ícono, resalta el actual en dorado.
Colores de categoría: amarillo #F5B429, azul #2E8FD4, naranja #EE7B33, verde #5AB44E, rojo #E24B4B.