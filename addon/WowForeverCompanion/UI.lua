-- The shared window. Both modes borrow the same frame furniture so they look like one
-- addon: a title bar you can drag, a body, and a footer with the safety-net buttons.
local _, ns = ...

local UI = {}
ns.UI = UI

local BACKDROP = {
  bgFile = 'Interface\\Buttons\\WHITE8X8',
  edgeFile = 'Interface\\Buttons\\WHITE8X8',
  edgeSize = 1,
}

local function applyBackdrop(frame)
  -- BackdropTemplate only exists on newer clients; on older ones the methods are on the
  -- frame itself. Either way a missing backdrop must not stop the window appearing.
  if frame.SetBackdrop == nil then return end
  frame:SetBackdrop(BACKDROP)
  frame:SetBackdropColor(0.04, 0.09, 0.08, 0.92)
  frame:SetBackdropBorderColor(0.55, 0.45, 0.16, 0.9)
end

--- A draggable panel. `width` is the only thing the two modes disagree about.
function UI.createPanel(name, width)
  if _G.CreateFrame == nil then return nil end

  local frame = _G.CreateFrame('Frame', name, _G.UIParent, 'BackdropTemplate')
  frame:SetWidth(width)
  frame:SetHeight(120)
  frame:SetPoint('CENTER', _G.UIParent, 'CENTER', 0, 0)
  frame:SetMovable(true)
  frame:EnableMouse(true)
  frame:RegisterForDrag('LeftButton')
  frame:SetScript('OnDragStart', frame.StartMoving)
  frame:SetScript('OnDragStop', frame.StopMovingOrSizing)
  frame:SetClampedToScreen(true)
  applyBackdrop(frame)

  frame.title = frame:CreateFontString(nil, 'OVERLAY', 'GameFontNormal')
  frame.title:SetPoint('TOPLEFT', 10, -8)
  frame.title:SetPoint('TOPRIGHT', -10, -8)
  frame.title:SetJustifyH('LEFT')

  frame.body = frame:CreateFontString(nil, 'OVERLAY', 'GameFontHighlightLarge')
  frame.body:SetPoint('TOPLEFT', 10, -28)
  frame.body:SetPoint('TOPRIGHT', -10, -28)
  frame.body:SetJustifyH('LEFT')
  frame.body:SetSpacing(2)

  frame.detail = frame:CreateFontString(nil, 'OVERLAY', 'GameFontDisable')
  frame.detail:SetPoint('TOPLEFT', frame.body, 'BOTTOMLEFT', 0, -6)
  frame.detail:SetPoint('RIGHT', -10, 0)
  frame.detail:SetJustifyH('LEFT')
  frame.detail:SetSpacing(2)

  frame:Hide()
  return frame
end

--- The safety net. The guide will be wrong sometimes, so the player can always tick a
--- step by hand or skip it, without hunting through a menu.
function UI.addFooter(frame, onDone, onSkip)
  if frame == nil or _G.CreateFrame == nil then return end

  local done = _G.CreateFrame('CheckButton', nil, frame, 'UICheckButtonTemplate')
  done:SetSize(20, 20)
  done:SetPoint('BOTTOMLEFT', 8, 8)
  done:SetScript('OnClick', function(button)
    onDone(button:GetChecked() and true or false)
  end)
  frame.doneButton = done

  local label = frame:CreateFontString(nil, 'OVERLAY', 'GameFontDisableSmall')
  label:SetPoint('LEFT', done, 'RIGHT', 2, 0)
  label:SetText('Done')

  local skip = _G.CreateFrame('Button', nil, frame, 'UIPanelButtonTemplate')
  skip:SetSize(52, 20)
  skip:SetPoint('BOTTOMRIGHT', -8, 8)
  skip:SetText('Skip')
  skip:SetScript('OnClick', onSkip)
  frame.skipButton = skip
end

--- Fits the panel to whatever the two font strings ended up needing.
function UI.resize(frame)
  if frame == nil then return end
  local height = 28 + frame.body:GetStringHeight() + 8 + frame.detail:GetStringHeight() + 36
  frame:SetHeight(math.max(96, height))
end

--- A selectable box for the transfer string, because you cannot copy from chat.
function UI.showText(text)
  if _G.CreateFrame == nil then return end

  if UI.textFrame == nil then
    local frame = _G.CreateFrame('Frame', 'WowForeverCompanionTextFrame', _G.UIParent, 'BackdropTemplate')
    frame:SetSize(520, 140)
    frame:SetPoint('CENTER')
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag('LeftButton')
    frame:SetScript('OnDragStart', frame.StartMoving)
    frame:SetScript('OnDragStop', frame.StopMovingOrSizing)
    applyBackdrop(frame)

    local box = _G.CreateFrame('EditBox', nil, frame)
    box:SetMultiLine(true)
    box:SetFontObject('GameFontHighlightSmall')
    box:SetPoint('TOPLEFT', 10, -10)
    box:SetPoint('BOTTOMRIGHT', -10, 32)
    box:SetAutoFocus(false)
    box:SetScript('OnEscapePressed', function() frame:Hide() end)
    frame.box = box

    local close = _G.CreateFrame('Button', nil, frame, 'UIPanelButtonTemplate')
    close:SetSize(70, 20)
    close:SetPoint('BOTTOM', 0, 8)
    close:SetText('Close')
    close:SetScript('OnClick', function() frame:Hide() end)

    UI.textFrame = frame
  end

  UI.textFrame.box:SetText(text)
  UI.textFrame.box:HighlightText()
  UI.textFrame.box:SetFocus()
  UI.textFrame:Show()
end

function UI.toggle()
  ns.Core.refreshMode()
end

return UI
