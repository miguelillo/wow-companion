# Qué debe hacer el addon

Especificación completa del addon de World of Warcraft: Forever. Sirve como prompt de
trabajo: cada apartado dice qué se construye, qué es innegociable y cómo se comprueba.

El addon es **la pieza fuerte del proyecto**. La web es el sitio donde se escribe y se
consulta la guía; el addon es donde se usa. Si hay que elegir entre pulir prosa y mejorar
el addon, gana el addon.

Todo el código en inglés sin excepción: nombres de fichero, variables, funciones, claves,
comentarios y mensajes de commit. El español vive solo en los textos que ve el jugador,
y esos salen del diccionario, nunca incrustados en la lógica.

---

## 1. Las reglas que no se rompen

Estas no son preferencias. Romper cualquiera de ellas es motivo de baneo para el jugador,
de retirada del addon, o de problema legal para el proyecto.

| Regla | Por qué |
| --- | --- |
| **Nunca automatiza una acción de juego.** Selecciona la receta y pone la cantidad; el jugador pulsa Crear. | Automatizar es baneable. La frontera es: el addon prepara, la persona ejecuta. |
| **Nunca optimiza la ruta.** El orden lo manda la guía. | Un optimizador manda al jugador a sitios donde todavía no puede estar. El orden es una decisión editorial, no un problema de grafos. |
| **Nunca lee memoria ni envía pulsaciones.** | Baneable. El cliente de escritorio, cuando exista, solo toca ficheros en disco. |
| **Nunca sale a la red.** La única salida es SavedVariables. | Los addons no tienen red. El puente con la web es la cadena de transferencia. |
| **Nunca extrae arte del cliente.** Ni tiles de mapa, ni texturas propias de Blizzard más allá de las que la API expone para uso normal. | Arte con copyright. El mapa vectorial de la web lo dibujamos nosotros. |
| **Gratis y con el Lua a la vista.** Sin ofuscar, sin empaquetar. | Política de Blizzard para addons. |
| **Coordenadas de misiones: solo de fuentes abiertas**, comprobando la licencia y registrando la atribución. | La única base abierta es la de Questie. Sin licencia verificada, no se importa. |

Y una regla de producto: **los ids de paso son estables y no se reutilizan jamás**. Un id
reutilizado marca como hecho un paso que el jugador nunca hizo.

---

## 2. Lo que ya está construido

No hay que rehacerlo. Está en `addon/WowForeverCompanion/`, son ocho módulos y 1.377
líneas, con 31 pruebas que corren fuera del juego.

| Módulo | Qué hace |
| --- | --- |
| `Json.lua` | Codifica con claves ordenadas y descodifica. Sin dependencias. |
| `Codec.lua` | Cadena de transferencia: `WCP1:` (deflate+base64) y `WCP1U:` (base64). LibDeflate es opcional. |
| `Progress.lua` | Lógica pura: estado, id de personaje, siguiente paso, avance, búsqueda de tramo. Sin tocar frames. |
| `Core.lua` | SavedVariables, eventos, cambio de modo, comandos `/wfc`. |
| `UI.lua` | Marco base, arrastre, posición persistida. |
| `Leveling.lua` | Ventana estrecha de leveleo. |
| `Profession.lua` | Panel acoplado al de oficio. Detecta `C_TradeSkillUI` o `GetTradeSkillLine`. |
| `Map.lua` | Pines y tramos por HereBeDragons. **Es lo que hay que ampliar.** |

El contrato con la web es el esquema Zod de `web/src/schemas/step.ts`, exportado a
`shared/contracts/`. Ya está probado de ida y vuelta entre TypeScript y Lua.

---

## 3. Rutas en el mapa — lo que falta

Hoy `Map.refresh()` pinta como mucho **tres pines de la zona actual** y une los
consecutivos con una línea de guiones. Es un esbozo. Esto es lo que debe llegar a hacer.

### 3.1 El problema de datos, primero

`placeSchema` es **un punto por paso**: `{ zone, x, y }`. Con un punto por paso no se
puede dibujar una ruta, solo una recta entre dos puntos, y una recta entre dos puntos de
Desolace atraviesa una montaña.

