-- Pins and the route on the game map. Without this the guide lives in a little window and
-- the player still opens the map blind.
--
-- Pins go through HereBeDragons, the library Questie uses: you hand it a zone and a
-- coordinate and it works out world map, minimap and edge arrows. There is no polyline
-- API, so the route between two pins is drawn as a chain of small rotated textures, which
-- reads better over the game's own map than a solid line would.
local _, ns = ...

local Map = {}
ns.Map = Map

-- Lua 5.1, which the game runs, takes ONE argument here and drops the second without a
-- word; the two-argument form is 5.3's. Calling math.atan(dy, dx) in the game returns
-- atan(dy), so every dash was rotated by the wrong angle. math.atan2 is the 5.1 spelling.
local atan2 = math.atan2 or math.atan

-- How thick a route leg is drawn, in interface units.
local LEG_THICKNESS = 9

local hbd, pins
local pinPool, linePool = {}, {}
local enabled = true

local function libraries()
  if hbd ~= nil then return true end
  if _G.LibStub == nil then return false end
  hbd = _G.LibStub('HereBeDragons-2.0', true)
  pins = _G.LibStub('HereBeDragons-Pins-2.0', true)
  return hbd ~= nil and pins ~= nil
end

--- Zone keys in the guides are our slugs; the game speaks map ids. The guides carry the
--- slug because that is what the web and the addon share, so the lookup lives here.
local ZONE_IDS = {
  ['elwynn-forest'] = 37, ['westfall'] = 52, ['loch-modan'] = 48, ['darkshore'] = 62,
  ['silverpine-forest'] = 21, ['the-barrens'] = 11, ['stonetalon-mountains'] = 65,
  ['redridge-mountains'] = 49, ['duskwood'] = 47, ['wetlands'] = 56, ['ashenvale'] = 63,
  ['hillsbrad-foothills'] = 25, ['thousand-needles'] = 64, ['stranglethorn-vale'] = 50,
  ['arathi-highlands'] = 14, ['desolace'] = 66, ['dustwallow-marsh'] = 70,
  ['alterac-mountains'] = 15, ['tanaris'] = 71, ['feralas'] = 69, ['badlands'] = 17,
  ['the-hinterlands'] = 26, ['searing-gorge'] = 32, ['un-goro-crater'] = 78,
  ['felwood'] = 77, ['western-plaguelands'] = 22, ['eastern-plaguelands'] = 23,
  ['winterspring'] = 83, ['burning-steppes'] = 36, ['silithus'] = 81,
}

local KEY_BY_ID = {}
for key, id in pairs(ZONE_IDS) do KEY_BY_ID[id] = key end

function Map.currentZoneKey()
  if _G.C_Map == nil or _G.C_Map.GetBestMapForUnit == nil then return nil end
  local mapId = _G.C_Map.GetBestMapForUnit('player')
  return mapId and KEY_BY_ID[mapId] or nil
end

-- Drawing ---------------------------------------------------------------------

