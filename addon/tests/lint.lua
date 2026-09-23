-- Lua 5.1, the game's interpreter, does not reject an escape it does not know: it simply
-- drops the backslash. `'\u{2022}'` becomes the literal `u{2022}`, which is what players
-- saw on screen. No syntax check can catch that -- luac5.1 compiles it happily -- so the
-- escapes have to be linted. Lua 5.1 knows only these, plus \ddd and a escaped newline.
local KNOWN = { a = true, b = true, f = true, n = true, r = true, t = true,
                v = true, ['\\'] = true, ['"'] = true, ["'"] = true, ['\n'] = true }

local files = {}
for line in io.popen('ls WowForeverCompanion/*.lua WowForeverCompanion/Guides/*.lua'):lines() do
  files[#files + 1] = line
end

local bad = 0
for _, path in ipairs(files) do
  local handle = assert(io.open(path, 'r'))
  local number = 0
  for line in handle:lines() do
    number = number + 1
    local position = 1
    while true do
      local at = line:find('\\', position, true)
      if at == nil then break end
      local following = line:sub(at + 1, at + 1)
      if not (KNOWN[following] or following:match('%d')) then
        -- A Windows path in a comment is not a string escape; the .toc uses those.
        if not line:match('^%s*%-%-') then
          bad = bad + 1
          print(string.format('  %s:%d  unknown escape \\%s -- Lua 5.1 will drop the backslash',
            path, number, following))
        end
      end
      position = at + 2
    end
  end
  handle:close()
end

-- The other half of the same lesson: the game reports a .toc line pointing at a file
-- that is not there as "Error loading", once per line, before any of our code runs.
local toc = assert(io.open('WowForeverCompanion/WowForeverCompanion.toc', 'r'))
for line in toc:lines() do
  local entry = line:match('^%s*([^#%s][^%s]*%.lua)%s*$')
  if entry then
    local path = 'WowForeverCompanion/' .. entry:gsub('\\', '/')
    local handle = io.open(path, 'r')
    if handle == nil then
      bad = bad + 1
      print(string.format('  the .toc lists %s, which is not shipped', entry))
    else
      handle:close()
    end
  end
end
toc:close()

if bad > 0 then
  print("\nThe addon would not load cleanly. See the messages above.")
  os.exit(1)
end
print('escapes ok: every backslash in the addon is one Lua 5.1 understands')