Antes de tocar `Map.lua` hay que extender el contrato, **una sola vez, en Zod**, y
regenerar `shared/contracts/`:

```ts
// web/src/schemas/primitives.ts
export const placeSchema = z.object({
  zone: keySchema,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

/** El camino que se recorre para hacer un paso. El primer punto es el destino del paso
 *  anterior; el último es donde ocurre la acción. Sin esto solo se puede dibujar una
 *  recta, y una recta no respeta la orografía. */
export const pathSchema = z.array(placeSchema).min(2);
```

y en `stepSchema`:

```ts
place: placeSchema.optional(),   // dónde ocurre la acción (ya existe)
path: pathSchema.optional(),     // cómo se llega hasta allí (nuevo)
```

`path` es opcional a propósito: un paso sin `path` se dibuja como recta desde el paso
anterior, que es lo que hay hoy y sigue siendo mejor que nada. Ir rellenando `path` es
trabajo editorial continuo, no un requisito para publicar.

**Regla de contenido:** `place` se rellena desde el primer día en todo paso que ocurra en
un sitio concreto. `path` se rellena en los tramos donde la recta engaña.

### 3.2 Qué se dibuja

**En el mapa de zona:**

- **Un pin por paso** de la zona visible, no solo tres. Numerados en el orden de la guía,
  empezando por el siguiente paso pendiente.
- **Los pasos ya hechos** se dibujan también, atenuados, sin número. El jugador quiere ver
  de dónde viene.
- **La ruta** une los pines en **el orden de la guía**, siguiendo `path` cuando existe y
  en recta cuando no. Nunca se reordena.
- **Degradado de intensidad:** el tramo inmediato a todo color, los siguientes más tenues.
  A cinco pasos vista la ruta debe ser sugerencia, no ruido.

**En el mapa de continente y en el mundial:** ni pines de paso ni ruta detallada. Solo un
marcador por zona con el tramo de niveles que cubre. A esa escala la ruta fina es una
mancha.

**En el minimapa:** el siguiente paso y solo ese, con flecha en el borde cuando queda
fuera. Dos pines en el minimapa ya es demasiado.

**Entre zonas:** cuando el siguiente paso está en otra zona, no se dibuja una línea que
cruce el borde. Se marca la salida hacia esa zona y se dice en el pin a dónde lleva.
Dibujar una recta entre zonas es exactamente el error que manda a la gente a nadar.

### 3.3 Cómo se dibuja

La API no tiene primitiva de polilínea. Hay dos caminos y el segundo es el bueno:

- Cadena de texturas pequeñas rotadas, que es lo que hace hoy `drawLeg`. Funciona, pero
  cuesta un frame por guion y con una ruta entera se van cientos.
- **`Texture:SetTexCoord` con rotación sobre una textura estirada**, un frame por tramo en
  vez de uno por guion. Es lo que hay que usar para rutas largas.

En cualquiera de los dos:

- **Todo va agrupado (pooling).** Nada de crear frames en cada refresco. Ya hay `acquire`
  y `releaseAll`; hay que mantenerlos.
- **Se redibuja solo cuando cambia algo:** al abrir el mapa, al cambiar de zona, al marcar
  un paso, al cambiar de nivel. Nunca en `OnUpdate`.
- **Presupuesto:** una ruta de 40 pasos debe redibujarse en menos de 16 ms. Si no cabe, se
  recorta el horizonte antes que perder frames.

### 3.4 La flecha

Si TomTom está instalado, **TomTom es el dueño de la flecha**. Dos flechas es peor que
una. `Map.setWaypoint` ya delega. Sin TomTom, el addon dibuja su propia flecha con
`Map.headingTo`, que devuelve rumbo y distancia, y `nil` bajo techo, donde el juego no
sabe situar al jugador.

---

## 4. El resto del comportamiento

### 4.1 Los dos modos

Se eligen solos, sin que el jugador configure nada:

- **Panel de oficio abierto** → modo profesión, acoplado al lado del panel, siguiendo la
  habilidad real leída del juego.
- **Cualquier otra situación** → modo leveleo, ventana estrecha.

### 4.2 Avance

