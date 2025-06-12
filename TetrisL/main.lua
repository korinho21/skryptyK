-- main.lua
love.graphics.setDefaultFilter("nearest", "nearest")


local boardWidth, boardHeight = 20, 20
local windowWidth, windowHeight = 900, 850
local tileSize = windowWidth / boardWidth
local boardOffset = { x = 0, y = -120 }


local clearPhase     = false
local clearTimer     = 0
local clearDuration  = 0.5   
local flashInterval  = 0.1   
local flashVisible   = true


local blocks = {
  { {1,1,1} },
  { {1},{1} },
  { {1},{1},{1} },
  { {1} },
  { {1,1,1},{0,1,0},{0,1,0} },
  { {1,1,0},{0,1,1} },
  { {0,1,1},{1,1,0} },
  { {1,0},{1,0},{1,1} },
  { {0,1},{0,1},{1,1} },
  { {0,1,1},{1,1,0} },
  { {1,1,0},{0,1,1} },
  { {1,0},{1,0},{1,1} },
}


local board = {}
local currentBlock
local dropTimer = 0
local moveTimer = { left = 0, right = 0 }
local moveSpeed, fastMoveThreshold = 0.1, 0.2
local sounds, backgroundMusic
local gameOver = false
local linesToClear = {}
local score = 0

function love.load()
  love.window.setTitle("Tetris")
  love.window.setMode(windowWidth, windowHeight)

  
  backgroundMusic = love.audio.newSource("Sounds/background.mp3", "stream")
  backgroundMusic:setLooping(true)
  backgroundMusic:setVolume(0.5)
  backgroundMusic:play()

  sounds = {
    clear = love.audio.newSource("Sounds/clear.mp3", "static"),
    drop  = love.audio.newSource("Sounds/drop.mp3",  "static"),
    land  = love.audio.newSource("Sounds/land.mp3",  "static"),
  }

 
  for y = 1, boardHeight do
    board[y] = {}
    for x = 1, boardWidth do
      board[y][x] = 0
    end
  end

  score = 0
  gameOver = false
  spawnNewBlock()
end


