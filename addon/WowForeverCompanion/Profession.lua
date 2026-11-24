-- Profession mode: docked beside the trade skill window, showing the step your real skill
-- puts you on, what to make, and what you are missing from your bags.
--
-- Clicking a step selects the recipe and fills in the quantity. It never presses Create:
-- automating a game action is a ban, and it is not ours to do.
local _, ns = ...

local Profession = {}
ns.Profession = Profession

local WIDTH = 260
local frame
local activeProfession

--- Forever's trade skill API is not published yet, and the two families differ. Detect
--- rather than assume, and fall back to showing the step without click-to-select.
local function readOpenProfession()
  if _G.C_TradeSkillUI and _G.C_TradeSkillUI.GetTradeSkillLine then
    local info = _G.C_TradeSkillUI.GetTradeSkillLine()
    if type(info) == 'table' then
      return info.professionName or info.parentProfessionName, info.skillLevel or 0
    end
  end

  if _G.GetTradeSkillLine then
    local name, rank = _G.GetTradeSkillLine()
    if name ~= nil and name ~= 'UNKNOWN' then return name, rank or 0 end
  end

  return nil, 0
end

--- Guides are keyed in English; the open window is in the player's language. Match on the
--- guide's own display name for this locale.
local function keyForDisplayName(displayName)
  local professions = ns.Core.guides().professions or {}
  for key, guide in pairs(professions) do
    if guide.name == displayName then return key end
  end
  -- The English key doubles as a fallback for a client we did not translate.
  local guess = (displayName or ''):lower():gsub('%s', '-')
  return professions[guess] and guess or nil
end

local function track()
  return { kind = 'profession', profession = activeProfession }
end

local function missingMaterials(step)
  if step.materials == nil or _G.GetItemCount == nil then return {} end

  local missing = {}
  for index = 1, #step.materials do
    local material = step.materials[index]
    local held = _G.GetItemCount(material.item) or 0
    if held < material.quantity then
      missing[#missing + 1] = string.format('%s %d/%d', material.item, held, material.quantity)
    end
  end
  return missing
end

--- Select the recipe this step is about and set the quantity. The player presses Create.
local function selectRecipe(step)
  if _G.GetNumTradeSkills == nil or _G.GetTradeSkillInfo == nil or _G.SelectTradeSkill == nil then
    return false
  end

  -- The step names what to make in prose, so match the longest recipe name it contains.
  local best, bestLength
  for index = 1, _G.GetNumTradeSkills() do
    local name, kind = _G.GetTradeSkillInfo(index)
    if name ~= nil and kind ~= 'header' and step.action:find(name, 1, true) then
      if bestLength == nil or #name > bestLength then best, bestLength = index, #name end
    end
  end

  if best == nil then return false end
  _G.SelectTradeSkill(best)
  return true
end

local function ensureFrame()
  if frame ~= nil then return frame end
  frame = ns.UI.createPanel('WowForeverCompanionProfession', WIDTH)
  if frame == nil then return nil end

  ns.UI.addFooter(frame, function(checked)
    local character = ns.Core.character()
    if character == nil or activeProfession == nil then return end
    local step = ns.Progress.nextStep(character, track(), ns.Core.professionSteps(activeProfession))
    if step == nil then return end
    ns.Progress.setDone(character, track(), step.id, checked)
    Profession.refresh()
  end, function()
    local character = ns.Core.character()
    if character == nil or activeProfession == nil then return end
    local step = ns.Progress.nextStep(character, track(), ns.Core.professionSteps(activeProfession))
    if step ~= nil then
      ns.Progress.setDone(character, track(), step.id, true)
      Profession.refresh()
    end
  end)

  -- Clicking the body picks the recipe, which is the one shortcut worth having.
  frame:SetScript('OnMouseUp', function()
    local character = ns.Core.character()
    if character == nil or activeProfession == nil then return end
    local step = ns.Progress.nextStep(character, track(), ns.Core.professionSteps(activeProfession))
    if step ~= nil and not selectRecipe(step) then
      ns.Core.say('could not find that recipe in the open window; pick it by hand')
    end
  end)

  return frame
end

--- Dock to whichever trade skill window this client uses, and fall back to the centre.
local function dock(panel)
  local anchor = _G.TradeSkillFrame or _G.ProfessionsFrame
  panel:ClearAllPoints()
  if anchor ~= nil and anchor.IsShown and anchor:IsShown() then
    panel:SetPoint('TOPLEFT', anchor, 'TOPRIGHT', 4, 0)
  else
    panel:SetPoint('CENTER', _G.UIParent, 'CENTER', 0, 0)
  end
end

function Profession.refresh()
  local panel = ensureFrame()
  if panel == nil or not panel:IsShown() then return end

  local displayName, skill = readOpenProfession()
  activeProfession = displayName and keyForDisplayName(displayName) or activeProfession

  if activeProfession == nil then
    panel.title:SetText('Professions')
    panel.body:SetText('Open a profession window and we will pick up from your real skill.')
    panel.detail:SetText('')
    ns.UI.resize(panel)
    return
  end

  local character = ns.Core.character()
  if character == nil then return end

  local steps = ns.Core.professionSteps(activeProfession)
  -- Trust the game over stored state: your real skill is the truth.
  ns.Progress.advanceProfession(character, activeProfession, skill, steps)

  local step = ns.Progress.nextStep(character, track(), steps)
  local guide = (ns.Core.guides().professions or {})[activeProfession]
  local name = (guide and guide.name) or activeProfession

  if step == nil then
    panel.title:SetText(name)
    panel.body:SetText('Finished. Nothing left on this ladder.')
    panel.detail:SetText('')
    ns.UI.resize(panel)
    return
  end

  panel.title:SetText(string.format('%s  |cff98a59b%d|r', name, skill))
  panel.body:SetText(step.action)

  local lines = {}
  local missing = missingMaterials(step)
  if #missing > 0 then
    lines[#lines + 1] = 'Still need: ' .. table.concat(missing, ', ')
  elseif step.materials ~= nil then
    lines[#lines + 1] = 'You have everything for this one.'
  end
  if step.note ~= nil then lines[#lines + 1] = step.note end
  panel.detail:SetText(table.concat(lines, '\n'))

  dock(panel)
  ns.UI.resize(panel)
end

function Profession.onSkillChanged()
  if frame ~= nil and frame:IsShown() then Profession.refresh() end
end

function Profession.show()
  local panel = ensureFrame()
  if panel == nil then return end
  panel:Show()
  Profession.refresh()
end

function Profession.hide()
  if frame ~= nil then frame:Hide() end
end

return Profession
