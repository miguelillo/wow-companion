-- JSON for the transfer string. WoW ships no JSON, and the desktop client reads what we
-- write, so the format is part of the contract: the same shape the web puts in
-- localStorage. Kept small and dependency-free on purpose.
local _, ns = ...

local Json = {}
ns.Json = Json

local concat, format, floor = table.concat, string.format, math.floor

-- Encoding -------------------------------------------------------------------

local ESCAPES = {
  ['"'] = '\\"', ['\\'] = '\\\\', ['\b'] = '\\b', ['\f'] = '\\f',
  ['\n'] = '\\n', ['\r'] = '\\r', ['\t'] = '\\t',
}

local function escape(text)
  return (text:gsub('[%c"\\]', function(character)
    return ESCAPES[character] or format('\\u%04x', character:byte())
  end))
end

local function isArray(value)
  local count = 0
  for key in pairs(value) do
    if type(key) ~= 'number' then return false end
    count = count + 1
  end
  return count == #value
end

local encodeValue

local function encodeTable(value, out)
  if isArray(value) then
    out[#out + 1] = '['
    for index = 1, #value do
      if index > 1 then out[#out + 1] = ',' end
      encodeValue(value[index], out)
    end
    out[#out + 1] = ']'
    return
  end

  -- Object keys are sorted so two identical states produce identical strings, which makes
  -- the export reproducible and easy to diff.
  local keys = {}
  for key in pairs(value) do keys[#keys + 1] = tostring(key) end
  table.sort(keys)

  out[#out + 1] = '{'
  for index = 1, #keys do
    if index > 1 then out[#out + 1] = ',' end
    out[#out + 1] = '"' .. escape(keys[index]) .. '":'
    encodeValue(value[keys[index]], out)
  end
  out[#out + 1] = '}'
end

function encodeValue(value, out)
  local kind = type(value)
  if value == nil or kind == 'nil' then
    out[#out + 1] = 'null'
  elseif kind == 'boolean' then
    out[#out + 1] = value and 'true' or 'false'
  elseif kind == 'number' then
    out[#out + 1] = (value == floor(value)) and format('%d', value) or format('%.14g', value)
  elseif kind == 'string' then
    out[#out + 1] = '"' .. escape(value) .. '"'
  elseif kind == 'table' then
    encodeTable(value, out)
  else
    out[#out + 1] = 'null'
  end
end

function Json.encode(value)
  local out = {}
  encodeValue(value, out)
  return concat(out)
end

-- Decoding -------------------------------------------------------------------

local UNESCAPES = {
  ['"'] = '"', ['\\'] = '\\', ['/'] = '/', b = '\b', f = '\f', n = '\n', r = '\r', t = '\t',
}

--- Only the basic plane: the strings we exchange are plain text, not emoji.
local function utf8Char(point)
  if point < 0x800 then
    return string.char(0xC0 + floor(point / 0x40), 0x80 + (point % 0x40))
  end
  return string.char(
    0xE0 + floor(point / 0x1000),
    0x80 + (floor(point / 0x40) % 0x40),
    0x80 + (point % 0x40)
  )
end

local function skipSpace(text, position)
  local _, stop = text:find('^[ \n\r\t]*', position)
  return stop + 1
end

local decodeValue

local function decodeString(text, position)
  local out, index = {}, position + 1
  while true do
    local character = text:sub(index, index)
    if character == '' then return nil, 'unterminated string' end
    if character == '"' then return concat(out), index + 1 end

    if character == '\\' then
      local code = text:sub(index + 1, index + 1)
      if code == 'u' then
        local hex = text:sub(index + 2, index + 5)
        local point = tonumber(hex, 16)
        if point == nil then return nil, 'bad escape' end
        -- Anything outside the basic plane arrives as a surrogate pair; the strings we
        -- exchange are plain text, so the common path is enough.
        out[#out + 1] = point < 128 and string.char(point) or utf8Char(point)
        index = index + 6
      else
        local replacement = UNESCAPES[code]
        if replacement == nil then return nil, 'bad escape' end
        out[#out + 1] = replacement
        index = index + 2
      end
    else
      out[#out + 1] = character
      index = index + 1
    end
  end
end

local function decodeArray(text, position)
  local out, index = {}, skipSpace(text, position + 1)
  if text:sub(index, index) == ']' then return out, index + 1 end

  while true do
    local value, nextIndex = decodeValue(text, index)
    if type(nextIndex) == 'string' then return nil, nextIndex end
    out[#out + 1] = value
    index = skipSpace(text, nextIndex)
    local character = text:sub(index, index)
    if character == ']' then return out, index + 1 end
    if character ~= ',' then return nil, 'expected , or ]' end
    index = skipSpace(text, index + 1)
  end
end

local function decodeObject(text, position)
  local out, index = {}, skipSpace(text, position + 1)
  if text:sub(index, index) == '}' then return out, index + 1 end

  while true do
    if text:sub(index, index) ~= '"' then return nil, 'expected key' end
    local key, afterKey = decodeString(text, index)
    if key == nil then return nil, afterKey end
    index = skipSpace(text, afterKey)
    if text:sub(index, index) ~= ':' then return nil, 'expected :' end

    local value, afterValue = decodeValue(text, skipSpace(text, index + 1))
    if afterValue == nil then return nil, 'bad value' end
    out[key] = value
    index = skipSpace(text, afterValue)

    local character = text:sub(index, index)
    if character == '}' then return out, index + 1 end
    if character ~= ',' then return nil, 'expected , or }' end
    index = skipSpace(text, index + 1)
  end
end

function decodeValue(text, position)
  local character = text:sub(position, position)
  if character == '"' then return decodeString(text, position) end
  if character == '{' then return decodeObject(text, position) end
  if character == '[' then return decodeArray(text, position) end
  if text:sub(position, position + 3) == 'true' then return true, position + 4 end
  if text:sub(position, position + 4) == 'false' then return false, position + 5 end
  if text:sub(position, position + 3) == 'null' then return nil, position + 4 end

  local number = text:match('^-?%d+%.?%d*[eE]?[-+]?%d*', position)
  if number ~= nil and number ~= '' then
    return tonumber(number), position + #number
  end
  return nil, 'unexpected character'
end

--- Returns nil plus a reason for anything we cannot read, never an error.
function Json.decode(text)
  if type(text) ~= 'string' then return nil, 'not a string' end
  local ok, value, position = pcall(decodeValue, text, skipSpace(text, 1))
  if not ok then return nil, 'malformed' end
  if type(position) == 'string' then return nil, position end
  return value
end

return Json
