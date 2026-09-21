/**
 * Spanish is the source of truth for interface copy. Every other language is typed
 * against this object, so a missing key is a build error instead of a blank label.
 * Guide content lives in src/content, never here.
 */
const es = {
  'site.name': 'WoW Companion',
  'site.tagline': 'Guías y progreso para World of Warcraft: Forever',

  'a11y.skipToContent': 'Saltar al contenido',
  'a11y.mainNav': 'Navegación principal',

  'nav.home': 'Portada',
  'nav.status': 'Estado',
  'nav.start': 'Empezar',
  'nav.leveling': 'Leveleo',
  'nav.professions': 'Profesiones',
  'nav.gold': 'Oro',
  'nav.dungeons': 'Mazmorras',
  'nav.raids': 'Raids',
  'nav.classes': 'Clases',
  'nav.patches': 'Parches',
  'nav.menu': 'Menú',
  'nav.close': 'Cerrar',

  'theme.toggle': 'Cambiar tema',
  'theme.light': 'Tema claro',
  'theme.dark': 'Tema oscuro',

  'lang.label': 'Idioma',
  'lang.switch': 'Ver esta página en {language}',
  'lang.missing': 'Esta página todavía no está en {language}. Te llevamos a la portada.',

  'home.meta.title': 'World of Warcraft: Forever en español: novedades, reinos y guías',
  'home.meta.description':
    'Qué ha cambiado en World of Warcraft: Forever, qué contenido está abierto, cómo van los reinos y qué te toca hacer ahora en tu personaje. En español y al grano.',
  'home.hero.title': 'World of Warcraft: Forever, al grano',
  'home.hero.body':
    'Nivel 60, el Azeroth de siempre y una rama nueva que empieza de cero el 4 de noviembre de 2026. Aquí está lo que ha cambiado esta semana y lo que te toca hacer ahora.',

  'home.news.title': 'Novedades',
  'home.news.empty': 'Todavía no hay novedades publicadas.',
  'home.news.all': 'Ver todos los parches',
  'home.news.source': 'Fuente',

  'home.open.title': 'Qué está abierto',
  'home.open.available': 'Disponible',
  'home.open.upcoming': 'Por abrir',
  'home.open.unknownDate': 'Sin fecha',

  'home.realms.title': 'Estado de reinos',
  'home.realms.unavailable': 'No hay dato de reinos ahora mismo. Vuelve a probar en unos minutos.',
  'home.realms.loading': 'Consultando reinos…',
  'home.realms.online': 'En línea',
  'home.realms.offline': 'Caído',
  'home.realms.population': 'Población',
  'home.realms.populationLow': 'baja',
  'home.realms.populationMedium': 'media',
  'home.realms.populationHigh': 'alta',
  'home.realms.populationFull': 'llena',
  'home.realms.queue': 'Cola',
  'home.realms.noQueue': 'Sin cola',
  'home.realms.updated': 'Actualizado {time}',
  'home.realms.all': 'Ver todos los reinos',

  'home.countdown.title': 'Cuenta atrás al lanzamiento',
  'home.countdown.remaining': 'Faltan {days} días para el 4 de noviembre de 2026.',
  'home.countdown.tomorrow': 'Mañana, 4 de noviembre de 2026.',
  'home.countdown.today': 'Hoy es el día: Forever abre el 4 de noviembre de 2026.',
  'home.countdown.launched': 'Forever está en marcha desde el 4 de noviembre de 2026.',
  'home.countdown.beta': 'La beta está abierta desde el 17 de septiembre de 2026.',

  'home.next.title': 'Tus próximos pasos',
  'home.next.empty': 'Elige tu personaje y te decimos qué hacer ahora en profesión y en leveleo.',
  'home.next.emptyCta': 'Crear un personaje',
  'home.next.soon': 'Disponible en cuanto publiquemos las guías de profesiones.',

  'status.meta.title': 'Estado de World of Warcraft: Forever: reinos y contenido abierto',
  'status.meta.description':
    'Cómo van los reinos de World of Warcraft: Forever, qué contenido está abierto hoy, qué falta por abrir y cuánto queda para el lanzamiento del 4 de noviembre.',
  'status.title': 'Estado del juego',
  'status.lead':
    'Cómo van los reinos y qué contenido está abierto. El dato de reinos viene de la API de Blizzard y lo guardamos unos minutos, así que puede ir con un poco de retraso.',
  'status.realms.heading': 'Reinos',
  'status.source': 'Fuente: API de Blizzard, endpoints de realm y connected-realm.',

  'patches.meta.title': 'Parches y novedades de World of Warcraft: Forever',
  'patches.meta.description':
    'Todos los cambios de World of Warcraft: Forever ordenados por fecha, resumidos en español y con enlace a la fuente oficial.',
  'patches.title': 'Parches y novedades',
  'patches.lead': 'Lo que cambia en Forever, por fecha. Cada entrada enlaza a su fuente.',
  'patches.empty': 'Todavía no hay entradas.',
  'patches.rss': 'Suscribirse por RSS',

  'beta.badge': 'Sin confirmar',
  'beta.notice':
    'Forever está en beta: este dato puede cambiar antes del lanzamiento. Lo revisamos con cada parche.',

  'pending.badge': 'En preparación',
  'pending.lead': 'Esta sección todavía no está escrita.',
  'pending.eta': 'Estará publicada antes del 4 de noviembre de 2026.',
  'pending.back': 'Volver a la portada',

  'card.updated': 'Actualizado el {date}',
  'card.levelRange': 'Nivel {from}–{to}',

  'footer.disclaimer':
    'Web de fans, sin afiliación ni respaldo de Blizzard Entertainment. World of Warcraft y Warcraft son marcas de Blizzard Entertainment, Inc. El resto de marcas pertenece a sus respectivos dueños.',
  'footer.sources': 'Escribimos nuestras propias guías y citamos la fuente de cada dato.',
  'footer.repo': 'Código en GitHub',

  'error.404.title': 'Esta página no existe',
  'error.404.body': 'Puede que la hayamos movido o que todavía no esté escrita.',
} as const;

export type DictionaryKey = keyof typeof es;
/** Values are plain strings: only the set of keys is fixed across languages. */
export type Dictionary = Record<DictionaryKey, string>;

export default es;
