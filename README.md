<p align="center">
  <img src="web/public/og-default.png" alt="WoW Companion — guías y progreso para World of Warcraft: Forever" width="760">
</p>

# wow-companion

Companion en español (y en inglés) para **World of Warcraft: Forever**, la tercera rama
permanente de WoW anunciada el 12 de septiembre de 2026, con beta desde el 17 de
septiembre y lanzamiento el 4 de noviembre de 2026.

No es sólo una web de guías: el personaje del jugador está en el centro. La web muestra el
pulso del juego (qué ha cambiado, qué está abierto, cómo van los reinos) y, debajo, los dos
o tres pasos que te tocan ahora en profesión y en leveleo, calculados a partir de tu
progreso.

> Web de fans, sin afiliación ni respaldo de Blizzard Entertainment. World of Warcraft y
> Warcraft son marcas de Blizzard Entertainment, Inc.

El logo es una cresta forjada, y dentro está la ruta del jugador: una traza discontinua que
pasa por los puntos ya hechos y apunta al siguiente, todavía sin alcanzar, dibujando una W.
Los archivos están en `web/public/`: `logo-mark.svg` (la cresta completa, de 48 px para
arriba), `logo-mark-compact.svg` (sin degradados y con la W maciza, para el icono del
navegador y la cabecera), `logo.svg` (cresta y nombre) y `og-default.png` (imagen social).

## Piezas

| Carpeta            | Qué es                                                               | Estado    |
| ------------------ | -------------------------------------------------------------------- | --------- |
| `web/`             | Sitio estático en Astro 7 + TypeScript, islas de React para lo vivo  | Fase 1 ✅ |
| `api/`             | API .NET 8 Minimal API, PostgreSQL y EF Core                         | Fase 2: `/api/health` y `/api/realm-status` |
| `shared/contracts` | Contrato de paso y progreso en JSON Schema, generado desde Zod       | Fase 1 ✅ |
| `client/`          | App de escritorio .NET que lee los SavedVariables del addon          | Fase 8    |
| `addon/`           | Addon de WoW en Lua                                                   | Fase 7    |

## Levantar el proyecto en local

Necesitas Node 22, pnpm 10 y Docker. El SDK de .NET sólo hace falta si vas a tocar la API
fuera de contenedores.

```bash
cp .env.example .env
pnpm install
pnpm dev            # http://localhost:4321
```

Con todo el stack (web + api + postgres + proxy):

```bash
docker compose up --build   # http://localhost:8080
```

`docker-compose.override.yml` se aplica solo y publica la API en `localhost:5080` y
Postgres en `localhost:5432` para poder trabajar contra ellos sin pasar por el proxy.

### Comandos

| Comando                   | Qué hace                                                    |
| ------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                | Servidor de desarrollo de Astro                              |
| `pnpm build`              | Build estático a `web/dist`                                  |
| `pnpm check`              | Formato, lint, tipos y build: lo mismo que ejecuta CI        |
| `pnpm lint` / `pnpm format` | ESLint y Prettier                                          |
| `pnpm typecheck`          | `astro check` con TypeScript en modo estricto                |
| `pnpm test`               | Pruebas del motor de progreso, con el runner de Node          |
| `pnpm contracts:export`   | Regenera `shared/contracts/*.json` desde los esquemas de Zod |

## Cómo está montado

### Rutas e idiomas

El **inglés es el idioma por defecto** y va sin prefijo; el español vive bajo `/es/`. Los
**slugs están traducidos** porque son contenido (`/professions/alchemy` ↔
`/es/profesiones/alquimia`), y las versiones hermanas se enlazan con un `translationKey`
idéntico en el frontmatter. El mapa de slugs por idioma está en `web/src/i18n/routes.ts`.

Los textos de interfaz viven en `web/src/i18n/ui/`, y ahí el **español sigue siendo la
fuente de verdad**: el inglés está tipado contra él, de modo que una clave que falte rompe
el build. Son dos cosas distintas —qué idioma se sirve sin prefijo y cuál manda en los
tipos— y no hace falta que coincidan.

Cambiar el idioma por defecto es cambiar todas las URLs. Se hizo antes de publicar nada, así
que no costó redirecciones; hacerlo después sí las costaría.

Astro deriva la URL del nombre del fichero, así que el árbol de rutas en español lleva
nombres en español. Para que no haya dos implementaciones, cada fichero de `web/src/pages/`
es un envoltorio de cinco líneas sobre el componente equivalente de `web/src/sections/`.

### Contenido

Las guías son colecciones de contenido con esquema Zod, agrupadas por carpeta de idioma
(`web/src/content/<colección>/{es,en}/`). Los nombres de colección, los campos y las claves
van **en inglés**; el español aparece sólo en el texto y en los slugs.

Toda entrada lleva `lang`, `translationKey`, `updated` y `confirmed`. Mientras Forever esté
en beta, `confirmed` es `false` por defecto y la ficha muestra un distintivo de «sin
confirmar»: es más barato confirmar un dato que desmentirlo.

### Seguimiento de progreso

Todo vive en el navegador hasta que haya cuentas (fase 6). El progreso se guarda en
`localStorage` bajo una sola clave, y **cada lectura y cada escritura puede fallar sin
romper nada**: si el almacenamiento está bloqueado, lo que marques dura lo que dure la
pestaña y se avisa de ello.

