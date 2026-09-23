# Runbook: levantar esto y probarlo

Dos piezas independientes: el sitio con su API, y el addon. Puedes probar una sin la otra.

## 1. El sitio y la API

### En tu máquina, en un minuto

```bash
git clone https://github.com/miguelillo/wow-companion.git
cd wow-companion
cp .env.example .env
pnpm install
pnpm dev                      # http://localhost:4321
```

Con eso ves todo el contenido y el motor de progreso funcionando. La tarjeta de reinos dirá
que no hay dato, que es el camino degradado correcto: el endpoint vive en la API.

### Con la API y Postgres

```bash
docker compose up --build     # http://localhost:8080
```

`docker-compose.override.yml` se aplica solo en local y publica la API en `localhost:5080`.
Comprueba que responde:

```bash
curl localhost:5080/api/health
curl -i localhost:5080/api/realm-status    # 503 esperado sin credenciales
```

Para que el estado de reinos traiga datos de verdad necesitas credenciales de Blizzard.
Sácalas en <https://develop.battle.net/access/clients> y ponlas en `.env`:

```
BLIZZARD_CLIENT_ID=...
BLIZZARD_CLIENT_SECRET=...
BLIZZARD_DYNAMIC_NAMESPACE=dynamic-classic1x-eu
BLIZZARD_REGION=eu
```

**Ojo con el namespace**: el estado de reinos vive en el dinámico, no en el estático, y
todavía no hay namespace publicado para Forever. Apúntalo a un sabor de Classic para
probar la tubería; cuando Blizzard publique el de Forever, se cambia aquí y ya está.

### En el VPS

```bash
ssh tu-vps
git clone https://github.com/miguelillo/wow-companion.git
cd wow-companion
cp .env.example .env          # rellena POSTGRES_PASSWORD y PUBLIC_SITE_URL
docker compose -f docker-compose.yml up -d --build
```

El `-f docker-compose.yml` explícito es importante: sin él, Compose aplicaría también el
override de desarrollo, que abre puertos que no quieres abiertos.

Para TLS, pon `SITE_ADDRESS=tudominio.com` en `.env` y publica el 443. Caddy pide y renueva
el certificado solo.

Actualizar: `git pull && docker compose -f docker-compose.yml up -d --build`.

## 2. El addon

```bash
pnpm run addon:export
```

Eso genera `addon/WowForeverCompanion/Guides/{en,es}.lua` a partir del contenido. Sin ese
paso el addon carga pero no tiene guías.

Copia la carpeta `addon/WowForeverCompanion/` entera a:

```
World of Warcraft/_classic_/Interface/AddOns/WowForeverCompanion/
```

Entra al juego. Si el addon no aparece en la lista, marca «Cargar addons obsoletos»: la
versión de interfaz del `.toc` habrá que ajustarla cuando Forever publique la suya.

### Qué probar, y en qué orden

1. **`/wfc`** — debería abrirse la ventana estrecha con el primer paso de la ruta de tu
   facción. La facción y el nivel los lee del personaje, no los pregunta.
2. **Sube un nivel** — el paso debería avanzar solo, sin tocar nada.
3. **Cámbiate de zona** a una que esté en la ruta — una línea en el chat diciendo a qué
   tramo se ha movido. Vete a una que no esté (Moonglade, por ejemplo) y debería decirlo
   una sola vez y quedarse quieto.
4. **Abre una profesión** — la ventana debería saltar a modo profesión, acoplarse al lado
   del panel del oficio y situarse en el paso que te toca según tu habilidad real.
5. **Pulsa el cuerpo de la ventana** en modo profesión — debería seleccionar la receta en
   el panel del oficio. El botón de crear lo pulsas tú: eso no lo automatiza.
6. **`/wfc export`** — sale un recuadro con la cadena. Cópiala, ve a la web, pégala en
   «Llevarte el progreso» e impórtala. Tu personaje y tus pasos deberían aparecer.
7. **Al revés**: marca cosas en la web, exporta allí, y en el juego `/wfc import <cadena>`.

Los pasos 6 y 7 son el contrato entre las dos mitades y están cubiertos por pruebas
automáticas, pero verlo funcionar de verdad es otra cosa.

### Librerías opcionales

Sin ellas funciona, con avisos. Para activar todo, descarga y pon en
`WowForeverCompanion/Libs/`. Ojo: el `.toc` **no** las lista. Una línea que apunte a un
fichero que no enviamos es un error de carga, que es justo lo que dio la primera versión
al entrar. Se buscan en tiempo de ejecución, así que basta con instalarlas como addons
sueltos; si prefieres meterlas en `Libs/`, descomenta las cuatro líneas del `.toc`:

- **LibStub** — la necesitan las otras dos.
- **LibDeflate** — comprime la cadena de transferencia. Sin ella la cadena es más larga,
  nada más.
- **HereBeDragons 2.0 y HereBeDragons-Pins-2.0** — pines y ruta en el mapa. Sin ellas no
  hay pines; la ventana sigue igual.
- **TomTom** — si la tienes, la flecha de rumbo es suya y nosotros no pintamos otra.

No van incluidas porque son código de otros con sus propias licencias.

## Lo que no se puede probar todavía

- **El cliente de escritorio** no existe (fase 8). Por ahora el puente entre el addon y la
  web es copiar y pegar la cadena.
- **Las cuentas** no existen (fase 6). El progreso vive en tu navegador y en tus
  SavedVariables, y viaja a mano.
- **Los datos de Blizzard** (`data:sync`) son de la fase 10.

## Si algo falla

| Síntoma | Causa probable |
| --- | --- |
| La tarjeta de reinos dice que no hay dato | Normal sin credenciales. Comprueba `/api/health` |
| `/api/realm-status` devuelve 503 con credenciales | Namespace equivocado: tiene que ser el dinámico |
| El addon no sale en la lista | Versión de interfaz del `.toc`; marca cargar obsoletos |
| El addon carga pero no hay pasos | Falta `pnpm run addon:export` antes de copiar |
| `/wfc import` dice que la cadena no es nuestra | Cópiala entera, empieza por `WCP1` |
| Sin pines en el mapa | Falta HereBeDragons: instálala como addon suelto |
| `Error loading ...Libs/...` al entrar | Estás en una versión anterior a la 0.1.1: bájate el zip nuevo |
| Texto con `u{2022}` o `u{2013}` | Lo mismo: corregido en la 0.1.1 |
