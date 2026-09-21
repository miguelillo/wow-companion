import type { Dictionary } from './es';

/** Typed against the Spanish dictionary: a missing or misspelled key fails the build. */
const en: Dictionary = {
  'site.name': 'WoW Companion',
  'site.tagline': 'Guides and progress for World of Warcraft: Forever',

  'a11y.skipToContent': 'Skip to content',
  'a11y.mainNav': 'Main navigation',

  'nav.home': 'Home',
  'nav.status': 'Status',
  'nav.start': 'Get started',
  'nav.leveling': 'Leveling',
  'nav.professions': 'Professions',
  'nav.gold': 'Gold',
  'nav.dungeons': 'Dungeons',
  'nav.raids': 'Raids',
  'nav.classes': 'Classes',
  'nav.patches': 'Patches',
  'nav.menu': 'Menu',
  'nav.close': 'Close',

  'theme.toggle': 'Switch theme',
  'theme.light': 'Light theme',
  'theme.dark': 'Dark theme',

  'lang.label': 'Language',
  'lang.switch': 'View this page in {language}',
  'lang.missing': 'This page is not in {language} yet. Taking you to the home page.',

  'home.meta.title': 'World of Warcraft: Forever — news, realm status and guides',
  'home.meta.description':
    'What changed in World of Warcraft: Forever, which content is open, how the realms are doing, and the next thing your character should do. Short and practical.',
  'home.hero.title': 'World of Warcraft: Forever, without the padding',
  'home.hero.body':
    'Level 60, the Azeroth you remember, and a third branch that starts from scratch on 4 November 2026. Here is what changed this week and what you should do next.',

  'home.news.title': 'What changed',
  'home.news.empty': 'No news published yet.',
  'home.news.all': 'See all patches',
  'home.news.source': 'Source',

  'home.open.title': 'What is open',
  'home.open.available': 'Available',
  'home.open.upcoming': 'Not open yet',
  'home.open.unknownDate': 'No date',

  'home.realms.title': 'Realm status',
  'home.realms.unavailable': 'No realm data right now. Try again in a few minutes.',
  'home.realms.loading': 'Checking realms…',
  'home.realms.online': 'Up',
  'home.realms.offline': 'Down',
  'home.realms.population': 'Population',
  'home.realms.populationLow': 'low',
  'home.realms.populationMedium': 'medium',
  'home.realms.populationHigh': 'high',
  'home.realms.populationFull': 'full',
  'home.realms.queue': 'Queue',
  'home.realms.noQueue': 'No queue',
  'home.realms.updated': 'Updated {time}',
  'home.realms.all': 'See every realm',

  'home.countdown.title': 'Countdown to launch',
  'home.countdown.remaining': '{days} days to go until 4 November 2026.',
  'home.countdown.tomorrow': 'Tomorrow, 4 November 2026.',
  'home.countdown.today': 'Today is the day: Forever opens on 4 November 2026.',
  'home.countdown.launched': 'Forever has been live since 4 November 2026.',
  'home.countdown.beta': 'The beta has been open since 17 September 2026.',

  'home.next.title': 'Your next steps',
  'home.next.empty': 'Pick your character and we will tell you what to do next.',
  'home.next.emptyCta': 'Add a character',
  'home.next.soon': 'Ready as soon as the profession guides go live.',

  'status.meta.title': 'World of Warcraft: Forever status — realms and open content',
  'status.meta.description':
    'How the World of Warcraft: Forever realms are doing, which content is open today, what is still to come, and how long is left until the 4 November launch.',
  'status.title': 'Game status',
  'status.lead':
    'How the realms are doing and what content is open. Realm data comes from the Blizzard API and we hold it for a few minutes, so it can lag slightly.',
  'status.realms.heading': 'Realms',
  'status.source': 'Source: Blizzard API, realm and connected-realm endpoints.',

  'progress.character.title': 'Your character',
  'progress.character.none': 'You have not added a character yet.',
  'progress.character.add': 'Add character',
  'progress.character.name': 'Name',
  'progress.character.realm': 'Realm',
  'progress.character.class': 'Class',
  'progress.character.level': 'Level',
  'progress.character.save': 'Save',
  'progress.character.cancel': 'Cancel',
  'progress.character.remove': 'Remove',
  'progress.character.removeConfirm':
    'Remove {name}? Their progress disappears from this browser and cannot be recovered.',
  'progress.character.pick': 'Active character',
  'progress.storage.unavailable':
    'Your browser will not let us store data, so anything you tick lasts only while this tab stays open.',

  'progress.steps.done': '{done} of {total} steps',
  'progress.steps.next': 'Next step',
  'progress.steps.needCharacter': 'Add a character and you can start ticking steps off.',
  'progress.steps.materials': 'Materials',
  'progress.steps.skillLevel': 'Skill level',
  'progress.steps.characterLevel': 'Character level',
  'progress.steps.allDone': 'Guide finished. Nicely done.',
  'progress.steps.toggle': 'Mark “{action}” as done',
  'progress.steps.skillRange': 'Skill {from}–{to}',
  'progress.steps.levelRange': 'Level {from}–{to}',

  'progress.next.blocked': 'You need more level or skill for this one.',
  'progress.next.remaining': '{count} to go',
  'progress.next.go': 'Open the guide',

  'progress.transfer.title': 'Take your progress with you',
  'progress.transfer.lead':
    'Generate a string, keep it, and paste it into another browser or device. No account needed.',
  'progress.transfer.export': 'Generate string',
  'progress.transfer.copy': 'Copy',
  'progress.transfer.copied': 'Copied',
  'progress.transfer.import': 'Import',
  'progress.transfer.importLabel': 'Paste your string here',
  'progress.transfer.imported': 'Done: your progress has been merged with what was already here.',
  'progress.transfer.importFailed':
    'That string is not one of ours. Copy all of it, starting at WCP1.',
  'progress.transfer.mergeNote':
    'Importing deletes nothing: it merges with what you have, and ticked wins over unticked.',

  'patches.meta.title': 'World of Warcraft: Forever patch notes and news',
  'patches.meta.description':
    'Every change in World of Warcraft: Forever by date, summarised in our own words, each one linking to its official source.',
  'patches.title': 'Patches and news',
  'patches.lead': 'What changes in Forever, by date. Every entry links to its source.',
  'patches.empty': 'No entries yet.',
  'patches.rss': 'Subscribe by RSS',

  'beta.badge': 'Unconfirmed',
  'beta.notice':
    'Forever is in beta: this may change before launch. We review it with every patch.',

  'pending.badge': 'In progress',
  'pending.lead': 'This section is not written yet.',
  'pending.eta': 'It will be live before 4 November 2026.',
  'pending.back': 'Back to the home page',

  'card.updated': 'Updated {date}',
  'card.levelRange': 'Level {from}–{to}',

  'footer.disclaimer':
    'Fan site, not affiliated with or endorsed by Blizzard Entertainment. World of Warcraft and Warcraft are trademarks of Blizzard Entertainment, Inc. All other trademarks are the property of their respective owners.',
  'footer.sources': 'We write our own guides and cite a source for every fact.',
  'footer.repo': 'Source on GitHub',

  'error.404.title': 'This page does not exist',
  'error.404.body': 'We may have moved it, or it may not be written yet.',
};

export default en;
