# WoW Companion — addon

Step-by-step levelling and profession guides inside the game, with pins on the map.

The addon is the half of this project that lives where the player does. It reads nothing
from the network — WoW's Lua cannot — so the guides travel embedded in the package and the
only way data leaves is the string it writes into its SavedVariables.

## Installing

Copy `WowForeverCompanion/` into `World of Warcraft/_classic_/Interface/AddOns/`.

The guide files under `Guides/` are generated. If you are building from this repository,
produce them first:

```bash
pnpm run addon:export
```

### Optional libraries

The addon works without any of these and says so rather than breaking. Drop them into
`WowForeverCompanion/Libs/` to turn the features on:

| Library | What it buys you | Without it |
| --- | --- | --- |
| LibStub | Needed by the two below | The others cannot load |
| LibDeflate | Compresses the transfer string | Longer string, same data |
| HereBeDragons (2.0 + Pins) | Pins and the route on the map | No pins; the window still works |
| TomTom | The heading arrow | We do not draw our own |

They are not vendored here because they are other people's code with their own licences.
Take them from CurseForge or their own repositories.

## Using it

The window picks its own mode. Open a profession and it docks beside that window and
follows your real skill; close it and you are back on the levelling route.

| Command | What it does |
| --- | --- |
| `/wfc` | Show or refresh the window |
| `/wfc export` | Produce the transfer string and open it for copying |
| `/wfc import <string>` | Take a string from the website or another character |
| `/wfc skip` | Skip the current step |
| `/wfc map` | Turn map pins on or off |

### What it will not do

- **It never crafts for you.** Clicking a profession step selects the recipe and sets the
  quantity; you press Create. Automating a game action is a ban, and it is not ours to do.
- **It never optimises the route.** The order comes from the guide. Quest chains have
  prerequisites, and a shortest-path optimiser sends you somewhere you cannot go yet.
- **It never nags.** Wander off and it follows you: one line in chat saying which band it
  moved to, and nothing more. If the zone is on no route it says so once and sits still.

## How the progress gets out

WoW writes SavedVariables when you log out, reload or quit — there is no other door. On
the way out the addon puts its whole state into one compressed string:

```
WCP1:<base64 of raw-deflate of JSON>     with LibDeflate
WCP1U:<base64 of JSON>                   without it
```

The desktop client only has to find that string and decompress it: no Lua parsing. The web
produces and reads the same two forms, so a string made on either side imports on the
other. That round trip is covered by `addon/tests/run.lua` and by the web's own tests.

## Testing

The pure logic — the transfer format, step advance, and what happens when you leave the
route — runs outside the game:

```bash
lua5.4 tests/run.lua
```

Anything touching frames or the WoW API cannot be tested here and is marked as such in the
code. The trade skill API differs between client families and Forever's is not published
yet, so `Profession.lua` detects what exists rather than assuming.

## Publishing

Updates go out as a new version on CurseForge. The guides ride along in the package, so
publishing a version is how a content change reaches players.

## Borrowed and not borrowed

The interaction pattern — a small window, one objective, automatic advance — is the one
Zygor and RestedXP established, and it belongs to everyone. Their routes, their data and
their code do not: that database is literally what they sell. Nothing here comes from them.