local function acquire(pool, factory)
  for index = 1, #pool do
    if not pool[index].inUse then
      pool[index].inUse = true
      return pool[index]
    end
  end
  local item = factory()
  item.inUse = true
  pool[#pool + 1] = item
  return item
end

local function releaseAll()
  for index = 1, #pinPool do
    pinPool[index].inUse = false
    if pins ~= nil then pins:RemoveWorldMapIcon(ns, pinPool[index].frame) end
    pinPool[index].frame:Hide()
  end
  for index = 1, #linePool do
    linePool[index].inUse = false
    if pins ~= nil then pins:RemoveWorldMapIcon(ns, linePool[index].frame) end
    linePool[index].frame:Hide()
  end
end

local function newPin()
  local frame = _G.CreateFrame('Frame', nil, _G.UIParent)
  frame:SetSize(22, 22)
  local texture = frame:CreateTexture(nil, 'OVERLAY')
  texture:SetAllPoints()
  texture:SetTexture('Interface\\Minimap\\ObjectIcons')
  frame.texture = texture

  -- The number the player reads. Friz Quadrata is the game's own heading face; falling
  -- back to a font object rather than a path keeps this working on the ruRU, koKR and
  -- zhCN clients, where those font files live elsewhere.
  local label = frame:CreateFontString(nil, 'OVERLAY', 'GameFontNormalSmall')
  label:SetPoint('CENTER')
  label:SetShadowOffset(1, -1)
  frame.label = label
  return { frame = frame }
end

--- One leg is one stretched, rotated texture. The old code drew twelve little dashes per
--- leg, which is fine for three pins and hundreds of frames for a whole route.
local function newLeg()
  local frame = _G.CreateFrame('Frame', nil, _G.UIParent)
  frame:SetSize(10, LEG_THICKNESS)
  local texture = frame:CreateTexture(nil, 'ARTWORK')
  texture:SetAllPoints()
  texture:SetColorTexture(0.85, 0.70, 0.39, 1)
  frame.texture = texture
  return { frame = frame }
end

--- The map canvas in UI units. A leg's length depends on it, so it has to be read fresh:
--- it changes with zoom and when the player resizes the map.
local function canvasSize()
  local map = _G.WorldMapFrame
  local child = map and map.ScrollContainer and map.ScrollContainer.Child
  if child == nil or child.GetWidth == nil then return nil end
  return child:GetWidth(), child:GetHeight()
end

local STATE_ALPHA = { done = 0.35 }
local STATE_SIZE = { current = 26, ahead = 22, done = 16 }

--- Draws the plan Route worked out. This function decides nothing: what to show, in what
--- order and how faint is all settled in Route.lua, where the tests can reach it.
function Map.refresh()
  if not enabled or not libraries() then return end
  if _G.CreateFrame == nil then return end

  releaseAll()

  local character = ns.Core.character()
  if character == nil then return end

  local steps = ns.Core.levelingSteps()
  local track = { kind = 'leveling' }
  local zoneKey = Map.currentZoneKey()
  if zoneKey == nil then return end

  local mapId = ZONE_IDS[zoneKey]
  if mapId == nil then return end

  local plan = ns.Route.plan(steps, function(step)
    return ns.Progress.isDone(character, track, step.id)
  end, zoneKey)

  local width, height = canvasSize()

  for index = 1, #plan.legs do
    local leg = plan.legs[index]
    if width ~= nil then
      local geometry = ns.Route.leg(leg.from, leg.to, width, height)
      local item = acquire(linePool, newLeg)
      item.frame:SetSize(geometry.length, LEG_THICKNESS)
      item.frame:SetAlpha(leg.alpha)
      item.frame.texture:SetRotation(geometry.angle)
      item.frame:Show()
      pins:AddWorldMapIconMap(ns, item.frame, mapId, geometry.x / 100, geometry.y / 100)
    end
  end

  local drawn = ns.Route.cluster(plan.pins)
  for index = 1, #drawn do
    local pin = drawn[index]
    local item = acquire(pinPool, newPin)
    local size = STATE_SIZE[pin.state] or 22
    item.frame:SetSize(size, size)
    item.frame:SetAlpha(pin.alpha or STATE_ALPHA[pin.state] or 1)

    -- A group of pins shows every number it swallowed, so nothing silently disappears.
    if pin.group ~= nil then
      item.frame.label:SetText(table.concat(pin.group, '\194\183'))
    else
      item.frame.label:SetText(pin.number and tostring(pin.number) or '')
    end

    item.frame:Show()
    pins:AddWorldMapIconMap(ns, item.frame, mapId, pin.place.x / 100, pin.place.y / 100)
  end

  Map.exitZone = ns.Route.exitTo(steps, function(step)
    return ns.Progress.isDone(character, track, step.id)
  end, zoneKey)
end

--- If TomTom is installed it already owns the arrow, and two arrows is worse than one.
function Map.setWaypoint(place)
  if place == nil then return end
  local mapId = ZONE_IDS[place.zone]
  if mapId == nil then return end

  if _G.TomTom ~= nil and _G.TomTom.AddWaypoint ~= nil then
    _G.TomTom:AddWaypoint(mapId, place.x / 100, place.y / 100, { title = 'WoW Companion' })
    return
  end

  Map.arrowTarget = { mapId = mapId, x = place.x / 100, y = place.y / 100 }
end

--- Heading and distance to the current target, for a caller that wants to draw it.
--- Returns nil when we cannot place the player, which happens indoors.
function Map.headingTo(target)
  if target == nil or _G.C_Map == nil or _G.C_Map.GetPlayerMapPosition == nil then return nil end
  local position = _G.C_Map.GetPlayerMapPosition(target.mapId, 'player')
  if position == nil then return nil end

  local x, y = position:GetXY()
  if x == nil then return nil end

  local dx, dy = target.x - x, target.y - y
  return atan2(dx, dy), math.sqrt(dx * dx + dy * dy)
end

function Map.toggle()
  enabled = not enabled
  if enabled then
    Map.refresh()
    ns.Core.say('map pins on')
  else
    releaseAll()
    ns.Core.say('map pins off')
  end
end

return Map