- **Automático por eventos:** subir de nivel, ganar punto de habilidad, entregar misión.
- **Casilla manual** para marcar, y **botón Saltar** para lo que no se quiere hacer.
- **Nunca se desmarca solo.** Marcado gana siempre, igual que en la web.

### 4.3 Salirse de la ruta

- El addon **sigue al jugador**: si se va a una zona con guía, se mueve al tramo de esa
  zona y lo dice en el chat, en una línea.
- Si la zona no está en ninguna guía, lo dice **una vez** y se queda quieto. No insiste.

### 4.4 Cadena de transferencia

- `/wfc export` copia la cadena; `/wfc import <cadena>` la lee.
- Dos prefijos: `WCP1:` comprimido, `WCP1U:` sin comprimir. **Ambos se leen siempre**,
  haya LibDeflate o no. Solo cambia cuál se escribe.
- La fusión es la misma regla que en la web: **marcado gana a no marcado**, `max` para
  nivel y habilidad, el registro más reciente gana en los campos de identidad.

### 4.5 Comandos

`/wfc` y `/companion`: `export`, `import`, `skip`, `map`. Cualquiera nuevo se documenta en
`addon/README.md` el mismo día.

### 4.6 Idioma

Los textos salen del diccionario. Nada de cadenas en español dentro de la lógica. Las
guías se generan a `Guides/en.lua` y `Guides/es.lua` con `pnpm run addon:export`, y **no se
editan a mano nunca**.

---

## 5. Las trampas de Lua 5.1

El juego corre **Lua 5.1**. No es 5.4, y las diferencias que importan **no las detecta
ningún compilador**, ni siquiera `luac5.1`. Las tres que ya han mordido:

| Escrito | Qué pasa en el juego |
| --- | --- |
| `'\u{2022}'` | 5.1 no rechaza el escape que no conoce: se come la barra. En pantalla sale `u{2022}`. |
| `math.atan(dy, dx)` | 5.1 **ignora el segundo argumento en silencio** y devuelve un ángulo mal. Se escribe `math.atan2`. |
| Una línea en el `.toc` que apunte a un fichero no incluido | Error de carga por línea, antes de que corra nada nuestro. |

Por eso existe `addon/tests/lint.lua`, que rechaza las tres, y por eso CI instala
**lua5.1** y no 5.4. **Cada guardia del lint se prueba reintroduciendo el fallo que
describe**: un lint que nunca ha fallado no demuestra nada.

Lista corta de lo prohibido por ser 5.2+: `goto`, etiquetas `::x::`, `//`, operadores de
bits (`&`, `|`, `~`, `<<`, `>>`), `\z`, `table.unpack` (en 5.1 es `unpack`), `math.type`,
`math.tointeger`, la librería `utf8`.

---

## 6. Cómo se comprueba que está bien

Nada se da por bueno sin esto:

1. `luac5.1 -p` sobre todos los módulos **y las guías generadas**.
2. `lua5.1 tests/lint.lua` — escapes, `atan`, ficheros del `.toc`.
3. `lua5.1 tests/run.lua` — la lógica pura, fuera del juego.
4. **Ida y vuelta entre implementaciones:** una cadena hecha en la web la lee el addon, y
   una cadena hecha en el addon la lee la web. Es lo único que valida un contrato escrito
   dos veces.
5. En el juego: entrar sin un solo error de Lua, con el addon como único addon activo.

Para las rutas, además:

6. Una ruta de 40 pasos no baja de los frames al abrir el mapa.
7. Ningún tramo cruza un borde de zona.
8. Con TomTom instalado hay **una** flecha, no dos.
9. Sin HereBeDragons el addon carga igual, sin pines y sin quejarse más de una vez.

---

## 7. Orden sugerido

1. Extender `placeSchema`/`stepSchema` con `path` y regenerar `shared/contracts/`.
2. Reescribir el dibujo de tramos con `SetTexCoord`, un frame por tramo.
3. Ruta completa del tramo actual, numerada y con degradado, en el mapa de zona.
4. Pines de continente por zona y tramo de niveles.
5. Pin de minimapa con flecha de borde.
6. Rellenar `path` en los tramos donde la recta engaña, empezando por Desolace,
   Stranglethorn y Dustwallow.

Los puntos 1 y 2 son la base: sin ellos, el 3 no se sostiene.
