-- Wiring: saved variables, events, and which of the two modes is showing.
local addonName, ns = ...

local Core = {}
ns.Core = Core

local PREFIX = '|cff63ac91WoW Companion|r: '

--- WoW's locale is the addon's locale. The player picked it already; asking twice is noise.
local function pickLocale()
  local locale = (_G.GetLocale and _G.GetLocale()) or 'enUS'
  if locale == 'esES' or locale == 'esMX' then return 'es' end
  return 'en'
end

function Core.say(message)
  if _G.DEFAULT_CHAT_FRAME then
    _G.DEFAULT_CHAT_FRAME:AddMessage(PREFIX .. message)
  end
end

function Core.guides()
  return (ns.Guides and ns.Guides[Core.locale]) or {}
end

function Core.professionSteps(key)
  local guide = Core.guides().professions
  local profession = guide and guide[key]
  return profession and profession.steps or {}
end

function Core.levelingSegments()
  local character = Core.character()
  local faction = (character and character.faction) or 'alliance'
  local guide = Core.guides().leveling
  local route = guide and guide[faction]
  return route and route.segments or {}
end

function Core.levelingSteps()
  local steps = {}
  local segments = Core.levelingSegments()
  for index = 1, #segments do
    local segment = segments[index]
    for stepIndex = 1, #segment.steps do
      steps[#steps + 1] = segment.steps[stepIndex]
    end
  end
  return steps
end

function Core.character()
  local state = _G.WowForeverCompanionDB
  if state == nil or state.activeCharacter == nil then return nil end
  return state.characters[state.activeCharacter]
end

-- Setup -----------------------------------------------------------------------

local function bootstrap()
  local state = _G.WowForeverCompanionDB
  if type(state) ~= 'table' or state.version ~= 1 then
    state = ns.Progress.newState()
    _G.WowForeverCompanionDB = state
  end

  local name = _G.UnitName and _G.UnitName('player') or 'Unknown'
  local realm = (_G.GetRealmName and _G.GetRealmName()) or 'Unknown'
  local id = ns.Progress.characterId(name, realm)

  local class = 'warrior'
  if _G.UnitClass then
    local _, token = _G.UnitClass('player')
    class = (token or 'WARRIOR'):lower()
  end
  local faction = 'alliance'
  if _G.UnitFactionGroup then
    faction = ((_G.UnitFactionGroup('player') or 'Alliance') == 'Horde') and 'horde' or 'alliance'
  end

  ns.Progress.ensureCharacter(state, id, {
    name = name,
    realm = realm,
    class = class,
    faction = faction,
    level = (_G.UnitLevel and _G.UnitLevel('player')) or 1,
  })
  state.activeCharacter = id
end

--- The mode picks itself: if the trade skill window is open you are levelling a
--- profession, otherwise you are levelling. Asking the player to choose would be a
--- setting nobody wants to manage.
function Core.refreshMode()
  local tradeSkillOpen = (_G.TradeSkillFrame and _G.TradeSkillFrame:IsShown())
    or (_G.ProfessionsFrame and _G.ProfessionsFrame:IsShown())
    or false

  if tradeSkillOpen then
    ns.Leveling.hide()
    ns.Profession.show()
  else
    ns.Profession.hide()
    ns.Leveling.show()
  end
end

local EVENTS = {
  'PLAYER_LOGIN', 'PLAYER_LOGOUT',
  'QUEST_ACCEPTED', 'QUEST_TURNED_IN', 'QUEST_LOG_UPDATE',
  'UNIT_LEVEL', 'ZONE_CHANGED_NEW_AREA',
  'CHAT_MSG_SKILL', 'SKILL_LINES_CHANGED',
  'TRADE_SKILL_SHOW', 'TRADE_SKILL_CLOSE',
}

local frame = _G.CreateFrame and _G.CreateFrame('Frame') or nil

local handlers = {}

handlers.PLAYER_LOGIN = function()
  bootstrap()
  Core.refreshMode()
  ns.Map.refresh()
end

handlers.PLAYER_LOGOUT = function()
  -- SavedVariables are written on logout, reload or exit: that is the only door out of
  -- the game, so the compressed string is refreshed here.
  local state = _G.WowForeverCompanionDB
  if state ~= nil then state.transfer = ns.Codec.encode(state) end
end

handlers.UNIT_LEVEL = function(unit)
  if unit ~= 'player' then return end
  local character = Core.character()
  if character == nil then return end
  local level = (_G.UnitLevel and _G.UnitLevel('player')) or character.level
  local ticked = ns.Progress.advanceLevel(character, level, Core.levelingSteps())
  if ticked > 0 then ns.Leveling.refresh() end
  ns.Map.refresh()
end

handlers.ZONE_CHANGED_NEW_AREA = function()
  ns.Leveling.onZoneChanged()
  ns.Map.refresh()
end

handlers.SKILL_LINES_CHANGED = function()
  ns.Profession.onSkillChanged()
end

handlers.CHAT_MSG_SKILL = handlers.SKILL_LINES_CHANGED

handlers.QUEST_ACCEPTED = function() ns.Leveling.refresh() end
handlers.QUEST_TURNED_IN = handlers.QUEST_ACCEPTED
handlers.QUEST_LOG_UPDATE = handlers.QUEST_ACCEPTED

handlers.TRADE_SKILL_SHOW = function() Core.refreshMode() end
handlers.TRADE_SKILL_CLOSE = handlers.TRADE_SKILL_SHOW

if frame ~= nil then
  frame:RegisterEvent('ADDON_LOADED')
  frame:SetScript('OnEvent', function(_, event, ...)
    if event == 'ADDON_LOADED' then
      local loaded = ...
      if loaded ~= addonName then return end
      Core.locale = pickLocale()
      for index = 1, #EVENTS do frame:RegisterEvent(EVENTS[index]) end
      return
    end

    local handler = handlers[event]
    if handler ~= nil then handler(...) end
  end)
end

-- Slash commands ---------------------------------------------------------------

local function handleSlash(input)
  local command, rest = (input or ''):match('^(%S*)%s*(.*)$')
  command = (command or ''):lower()

  if command == 'export' then
    local state = _G.WowForeverCompanionDB
    if state == nil then return Core.say('nothing to export yet') end
    state.transfer = ns.Codec.encode(state)
    ns.UI.showText(state.transfer)
  elseif command == 'import' then
    local incoming, reason = ns.Codec.decode(rest)
    if incoming == nil then return Core.say('that string is not one of ours (' .. tostring(reason) .. ')') end
    _G.WowForeverCompanionDB = incoming
    Core.say('progress imported')
    Core.refreshMode()
  elseif command == 'skip' then
    ns.Leveling.skip()
  elseif command == 'map' then
    ns.Map.toggle()
  else
    ns.UI.toggle()
  end
end

_G.SLASH_WOWFOREVERCOMPANION1 = '/wfc'
_G.SLASH_WOWFOREVERCOMPANION2 = '/companion'
_G.SlashCmdList = _G.SlashCmdList or {}
_G.SlashCmdList.WOWFOREVERCOMPANION = handleSlash

Core.locale = pickLocale()

return Core