function spawnNewBlock()
  local shape = blocks[love.math.random(#blocks)]
  local x = math.floor(boardWidth / 2) - 1
  local y = 0
  local newBlock = { shape = shape, x = x, y = y }

  if not canMove(newBlock, 0, 0) then
    gameOver = true
    currentBlock = nil
  else
    currentBlock = newBlock
  end
end


function canMove(block, dx, dy)
  for by, row in ipairs(block.shape) do
    for bx, v in ipairs(row) do
      if v == 1 then
        local newX = block.x + bx + dx - 1
        local newY = block.y + by + dy - 1
        if newX < 1
          or newX > boardWidth
          or newY > boardHeight
          or (newY >= 1 and board[newY][newX] ~= 0)
        then
          return false
        end
      end
    end
  end
  return true
end


function dropBlock()
  if not currentBlock then return end
  love.audio.play(sounds.drop)
  while canMove(currentBlock, 0, 1) do
    currentBlock.y = currentBlock.y + 1
  end
  lockBlock()
end


function checkFullLines()
  local full = {}
  for y = 1, boardHeight do
    local isFull = true
    for x = 1, boardWidth do
      if board[y][x] == 0 then
        isFull = false
        break
      end
    end
    if isFull then
      table.insert(full, y)
    end
  end
  return full
end


function clearLines()
  local cleared = 0
  for y = boardHeight, 1, -1 do
    local isFull = true
    for x = 1, boardWidth do
      if board[y][x] == 0 then
        isFull = false
        break
      end
    end
    if isFull then
      table.remove(board, y)
      local empty = {}
      for i = 1, boardWidth do empty[i] = 0 end
      table.insert(board, 1, empty)
      cleared = cleared + 1
    end
  end
  if cleared > 0 then
    score = score + (cleared ^ 2) * 100
    love.audio.play(sounds.clear)
  end
end


function lockBlock()
  if not currentBlock then return end
  love.audio.play(sounds.land)

  for by, row in ipairs(currentBlock.shape) do
    for bx, v in ipairs(row) do
      if v == 1 then
        local px = currentBlock.x + bx - 1
        local py = currentBlock.y + by - 1
        if py >= 1 and py <= boardHeight and px >= 1 and px <= boardWidth then
          board[py][px] = 1
        end
      end
    end
  end

  linesToClear = checkFullLines()
  if #linesToClear > 0 then
    clearPhase = true
    clearTimer = 0
    flashVisible = true
  else
    spawnNewBlock()
  end
end

function love.update(dt)
  if gameOver then return end

  
  if clearPhase then
    clearTimer = clearTimer + dt
    flashVisible = (clearTimer % (flashInterval * 2)) < flashInterval

    if clearTimer >= clearDuration then
      clearLines()
      linesToClear = {}
      clearPhase = false
      spawnNewBlock()
    end
    return
  end

  
  dropTimer = dropTimer + dt
  if dropTimer > 0.5 then
    if canMove(currentBlock, 0, 1) then
      currentBlock.y = currentBlock.y + 1
    else
      lockBlock()
    end
    dropTimer = 0
  end

  
  if love.keyboard.isDown("a") then
    moveTimer.left = moveTimer.left + dt
    if moveTimer.left > moveSpeed - (moveTimer.left > fastMoveThreshold and 0.05 or 0) then
      if canMove(currentBlock, -1, 0) then
        currentBlock.x = currentBlock.x - 1
      end
      moveTimer.left = 0
    end
  else
    moveTimer.left = 0
  end

  if love.keyboard.isDown("d") then
    moveTimer.right = moveTimer.right + dt
    if moveTimer.right > moveSpeed - (moveTimer.right > fastMoveThreshold and 0.05 or 0) then
      if canMove(currentBlock, 1, 0) then
        currentBlock.x = currentBlock.x + 1
      end
      moveTimer.right = 0
    end
  else
    moveTimer.right = 0
  end
end

--animacja przy usuwaniu linii
function love.draw()
  
  if clearPhase and flashVisible then
    love.graphics.setColor(1, 1, 0, 0.6)
    for _, ly in ipairs(linesToClear) do
      local yPixel = boardOffset.y + (ly - 1) * tileSize
      love.graphics.rectangle("fill", 0, yPixel, windowWidth, tileSize)
    end
    love.graphics.setColor(1, 1, 1)
  end

  
  for y = 1, boardHeight do
    for x = 1, boardWidth do
      if board[y][x] ~= 0 then
        local px = boardOffset.x + (x - 1) * tileSize
        local py = boardOffset.y + (y - 1) * tileSize
        love.graphics.setColor(1,1,1)
        love.graphics.rectangle("fill", px, py, tileSize, tileSize)
      end
    end
  end

  
  if currentBlock then
    love.graphics.setColor(1,0,0)
    for by, row in ipairs(currentBlock.shape) do
      for bx, v in ipairs(row) do
        if v == 1 then
          local px = boardOffset.x + (currentBlock.x + bx - 2) * tileSize
          local py = boardOffset.y + (currentBlock.y + by - 2) * tileSize
          love.graphics.rectangle("fill", px, py, tileSize, tileSize)
        end
      end
    end
  end

  
  if gameOver then
    love.graphics.setColor(1,1,1)
    love.graphics.rectangle("fill", 0, windowHeight/2 - 40, windowWidth, 80)
    love.graphics.setColor(0,0,1)
    love.graphics.printf("GAME OVER\nPress R to restart",
      0, windowHeight/2 - 20, windowWidth, "center")
    love.graphics.setColor(1,1,1)
  end

  
  love.graphics.print("Score: " .. score, 10, 10)
end

function love.keypressed(key)
  if key == "space" then
    dropBlock()
  elseif key == "r" then
    restartGame()
  elseif key == "k" then
    saveGame()
  elseif key == "l" then
    loadGame()
  end
end

function saveGame()
  local data = {}
  for y = 1, boardHeight do
    data[y] = table.concat(board[y], ",")
  end
  love.filesystem.write("save.txt", table.concat(data, "\n"))
  print("Gra została zapisana.")
end

function loadGame()
  if not love.filesystem.getInfo("save.txt") then return end
  local raw = love.filesystem.read("save.txt")
  board = {}
  local y = 1
  for line in raw:gmatch("[^\r\n]+") do
    board[y] = {}
    for v in line:gmatch("[^,]+") do
      board[y][#board[y]+1] = tonumber(v)
    end
    y = y + 1
  end
  score = 0
  gameOver = false
  clearPhase = false
  linesToClear = {}
  dropTimer = 0
  backgroundMusic:stop()
  backgroundMusic:play()
  spawnNewBlock()
  print("Gra została wczytana.")
end

function restartGame()
  for y = 1, boardHeight do
    for x = 1, boardWidth do
      board[y][x] = 0
    end
  end
  score = 0
  gameOver = false
  clearPhase = false
  linesToClear = {}
  dropTimer = 0
  backgroundMusic:stop()
  backgroundMusic:play()
  spawnNewBlock()
end