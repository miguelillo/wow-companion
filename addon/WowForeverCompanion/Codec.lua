-- The transfer string: the one thing the desktop client has to read out of our
-- SavedVariables. It is the same format the web produces, so a string generated on either
-- side imports on the other.
--
--   WCP1:  base64 of raw-deflate of the JSON   (needs LibDeflate)
--   WCP1U: base64 of the JSON                  (no library, longer string)
--
-- Both prefixes are understood on import. Without LibDeflate we export the uncompressed
-- form rather than refusing: a longer string beats no string.
local _, ns = ...

local Codec = {}
ns.Codec = Codec

local PREFIX_DEFLATED = 'WCP1:'
local PREFIX_PLAIN = 'WCP1U:'
local ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

local byte, char, concat, floor, sub = string.byte, string.char, table.concat, math.floor, string.sub

local DECODE_MAP = {}
for index = 1, #ALPHABET do
  DECODE_MAP[sub(ALPHABET, index, index)] = index - 1
end

local function letter(value)
  return sub(ALPHABET, value + 1, value + 1)
end

function Codec.base64Encode(text)
  local out, length, index = {}, #text, 1

  while index + 2 <= length do
    local a, b, c = byte(text, index, index + 2)
    local packed = a * 65536 + b * 256 + c
    out[#out + 1] = letter(floor(packed / 262144))
      .. letter(floor(packed / 4096) % 64)
      .. letter(floor(packed / 64) % 64)
      .. letter(packed % 64)
    index = index + 3
  end

  local remaining = length - index + 1
  if remaining == 1 then
    local packed = byte(text, index) * 16
    out[#out + 1] = letter(floor(packed / 64)) .. letter(packed % 64) .. '=='
  elseif remaining == 2 then
    local a, b = byte(text, index, index + 1)
    local packed = (a * 256 + b) * 4
    out[#out + 1] = letter(floor(packed / 4096))
      .. letter(floor(packed / 64) % 64)
      .. letter(packed % 64) .. '='
  end

  return concat(out)
end

function Codec.base64Decode(text)
  local cleaned = text:gsub('[^A-Za-z0-9+/=]', '')
  local out, index = {}, 1

  while index + 3 <= #cleaned do
    local values, padding = {}, 0
    for position = 0, 3 do
      local character = sub(cleaned, index + position, index + position)
      if character == '=' then
        values[position + 1] = 0
        padding = padding + 1
      else
        local value = DECODE_MAP[character]
        if value == nil then return nil end
        values[position + 1] = value
      end
    end

    local packed = values[1] * 262144 + values[2] * 4096 + values[3] * 64 + values[4]
    out[#out + 1] = char(floor(packed / 65536))
    if padding < 2 then out[#out + 1] = char(floor(packed / 256) % 256) end
    if padding < 1 then out[#out + 1] = char(packed % 256) end
    index = index + 4
  end

  return concat(out)
end

--- LibDeflate is optional. Without it we still export, just uncompressed.
local function deflate()
  return _G.LibStub and _G.LibStub('LibDeflate', true) or nil
end

function Codec.encode(state)
  local json = ns.Json.encode(state)
  local library = deflate()

  if library ~= nil then
    local compressed = library:CompressDeflate(json, { level = 9 })
    if compressed ~= nil then
      return PREFIX_DEFLATED .. Codec.base64Encode(compressed)
    end
  end

  return PREFIX_PLAIN .. Codec.base64Encode(json)
end

--- Returns nil plus a reason, so the caller can say what is wrong in one line.
function Codec.decode(text)
  if type(text) ~= 'string' then return nil, 'empty' end
  local trimmed = text:gsub('%s', '')

  local payload, compressed
  if sub(trimmed, 1, #PREFIX_DEFLATED) == PREFIX_DEFLATED then
    payload, compressed = sub(trimmed, #PREFIX_DEFLATED + 1), true
  elseif sub(trimmed, 1, #PREFIX_PLAIN) == PREFIX_PLAIN then
    payload, compressed = sub(trimmed, #PREFIX_PLAIN + 1), false
  else
    return nil, 'not one of ours'
  end

  local bytes = Codec.base64Decode(payload)
  if bytes == nil then return nil, 'bad base64' end

  if compressed then
    local library = deflate()
    if library == nil then return nil, 'needs LibDeflate' end
    bytes = library:DecompressDeflate(bytes)
    if bytes == nil then return nil, 'bad compressed data' end
  end

  local value = ns.Json.decode(bytes)
  if type(value) ~= 'table' then return nil, 'bad payload' end
  return value
end

return Codec
