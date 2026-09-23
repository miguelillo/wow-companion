-- Levelling mode: a narrow window with one big objective and the next two in grey.
-- It never asks the player to tick anything; the checkbox exists because the guide will
-- be wrong sometimes, not because it is the way through.
local _, ns = ...

local Leveling = {}
ns.Leveling = Leveling

local WIDTH = 300
local LOOKAHEAD = 2

local frame

local function track()
  return { kind = 'leveling' }
end

local function currentStep()
  local character = ns.Core.character()
  if character == nil then return nil end
  return ns.Progress.nextStep(character, track(), ns.Core.levelingSteps())
end

local function upcoming(afterIndex)
  local steps = ns.Core.levelingSteps()
  local character = ns.Core.character()
  local out = {}
  if character == nil then return out end

  for index = afterIndex + 1, #steps do
    if not ns.Progress.isDone(character, track(), steps[index].id) then
      out[#out + 1] = steps[index]
      if #out >= LOOKAHEAD then break end
    end
  end
  return out
end

local function ensureFrame()
  if frame ~= nil then return frame end
  frame = ns.UI.createPanel('WowForeverCompanionLeveling', WIDTH)
  if frame == nil then return nil end

  ns.UI.addFooter(frame, function(checked)
    local character = ns.Core.character()
    local step = currentStep()
    if character == nil or step == nil then return end
    ns.Progress.setDone(character, track(), step.id, checked)
    Leveling.refresh()
  end, function()
    Leveling.skip()
  end)

  return frame
end

function Leveling.refresh()
  local panel = ensureFrame()
  if panel == nil or not panel:IsShown() then return end

  local step, index = currentStep()
  if step == nil then
    panel.title:SetText('Levelling')
    panel.body:SetText('Route finished. Nicely done.')
    panel.detail:SetText('')
    if panel.doneButton then panel.doneButton:SetChecked(false) end
    ns.UI.resize(panel)
    return
  end

  panel.title:SetText(string.format('Levelling  |cff98a59b%d–%d|r', step.from, step.to))
  panel.body:SetText(step.action)

  local lines = {}
  if step.note ~= nil then lines[#lines + 1] = step.note end
  local next = upcoming(index)
  for position = 1, #next do
    lines[#lines + 1] = '• ' .. next[position].action
  end
  panel.detail:SetText(table.concat(lines, '\n'))

  if panel.doneButton then panel.doneButton:SetChecked(false) end
  ns.UI.resize(panel)
  ns.Map.refresh()
end

function Leveling.skip()
  local character = ns.Core.character()
  local step = currentStep()
  if character == nil or step == nil then return end
  ns.Progress.setDone(character, track(), step.id, true)
  Leveling.refresh()
end

--- Wandering off happens constantly: another zone, a quest off the route, a three-day
--- gap. The guide follows the player rather than nagging them back. One line in chat,
--- never a popup, and never the same line twice in a row.
local lastAnnouncedBand

function Leveling.onZoneChanged()
  local character = ns.Core.character()
  if character == nil then return end

  local zoneKey = ns.Map.currentZoneKey()
  local segments = ns.Core.levelingSegments()
  if #segments == 0 then return end

  local band = zoneKey and ns.Progress.findBand(segments, zoneKey, character.level or 1) or nil

  if band == nil then
    if lastAnnouncedBand ~= 'unknown' then
      lastAnnouncedBand = 'unknown'
      ns.Core.say('this zone is not on the route; the guide will wait here')
    end
    return
  end

  local key = band.from .. '-' .. band.to
  if key ~= lastAnnouncedBand then
    lastAnnouncedBand = key
    ns.Core.say(string.format('following you to the %d–%d band', band.from, band.to))
  end

  Leveling.refresh()
end

function Leveling.show()
  local panel = ensureFrame()
  if panel == nil then return end
  panel:Show()
  Leveling.refresh()
end

function Leveling.hide()
  if frame ~= nil then frame:Hide() end
end

return Leveling
