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

local DASHES_PER_LEG = 12
local LOOKAHEAD = 3

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
  frame:SetSize(14, 14)
  local texture = frame:CreateTexture(nil, 'OVERLAY')
  texture:SetAllPoints()
  texture:SetTexture('Interface\\Minimap\\ObjectIcons')
  frame.texture = texture
  return { frame = frame }
end

local function newDash()
  local frame = _G.CreateFrame('Frame', nil, _G.UIParent)
  frame:SetSize(6, 2)
  local texture = frame:CreateTexture(nil, 'ARTWORK')
  texture:SetAllPoints()
  texture:SetColorTexture(0.85, 0.70, 0.39, 0.85)
  frame.texture = texture
  return { frame = frame }
end

--- A dashed leg between two points on the same zone map. Each dash is its own texture,
--- rotated to face along the line, because the API has no way to draw one.
local function drawLeg(mapId, fromX, fromY, toX, toY)
  local angle = math.atan((toY - fromY), (toX - fromX))

  for index = 0, DASHES_PER_LEG - 1 do
    -- Every other slot is left empty: that is what makes it dashed.
    if index % 2 == 0 then
      local t = index / (DASHES_PER_LEG - 1)
      local dash = acquire(linePool, newDash)
      dash.frame.texture:SetRotation(-angle)
      dash.frame:Show()
      pins:AddWorldMapIconMap(
        ns, dash.frame, mapId,
        (fromX + (toX - fromX) * t) / 100,
        (fromY + (toY - fromY) * t) / 100
      )
    end
  end
end

--- Only the active zone and the next few steps get pins. Drawing the whole route is where
--- addons like this fall over, and nobody needs a pin for level 48 at level 12.
function Map.refresh()
  if not enabled or not libraries() then return end
  if _G.CreateFrame == nil then return end

  releaseAll()

  local character = ns.Core.character()
  if character == nil then return end

  local steps = ns.Core.levelingSteps()
  local track = { kind = 'leveling' }
  local zoneKey = Map.currentZoneKey()

  local placed = {}
  for index = 1, #steps do
    local step = steps[index]
    if not ns.Progress.isDone(character, track, step.id) and step.place ~= nil then
      if zoneKey == nil or step.place.zone == zoneKey then
        placed[#placed + 1] = step.place
        if #placed >= LOOKAHEAD then break end
      end
    end
  end

  for index = 1, #placed do
    local place = placed[index]
    local mapId = ZONE_IDS[place.zone]
    if mapId ~= nil then
      local pin = acquire(pinPool, newPin)
      pin.frame:Show()
      pins:AddWorldMapIconMap(ns, pin.frame, mapId, place.x / 100, place.y / 100)

      local next = placed[index + 1]
      if next ~= nil and ZONE_IDS[next.zone] == mapId then
        drawLeg(mapId, place.x, place.y, next.x, next.y)
      end
    end
  end
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
  return math.atan(dx, dy), math.sqrt(dx * dx + dy * dy)
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
