# Contrato entre la web, el addon y el cliente de escritorio

Fuente de verdad: `web/src/schemas/step.ts` y `web/src/schemas/progress.ts`.
`pnpm contracts:export` los vuelca a `shared/contracts/*.json` como JSON Schema, que es lo
que consume la parte .NET. Versión actual: `shared/contracts/VERSION`.

## Por qué existe antes que el addon

El cliente de escritorio lee lo que escribe el addon, y el addon consume guías generadas
desde las colecciones de contenido. Si el contrato se decide al final, hay que repasar todo
el contenido a mano. Por eso los esquemas están cerrados desde la fase 1.

## Paso

```ts
{ id, from, to, action, materials?, note?, place? }
```

`place` es `{ zone, x, y }`, con la coordenada en tanto por ciento dentro de la zona, tal y
como las usa el juego. `zone` es la clave en inglés, nunca traducida.

Los `id` siguen el patrón `prof-<profesion>-NNN` o `lvl-<faccion>-NNN`, son estables y no se
reutilizan jamás.

## Progreso

Por personaje: `{ name, realm, class, level, professions: { [key]: { skillLevel,
completedSteps } }, updatedAt }`. La clave de personaje es `nombre-reino` en minúsculas y
sin acentos. `updatedAt` viaja como cadena ISO 8601, no como fecha: cruza JSON, Lua y C#.

## Restricciones de plataforma que condicionan el diseño

Ninguna se puede sortear, y todas son de Blizzard:

- Los addons de WoW **no pueden hacer peticiones de red**. La API de Lua no lo expone.
- La única salida de datos es **SavedVariables**, el fichero Lua que el cliente del juego
  escribe al desloguear, salir o hacer `/reload`.
- Sólo se puede escribir en esa carpeta **con el juego cerrado**: al salir, WoW sobrescribe
  sus propios SavedVariables.
- Los addons deben ser gratuitos y con el Lua a la vista.
- El cliente de escritorio **sólo toca ficheros en disco**. Leer memoria del juego o enviar
  pulsaciones es baneable y queda descartado.

De ahí sale el diseño: el addon serializa su estado ya comprimido (deflate + base64) en una
sola cadena dentro de SavedVariables, y el cliente de escritorio sólo extrae esa cadena y la
descomprime, sin parsear Lua de verdad.

## Lo que el addon nunca hace

- Automatizar el crafteo o cualquier acción de juego. Selecciona la receta y pone la
  cantidad; el botón de crear lo pulsa el jugador.
- Optimizar la ruta. El orden lo manda la guía: las cadenas de misiones tienen
  prerrequisitos, y un optimizador manda al jugador donde todavía no puede ir.
- Copiar rutas, datos o código de Zygor o RestedXP. El patrón de interacción es de todos;
  su base de rutas es literalmente lo que venden.
