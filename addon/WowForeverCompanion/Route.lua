-- Works out what the map should show. Deliberately free of frames, textures and globals:
-- everything here is arithmetic over the guide, so the tests can cover the parts that
-- actually go wrong -- ordering, zone borders, faded lookahead -- without the game.
--
-- Map.lua turns the plan this returns into textures. It decides nothing.
local _, ns = ...

local Route = {}
ns.Route = Route

-- How the route fades into the distance. The step you are on is solid; five steps out it
-- is a suggestion, not noise. Anything past the end of this list is not drawn at all.
local FALLOFF = { 1, 0.7, 0.5, 0.35, 0.22 }

-- Two pins closer than this on the map, in percent of the zone, are drawn as one group
-- rather than as overlapping numbers.
local CLUSTER_DISTANCE = 2.5

Route.FALLOFF = FALLOFF
Route.CLUSTER_DISTANCE = CLUSTER_DISTANCE

local function distance(a, b)
  local dx, dy = a.x - b.x, a.y - b.y
  return math.sqrt(dx * dx + dy * dy)
end

--- The points a leg passes through: the step's own `path` when the guide gives one,
--- otherwise a straight line from where the player was. A straight line is what shipped
--- before and is still better than nothing, but where it lies -- water, a cliff -- the
--- guide carries a path and this follows it.
local function pointsFor(from, step)
  local path = step.path
  if path ~= nil and #path >= 2 then return path end
  if from == nil then return nil end
  return { from, step.place }
end

--- The whole plan for one zone: which pins, in which order, with which legs between them.
---
--- steps      ordered guide steps, as the guides file holds them
--- isDone     function(step) -> boolean
--- zoneKey    the zone the player is looking at; nil means no filtering
---
--- Returns { pins = { ... }, legs = { ... } }. Pins carry `state` ('done', 'current',
--- 'ahead'), the `number` the player sees, and `group` when several share a spot. Legs
--- carry two points and the alpha to draw them at.
function Route.plan(steps, isDone, zoneKey)
  local pins, legs = {}, {}
  if steps == nil then return { pins = pins, legs = legs } end

  local aheadIndex = 0
  local previous = nil

  for index = 1, #steps do
    local step = steps[index]
    local place = step.place

    if place ~= nil and (zoneKey == nil or place.zone == zoneKey) then
      local done = isDone(step)

      if done then
        -- Where the player came from. Drawn dim and without a number: it is context,
        -- not an instruction.
        pins[#pins + 1] = { place = place, state = 'done', step = step }
        previous = place
      else
        aheadIndex = aheadIndex + 1
        local alpha = FALLOFF[aheadIndex]
        if alpha ~= nil then
          pins[#pins + 1] = {
            place = place,
            state = aheadIndex == 1 and 'current' or 'ahead',
            number = aheadIndex,
            alpha = alpha,
            step = step,
          }

          local points = pointsFor(previous, step)
          if points ~= nil then
            for at = 1, #points - 1 do
              local a, b = points[at], points[at + 1]
              -- A leg never spans two zones. Drawing one straight across the border is
              -- what sends players swimming: the guide has to name the crossing instead.
              if a.zone == b.zone and a.zone == place.zone then
                legs[#legs + 1] = { from = a, to = b, alpha = alpha }
              end
            end
          end
          previous = place
        end
      end
    end
  end

  return { pins = pins, legs = legs }
end

--- One leg as the map needs it: where its centre sits, how long it is and how far to
--- turn it. A single stretched texture per leg, not a chain of dashes -- a whole route of
--- dashes is hundreds of frames, and SetRotation turns a texture about its own centre,
--- which is why the centre is what this returns.
---
--- width and height are the map canvas in UI units, so this has to be recomputed when the
--- player zooms. Percentages in, UI units out.
function Route.leg(from, to, width, height)
  local dx = (to.x - from.x) / 100 * width
  local dy = (to.y - from.y) / 100 * height

  return {
    x = (from.x + to.x) / 2,
    y = (from.y + to.y) / 2,
    length = math.sqrt(dx * dx + dy * dy),
    -- Map coordinates grow downwards and texture rotation goes the other way, so the
    -- sign is flipped. math.atan2 because the game's Lua 5.1 drops a second argument to
    -- math.atan without a word.
    angle = -math.atan2(dy, dx),
  }
end

--- Pins that land on top of each other are merged, keeping the first one's position and
--- collecting the numbers, so the map shows `5·6` instead of two numbers fighting.
function Route.cluster(pins, distanceLimit)
  local limit = distanceLimit or CLUSTER_DISTANCE
  local clustered = {}

  for index = 1, #pins do
    local pin = pins[index]
    local merged = false

    for at = 1, #clustered do
      local other = clustered[at]
      if other.state == pin.state and distance(other.place, pin.place) < limit then
        other.group = other.group or { other.number }
        other.group[#other.group + 1] = pin.number
        merged = true
        break
      end
    end

    if not merged then clustered[#clustered + 1] = pin end
  end

  return clustered
end

--- Where the route leaves this zone, when the next thing to do is somewhere else. The
--- caller draws a flag at the border rather than a line, because we cannot know the road.
function Route.exitTo(steps, isDone, zoneKey)
  for index = 1, #steps do
    local step = steps[index]
    if not isDone(step) and step.place ~= nil then
      if step.place.zone ~= zoneKey then return step.place.zone end
      return nil
    end
  end
  return nil
end

return Route