La regla al fusionar es siempre la misma, tanto al importar una cadena como al iniciar
sesión más adelante: **gana lo marcado**. Nadie pierde trabajo hecho en otro dispositivo, y
lo peor que puede pasar es repetir un paso.

La cadena de transferencia es `WCP1:` más deflate y base64, usando `CompressionStream` del
navegador, sin dependencias. Es el mismo formato que escribirá el addon en sus
SavedVariables. Donde no exista `CompressionStream` cae a base64 sin comprimir bajo su
propio prefijo, y al importar se entienden los dos.

Con el servidor de desarrollo hay un banco de pruebas en `/laboratorio/progreso`, con una
guía de juguete. No se genera en el build de producción.

### Un aviso sobre los datos de profesiones

Las fuentes confirman que Forever **mueve los escalones de habilidad** de algunas
profesiones: Sastrería sube unos 35 puntos antes que en Classic y Herrería unos 25,
mientras que Alquimia e Ingeniería mantienen los rangos. Copiar una escalera de Classic
receta a receta sería falso en la mitad de los casos, así que las guías se apoyan en lo
que está documentado —los hitos de 150, 225 y 300, los puntos de Legado, la certificación
y los materiales por tramo— y el detalle receta a receta se marca como provisional.

Todas las fichas llevan `confirmed: false` y su aviso de beta. Se irán confirmando con los
parches.

### Contrato con el addon

`web/src/schemas/step.ts` y `web/src/schemas/progress.ts` definen el paso y el progreso una
sola vez. `pnpm contracts:export` los vuelca a `shared/contracts/` como JSON Schema, que es
lo que consumen la API y el cliente de escritorio. Los identificadores de paso son estables
y **nunca se reutilizan**: si una guía cambia, los pasos nuevos llevan ids nuevos, porque
del otro lado hay progreso guardado apuntando a ellos.

### Dato vivo sin romper el sitio estático

Las páginas se generan en build. El estado de reinos lo pide el navegador a
`/api/realm-status`, que cachea la respuesta de Blizzard unos minutos y **sigue sirviendo la
última respuesta buena** cuando Blizzard no contesta: unos minutos de retraso son mejores
que un hueco. Si aun así no hay nada, el endpoint responde 503, la página ya está dibujada y
la tarjeta dice que no hay dato. Nunca un hueco roto ni un error.

Sin `BLIZZARD_CLIENT_ID` y `BLIZZARD_CLIENT_SECRET` el endpoint responde 503 desde el primer
momento, que es exactamente el camino degradado: el sitio se puede desarrollar entero sin
credenciales.

Ojo con el namespace: el estado de reinos vive en el namespace **dinámico**
(`BLIZZARD_DYNAMIC_NAMESPACE`), no en el estático. No son intercambiables.

## Datos de la API de Blizzard

Pendiente (fase 10). Cuando llegue, `scripts/fetch-game-data.ts` autenticará con client
credentials contra `https://oauth.battle.net/token` y volcará el resultado normalizado a
`web/src/data/*.json`, versionado en git.

**Ojo con el namespace.** Hoy la API de Blizzard sólo documenta namespaces de retail y de
los sabores Classic (`static-classic1x-{region}`, `static-classicann-{region}`…). **No hay
namespace confirmado para Forever.** Por eso el namespace se pasa por variable de entorno
(`BLIZZARD_NAMESPACE`) y hay que revisarlo en cuanto Blizzard lo publique. El sitio compila
perfectamente aunque esos JSON vengan vacíos, y así debe seguir siendo.

## Reglas que no se saltan

- No se scrapea ni se copia Wowhead, WowDB ni Icy Veins. Escribimos nuestras guías y
  enlazamos a ellos. Si algún día queremos tooltips, se usa el script oficial de Wowhead.
- Disclaimer de fan site en el pie de todas las páginas.
- Cada dato lleva su fuente, y las fichas con información de beta avisan de que puede
  cambiar.
- Nada de traducción automática publicada sin revisar: antes falta la guía y se marca como
  pendiente.

## Plan de trabajo

Una fase por rama, revisión antes de seguir.

1. **Esqueleto y novedades** ✅ — monorepo, Astro, TypeScript estricto, lint, rutas
   bilingües, diccionario, tema claro/oscuro, portada con el pulso del juego, colección
   `patches`, Docker Compose y CI.
2. **Estado en vivo** ✅ — endpoint cacheado de reinos, página `/estado` y la tarjeta de la
   portada conectada, degradando con elegancia cuando no hay dato.
3. **Motor de seguimiento local** ✅ — almacenamiento, selector de personaje, lista
   marcable reutilizable, próximos pasos y transferencia por cadena de texto.
4. **Profesiones** ✅ — las doce guías 1–300, marcables, y el planificador.
5. **Leveleo** ✅ — 29 zonas, la ruta 1–60 por facción y el selector de nivel.
   _Hasta aquí, publicado antes del 4 de noviembre de 2026._
6. API y cuentas: Battle.net OAuth, Postgres, fusión de progreso, códigos de emparejamiento.
7. Addon: los dos modos, avance automático, pines con HereBeDragons, `addon:export`.
8. Cliente de escritorio: bandeja, vigilancia de SavedVariables, emparejamiento.
9. Oro, empezar, mazmorras y raids.
10. Datos de Blizzard: `data:sync`.
11. Mapa interactivo: SVG de zonas, zoom y marcadores ligados al progreso.
12. SEO y pulido: imágenes OG por página, datos estructurados y auditoría de Lighthouse.

Más detalle en `docs/`.
