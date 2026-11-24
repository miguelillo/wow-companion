# Encargo de diseño — addon de World of Warcraft

Pégalo entero. Es autónomo: no hace falta ver el repositorio.

---

## Qué estás diseñando

La interfaz de un addon de **World of Warcraft: Forever**, una rama permanente del juego
que sale el 4 de noviembre de 2026, con nivel máximo 60 y la Azeroth original. El addon
acompaña al jugador mientras sube de nivel y mientras sube un oficio: le dice cuál es su
siguiente paso, se lo marca en el mapa y le lleva la cuenta.

No es una aplicación web ni móvil. **Va encima de la partida**, ocupando pantalla que el
jugador querría para jugar. Cada píxel que uses tiene que ganárselo.

El addon es lo fuerte del proyecto. La web es donde se escribe la guía; el addon es donde
se usa.

---

## Lo que la API del juego puede dibujar, y lo que no

Esto es lo primero, porque es lo que hace inservible la mayoría de los diseños. El cliente
de WoW **no es un navegador**. No hay CSS, no hay motor de maquetación.

**No existe:**

- Esquinas redondeadas. Solo se consiguen con una textura que ya las tenga dibujadas.
- Sombras paralelas, desenfoque, cristal esmerilado, transparencias compuestas.
- Flexbox, grid, ni nada que reorganice solo. Cada elemento se ancla a otro a mano.
- Fuentes arbitrarias. Solo las que se empaqueten con el addon o las del juego.
- Degradados libres. Solo verticales u horizontales simples, de dos colores.
- Líneas y polilíneas. **No hay primitiva de línea.** Una ruta en el mapa se dibuja como
  una textura estirada y rotada, o como una cadena de trocitos.
- Animación con curvas de suavizado. Hay interpolación, y es tosca.

**Sí existe:**

- Rectángulos con textura, con o sin borde en mosaico.
- Texto con sombra dura de un píxel.
- Máscaras y recortes de textura, rotación, teñido.
- Opacidad por elemento.

**Fuentes del juego, úsalas por nombre:**

| Fuente | Para qué |
| --- | --- |
| Friz Quadrata TT | Títulos y cabeceras. Es *la* voz de Warcraft. |
| Arial Narrow | Texto corrido. Es la que aguanta en tamaños pequeños. |
| Morpheus | Rótulos épicos, con mucha moderación. |

**Diseña con estas restricciones, no a pesar de ellas.** Un diseño que las respete se ve
como parte del juego; uno que no, se ve como una página web pegada encima, y además no se
puede construir.

---

## Tono visual

La interfaz original de WoW 1.x: pergamino oscuro, marcos de metal y oro, rótulos con
serifa. Envejecido y sobrio, no brillante ni corporativo.

Queremos **parecer del juego, pero legible en 2026**. Las dos trampas a evitar:

- **Demasiado fiel:** copiar los marcos ornamentados de 2004 hasta el remache. Se ve
  recargado y come espacio.
- **Demasiado moderno:** interfaz plana gris y azul con tipografía de aplicación. Se ve
  ajeno y rompe la inmersión.

Paleta de partida:

| Color | Uso |
| --- | --- |
| `#FFD100` oro | Acento principal, el paso actual. |
| `#1A1712` pergamino oscuro | Fondos. Con opacidad, nunca opaco del todo. |
| `#C8B896` hueso | Texto corrido. |
| `#7E6018` oro apagado | Oro sobre fondo claro, donde el oro vivo no contrasta. |
| Verde apagado | Hecho. |
| Rojo apagado | Salido de la ruta. |

**El color nunca es la única señal.** Buena parte de los jugadores de WoW juega con ayuda
para daltonismo activada. Hecho, pendiente y saltado tienen que distinguirse por forma o
icono además de por color.

---

## Lo que hay que diseñar

### 1. Ventana de leveleo

Siempre visible durante la partida. Es la pantalla principal.

Muestra: el paso actual, el tramo de niveles que cubre, dos o tres pasos siguientes
atenuados, una casilla para marcar y un botón de saltar.

