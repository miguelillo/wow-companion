# Cómo se escribe el contenido

## Tono

Tuteo, directo y práctico. Frases cortas. Si una pantalla obliga a leer tres párrafos para
saber qué hacer a continuación, está mal escrita. Ante la duda: menos texto.

El diferenciador frente a Wowhead no es tener más datos, es responder a «¿y ahora qué?».

## Idioma

- El contenido y los slugs van traducidos. Todo lo demás (colecciones, campos, claves,
  ids de paso) va en inglés.
- Los nombres de zona, mazmorra, clase y profesión **no se traducen nunca** en los
  identificadores: son el contrato con el addon y con el progreso guardado, y además la
  comunidad hispanohablante usa los nombres en inglés.
- En el texto visible, la zona se nombra en inglés y el resto de la frase en español:
  «de 10 a 20 en Westfall, y a Deadmines en cuanto tengas grupo».
- Nada de traducción automática publicada sin revisar. Mejor que falte y esté marcada como
  pendiente.

## Fuentes y copyright

- No se copia ni se scrapea Wowhead, WowDB ni Icy Veins. Se enlaza.
- Las notas de parche se **resumen con nuestras palabras** y se enlaza a la fuente oficial;
  nunca se pegan literales.
- Cada dato tiene fuente. El campo `sources` del frontmatter es para eso.
- Coordenadas de misión: la API de Blizzard no las expone. La única fuente abierta es la
  base de datos del addon Questie; antes de importar nada hay que revisar su licencia y
  dejar constancia de la atribución.

## Beta

Mientras Forever esté en beta, `confirmed: false` es el valor por defecto y la ficha muestra
el distintivo de «sin confirmar». Sólo se marca `confirmed: true` cuando el dato está
verificado en una fuente citada. Es más barato confirmar un dato que desmentirlo.

## Pasos

Toda guía larga es una lista de pasos ordenada y marcable, con este esquema:

```ts
{ id, from, to, action, materials?, note?, place? }
```

- `id` es estable y **nunca se reutiliza**. Si reescribes un paso, lleva un id nuevo: al
  otro lado hay progreso guardado apuntando al viejo.
- `from` y `to` son niveles en leveleo y puntos de habilidad en profesiones.
- `place` se rellena **desde el primer día** en todo paso que ocurra en un sitio concreto,
  aunque el mapa todavía no exista. Añadirlo después obliga a repasar cada guía a mano.

## Metadatos

`title` y `description` se escriben, no se generan con plantilla: son el `<title>` y la meta
descripción de esa página. Los límites del esquema (70 y 160 caracteres) están puestos para
que quepan en un resultado de Google sin cortarse.
