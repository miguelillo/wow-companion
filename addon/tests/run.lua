-- Runs the addon's pure-logic modules outside the game. WoW's Lua is 5.1 and its API is
-- absent here, so anything these tests reach must not touch frames or globals.
package.path = './WowForeverCompanion/?.lua;' .. package.path

local passed, failed = 0, 0

local function check(name, condition, detail)
  if condition then
    passed = passed + 1
  else
    failed = failed + 1
    print('  NOT OK  ' .. name .. (detail and ('  -- ' .. tostring(detail)) or ''))
  end
end

local function equal(name, actual, expected)
  check(name, actual == expected, 'got ' .. tostring(actual) .. ', wanted ' .. tostring(expected))
end

-- The addon files take (addonName, namespace) as varargs.
local ns = {}
local function load(file)
  local chunk = assert(loadfile('./WowForeverCompanion/' .. file))
  return chunk('WowForeverCompanion', ns)
end

load('Json.lua')
load('Codec.lua')
load('Progress.lua')

print('Json')
do
  local encoded = ns.Json.encode({ version = 1, name = 'Kaelin', done = { 'a', 'b' } })
  -- Keys are sorted, so the output is stable and diffable.
  equal('encodes with sorted keys', encoded, '{"done":["a","b"],"name":"Kaelin","version":1}')

  local decoded = ns.Json.decode('{"a":[1,2,{"b":true}],"c":null,"d":"x\\ny"}')
  equal('decodes nested arrays', decoded.a[3].b, true)
  equal('decodes escapes', decoded.d, 'x\ny')
  check('decodes null as absent', decoded.c == nil)

  local roundTrip = ns.Json.decode(ns.Json.encode({ text = 'acentos: ñ é ’ "quoted"' }))
  equal('round-trips accents and quotes', roundTrip.text, 'acentos: ñ é ’ "quoted"')

  check('rejects rubbish', ns.Json.decode('not json') == nil)
  check('rejects a truncated object', ns.Json.decode('{"a":') == nil)
end

print('Codec')
do
  equal('base64 of one byte', ns.Codec.base64Encode('a'), 'YQ==')
  equal('base64 of two bytes', ns.Codec.base64Encode('ab'), 'YWI=')
  equal('base64 of three bytes', ns.Codec.base64Encode('abc'), 'YWJj')
  equal('base64 round-trip', ns.Codec.base64Decode(ns.Codec.base64Encode('hola mundo')), 'hola mundo')

  local state = { version = 1, characters = { ['kaelin-sulfuron'] = { name = 'Kaelin', level = 14 } } }
  local text = ns.Codec.encode(state)
  check('exports with a known prefix', text:sub(1, 4) == 'WCP1')
  local back = ns.Codec.decode(text)
  equal('round-trips the state', back.characters['kaelin-sulfuron'].name, 'Kaelin')

  check('survives pasted whitespace', ns.Codec.decode('  ' .. text:sub(1, 8) .. '\n' .. text:sub(9)) ~= nil)
  check('rejects a foreign string', ns.Codec.decode('hello') == nil)
  local _, reason = ns.Codec.decode('hello')
  equal('says why', reason, 'not one of ours')
end

print('Progress')
do
  local state = ns.Progress.newState()
  equal('builds a character id', ns.Progress.characterId('Kaelin', 'Sulfuron'), 'kaelin-sulfuron')

  local character = ns.Progress.ensureCharacter(state, 'kaelin-sulfuron', {
    name = 'Kaelin', realm = 'Sulfuron', class = 'priest', faction = 'alliance', level = 1,
  })

  local steps = {
    { id = 'prof-alchemy-001', from = 1, to = 60, action = 'one' },
    { id = 'prof-alchemy-002', from = 60, to = 110, action = 'two' },
    { id = 'prof-alchemy-003', from = 110, to = 150, action = 'three' },
  }
  local track = { kind = 'profession', profession = 'alchemy' }

  local step = ns.Progress.nextStep(character, track, steps)
  equal('first pending step', step.id, 'prof-alchemy-001')

  -- Skill jumped past the first two bands: both get ticked, in one go.
  local ticked = ns.Progress.advanceProfession(character, 'alchemy', 110, steps)
  equal('ticks every band now behind you', ticked, 2)
  equal('records the skill', character.professions.alchemy.skillLevel, 110)
  equal('next step follows', ns.Progress.nextStep(character, track, steps).id, 'prof-alchemy-003')

  -- Re-reading a lower skill must not undo anything.
  ns.Progress.advanceProfession(character, 'alchemy', 5, steps)
  equal('never lowers the skill', character.professions.alchemy.skillLevel, 110)
  equal('never unticks', #character.professions.alchemy.completedSteps, 2)

  local levelSteps = {
    { id = 'lvl-alliance-001', from = 1, to = 10, action = 'start' },
    { id = 'lvl-alliance-002', from = 10, to = 20, action = 'westfall' },
  }
  equal('levelling ticks bands behind you', ns.Progress.advanceLevel(character, 12, levelSteps), 1)
  equal('records the level', character.level, 12)
end

print('Going off the guide')
do
  local segments = {
    { from = 1, to = 10, zones = {} },
    { from = 10, to = 20, zones = { 'westfall', 'loch-modan' } },
    { from = 20, to = 30, zones = { 'duskwood' } },
    { from = 30, to = 40, zones = { 'stranglethorn-vale', 'duskwood' } },
  }

  local band = ns.Progress.findBand(segments, 'westfall', 14)
  equal('finds the band for zone and level', band.from, 10)

  -- Wandering into a zone that belongs to a later band: we follow the player, not the plan.
  band = ns.Progress.findBand(segments, 'stranglethorn-vale', 14)
  equal('follows the player into a zone above their level', band.from, 30)

  -- A zone in two bands resolves by level.
  band = ns.Progress.findBand(segments, 'duskwood', 34)
  equal('resolves a shared zone by level', band.from, 30)
  band = ns.Progress.findBand(segments, 'duskwood', 24)
  equal('and again lower down', band.from, 20)

  check('reports nothing for an unknown zone', ns.Progress.findBand(segments, 'moonglade', 20) == nil)
  equal('falls back to the level band', ns.Progress.bandForLevel(segments, 24).from, 20)
end

print('')
print(string.format('%d passed, %d failed', passed, failed))
os.exit(failed == 0 and 0 or 1)
