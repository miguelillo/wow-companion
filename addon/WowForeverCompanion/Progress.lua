-- What the player has done, and what they should do next. Pure logic: no frames, no
-- events, no WoW API. Everything here is reachable from a test.
local _, ns = ...

local Progress = {}
ns.Progress = Progress

--- A fresh, empty state. `version` matches the web's document so the two can be swapped.
function Progress.newState()
  return {
    version = 1,
    characters = {},
  }
end

function Progress.characterId(name, realm)
  local function normalise(value)
    return (tostring(value or ''):lower():gsub('[^a-z0-9]+', '-'):gsub('^%-+', ''):gsub('%-+$', ''))
  end
  return normalise(name) .. '-' .. normalise(realm)
end

function Progress.ensureCharacter(state, id, fields)
  local character = state.characters[id]
  if character == nil then
    character = {
      name = fields.name,
      realm = fields.realm,
      class = fields.class,
      faction = fields.faction,
      level = fields.level or 1,
      professions = {},
      leveling = { completedSteps = {} },
      updatedAt = fields.updatedAt or '',
    }
    state.characters[id] = character
  end
  return character
end

local function listFor(character, track)
  if track.kind == 'leveling' then
    character.leveling = character.leveling or { completedSteps = {} }
    return character.leveling.completedSteps
  end

  character.professions = character.professions or {}
  local entry = character.professions[track.profession]
  if entry == nil then
    entry = { skillLevel = 0, completedSteps = {} }
    character.professions[track.profession] = entry
  end
  return entry.completedSteps
end

function Progress.isDone(character, track, stepId)
  local list = listFor(character, track)
  for index = 1, #list do
    if list[index] == stepId then return true end
  end
  return false
end

function Progress.setDone(character, track, stepId, done)
  local list = listFor(character, track)
  for index = 1, #list do
    if list[index] == stepId then
      if not done then table.remove(list, index) end
      return
    end
  end
  if done then
    list[#list + 1] = stepId
    table.sort(list)
  end
end

--- The first step of a ladder that is not ticked yet, or nil when it is finished.
function Progress.nextStep(character, track, steps)
  for index = 1, #steps do
    if not Progress.isDone(character, track, steps[index].id) then
      return steps[index], index
    end
  end
  return nil, nil
end

-- Auto-advance ---------------------------------------------------------------

--- Profession skill moved: tick every step whose range now sits behind the player.
--- Returns how many steps were newly ticked, so the caller can say so once.
function Progress.advanceProfession(character, profession, skill, steps)
  local track = { kind = 'profession', profession = profession }
  character.professions = character.professions or {}
  local entry = character.professions[profession]
  if entry == nil then
    entry = { skillLevel = 0, completedSteps = {} }
    character.professions[profession] = entry
  end
  if skill > entry.skillLevel then entry.skillLevel = skill end

  local ticked = 0
  for index = 1, #steps do
    local step = steps[index]
    if skill >= step.to and not Progress.isDone(character, track, step.id) then
      Progress.setDone(character, track, step.id, true)
      ticked = ticked + 1
    end
  end
  return ticked
end

--- The player levelled: tick leveling steps whose band is now behind them.
function Progress.advanceLevel(character, level, steps)
  local track = { kind = 'leveling' }
  if level > (character.level or 1) then character.level = level end

  local ticked = 0
  for index = 1, #steps do
    local step = steps[index]
    if level >= step.to and not Progress.isDone(character, track, step.id) then
      Progress.setDone(character, track, step.id, true)
      ticked = ticked + 1
    end
  end
  return ticked
end

-- Going off the guide ---------------------------------------------------------

--- The band that fits a zone and a level, preferring one that covers both.
--- Returns nil when the zone is in no band, which the caller reports and then sits still.
function Progress.findBand(segments, zoneKey, level)
  local zoneMatch, zoneAndLevelMatch

  for index = 1, #segments do
    local segment = segments[index]
    local zones = segment.zones or {}
    for zoneIndex = 1, #zones do
      if zones[zoneIndex] == zoneKey then
        zoneMatch = zoneMatch or segment
        if level >= segment.from and level <= segment.to then
          zoneAndLevelMatch = zoneAndLevelMatch or segment
        end
      end
    end
  end

  return zoneAndLevelMatch or zoneMatch
end

--- The band a level falls in, for when the zone tells us nothing.
function Progress.bandForLevel(segments, level)
  for index = 1, #segments do
    local segment = segments[index]
    if level >= segment.from and level < segment.to then return segment end
  end
  return segments[#segments]
end

return Progress