Restricción dura: **estrecha**. Vive en un lateral, junto a la barra de misiones. Si ocupa
más que la lista de misiones del juego, está mal.

### 2. Panel de oficio

Aparece **acoplado al lado del panel de oficio del juego** cuando el jugador lo abre, y
desaparece al cerrarlo. Tiene que parecer una extensión de ese panel, no una ventana
suelta encima.

Muestra: el paso actual, los materiales con cantidades, la habilidad actual y la que da el
paso.

**Restricción innegociable:** el addon **nunca fabrica nada**. El botón selecciona la
receta y pone la cantidad; el jugador pulsa Crear él mismo. Automatizar acciones de juego
es motivo de baneo. Diseña ese botón de forma que **no prometa** que va a fabricar: no
puede decir «Fabricar» ni parecer el botón de fabricar del juego.

### 3. Mapa: pines y ruta

La parte más visible y la que menos resuelta está.

Sobre el mapa de zona del juego, que ya tiene su propio dibujo debajo:

- **Un pin por paso** de la zona, numerados en el orden de la guía.
- **Los pasos ya hechos**, atenuados y sin número.
- **La ruta** uniendo los pines **en el orden de la guía**. Con degradado de intensidad: el
  tramo inmediato a todo color, los siguientes más tenues. A cinco pasos vista debe ser
  sugerencia, no ruido.
- **Nunca una línea que cruce el borde de una zona.** Cuando el siguiente paso está en otra
  zona se marca la salida hacia allí. Una recta entre zonas manda a la gente a nadar.

Necesito ver cómo resuelves: que la ruta se lea **encima de un mapa que ya es marrón y
tiene relieve**, y que los números no se amontonen cuando dos pasos caen cerca.

Recuerda: no hay primitiva de línea. Tu ruta tiene que poder construirse con texturas
rotadas.

### 4. Pin de minimapa

El siguiente paso, y solo ese. Con flecha en el borde cuando queda fuera. Dos pines en el
minimapa ya es demasiado.

### 5. Exportar e importar

El addon no tiene red. El puente con la web es **una cadena de texto larga** que el
jugador copia y pega. Diseña ese diálogo. Que se entienda que hay que copiarlo todo, y
que se vea cuándo ha funcionado.

### 6. Los estados que casi siempre se olvidan

Enséñamelos, porque son los que más salen en la práctica:

- **Sin personaje todavía.**
- **Zona sin guía.** El addon lo dice una vez y se calla. No insiste.
- **Salido de la ruta**, siguiendo al jugador al tramo nuevo.
- **Tramo terminado.**
- **Guía entera terminada.**

---

## Restricciones que cambian la maquetación

- **Escala de interfaz de 0,64 a 1,0**, en pantallas de 1080p a 1440p y ultrapanorámicas.
  A 0,64 el texto es diminuto: si tu diseño necesita leerse a ese tamaño, no vale.
- **El español ocupa alrededor de un 20 % más que el inglés.** Haz las maquetas en inglés,
  pero **enséñame el caso largo en español**, que es donde revientan. «Skip» → «Saltar»;
  «Done» → «Completado».
- **Todo se puede arrastrar** y la posición se recuerda. Ningún elemento puede depender de
  estar en un sitio concreto de la pantalla.
- **Coexistencia:** el jugador tendrá Questie, TomTom, Details y una barra de acciones
  sustituida. Tu ventana es una más entre muchas, no la protagonista.

---

## Qué quiero de vuelta

1. Las seis pantallas, en su tamaño real en píxeles a escala 1,0.
2. La ventana de leveleo también a escala 0,64, para demostrar que se lee.
3. El mapa con ruta **sobre un fondo de mapa real de WoW**, no sobre blanco.
4. Los estados del punto 6.
5. La paleta y las escalas de tipografía, con los nombres de fuente del juego.
6. Una nota por pantalla diciendo **con qué elementos de la API se construye** cada cosa:
   qué es textura, qué es texto, qué se rota.

Si algo que propones no se puede construir con las restricciones de arriba, dilo en vez de
dibujarlo. Prefiero un diseño más pobre y real que uno bonito e imposible.
