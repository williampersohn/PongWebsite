const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

// Diagnostic: confirm canvas and context are available and draw a visible test mark
console.log('Pong script start - canvas:', canvas, 'context:', !!context);
if (context) {
  // small visible test so user can see something immediately
  context.fillStyle = 'red';
  context.fillRect(6, 6, 40, 24);
  context.fillStyle = 'yellow';
  context.beginPath();
  context.arc(60, 30, 8, 0, Math.PI * 2);
  context.fill();
}

const paddleWidth = 10;
const paddleHeight = 100;
const ballRadius = 8;
const paddleSpeed = 6;

// ensure the canvas drawing buffer matches the design size
canvas.width = 800;
canvas.height = 500;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const leftPaddle = {
  x: 10,
  y: canvasHeight / 2 - paddleHeight / 2,
  dy: 0,
};

const rightPaddle = {
  x: canvasWidth - paddleWidth - 10,
  y: canvasHeight / 2 - paddleHeight / 2,
  dy: 0,
};

const ball = {
  x: canvasWidth / 2,
  y: canvasHeight / 2,
  dx: 5,
  dy: 3,
};

const score = {
  left: 0,
  right: 0,
};

const leftScoreElement = document.getElementById('leftScore');
const rightScoreElement = document.getElementById('rightScore');
const arcadeLeftScoreElement = document.getElementById('arcadeLeftScore');
const arcadeRightScoreElement = document.getElementById('arcadeRightScore');
const restartButton = document.getElementById('restartButton');
// Fallback DOM elements (optional)
const domLeftPaddle = document.getElementById('domLeftPaddle');
const domRightPaddle = document.getElementById('domRightPaddle');
const domBall = document.getElementById('domBall');

// Determine page mode and control mapping
const pageName = window.location.pathname.split('/').pop().toLowerCase();
let rightControls = { up: 'ArrowUp', down: 'ArrowDown' };
let useAI = false;
if (pageName === 'multiplayer.html') {
  // Multiplayer page uses O/K for the right paddle
  rightControls = { up: 'o', down: 'k' };
}
if (pageName === 'single.html') {
  // Single-player page will use a CPU to control the right paddle
  useAI = true;
}

function drawRect(x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function clearScreen() {
  drawRect(0, 0, canvasWidth, canvasHeight, '#000');
}

function resetBall() {
  ball.x = canvasWidth / 2;
  ball.y = canvasHeight / 2;
  ball.dx = Math.random() > 0.5 ? 5 : -5;
  ball.dy = Math.random() > 0.5 ? 3 : -3;
}

let cpuMiss = false;
let cpuMissAssigned = false;

function resetGame() {
  score.left = 0;
  score.right = 0;
  leftPaddle.y = canvasHeight / 2 - paddleHeight / 2;
  rightPaddle.y = canvasHeight / 2 - paddleHeight / 2;
  updateScoreboard();
  resetBall();
  cpuMiss = false;
  cpuMissAssigned = false;
}

function updateScoreboard() {
  if (leftScoreElement) {
    leftScoreElement.textContent = score.left;
  }
  if (rightScoreElement) {
    rightScoreElement.textContent = score.right;
  }
  if (arcadeLeftScoreElement) {
    arcadeLeftScoreElement.textContent = score.left;
  }
  if (arcadeRightScoreElement) {
    arcadeRightScoreElement.textContent = score.right;
  }
}

function endGame(side) {
  const mode = useAI ? 'single' : 'multiplayer';
  window.location.href = `winner.html?side=${encodeURIComponent(side)}&mode=${mode}`;
}

function movePaddles() {
  // If single-player mode, control right paddle with a simple CPU
  if (useAI) {
    const paddleCenter = rightPaddle.y + paddleHeight / 2;
    const reactionZone = 8; // deadzone to avoid jitter
    const missChance = 0.05; // 5% miss rate per rightward rally

    if (ball.dx > 0 && !cpuMissAssigned) {
      cpuMiss = Math.random() < missChance;
      cpuMissAssigned = true;
    }
    if (ball.dx < 0) {
      cpuMissAssigned = false;
      cpuMiss = false;
    }

    // CPU reacts only when the ball is moving toward it and not missing intentionally
    if (!cpuMiss) {
      if (ball.y < paddleCenter - reactionZone) {
        rightPaddle.dy = -paddleSpeed;
      } else if (ball.y > paddleCenter + reactionZone) {
        rightPaddle.dy = paddleSpeed;
      } else {
        rightPaddle.dy = 0;
      }
    } else {
      rightPaddle.dy = 0;
    }
  }

  leftPaddle.y += leftPaddle.dy;
  rightPaddle.y += rightPaddle.dy;

  if (leftPaddle.y < 0) leftPaddle.y = 0;
  if (leftPaddle.y + paddleHeight > canvasHeight) leftPaddle.y = canvasHeight - paddleHeight;
  if (rightPaddle.y < 0) rightPaddle.y = 0;
  if (rightPaddle.y + paddleHeight > canvasHeight) rightPaddle.y = canvasHeight - paddleHeight;
}

function moveBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= canvasHeight) {
    ball.dy = -ball.dy;
  }

  const leftPaddleTop = leftPaddle.y;
  const leftPaddleBottom = leftPaddle.y + paddleHeight;
  const rightPaddleTop = rightPaddle.y;
  const rightPaddleBottom = rightPaddle.y + paddleHeight;

  if (
    ball.x - ballRadius <= leftPaddle.x + paddleWidth &&
    ball.y >= leftPaddleTop &&
    ball.y <= leftPaddleBottom
  ) {
    ball.dx = -ball.dx;
    ball.x = leftPaddle.x + paddleWidth + ballRadius;
  }

  if (
    ball.x + ballRadius >= rightPaddle.x &&
    ball.y >= rightPaddleTop &&
    ball.y <= rightPaddleBottom
  ) {
    ball.dx = -ball.dx;
    ball.x = rightPaddle.x - ballRadius;
  }

  if (ball.x - ballRadius < 0) {
    score.right += 1;
    updateScoreboard();
    if (score.right >= 5) {
      endGame('right');
      return;
    }
    resetBall();
  }

  if (ball.x + ballRadius > canvasWidth) {
    score.left += 1;
    updateScoreboard();
    if (score.left >= 5) {
      endGame('left');
      return;
    }
    resetBall();
  }
}

function draw() {
  clearScreen();
  drawRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight, '#fff');
  drawRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight, '#fff');
  drawCircle(ball.x, ball.y, ballRadius, '#fff');

  // update DOM fallback positions if present
  if (domLeftPaddle) {
    domLeftPaddle.style.left = `${leftPaddle.x}px`;
    domLeftPaddle.style.top = `${leftPaddle.y}px`;
    domLeftPaddle.style.height = `${paddleHeight}px`;
  }
  if (domRightPaddle) {
    domRightPaddle.style.left = `${rightPaddle.x}px`;
    domRightPaddle.style.top = `${rightPaddle.y}px`;
    domRightPaddle.style.height = `${paddleHeight}px`;
  }
  if (domBall) {
    domBall.style.left = `${ball.x}px`;
    domBall.style.top = `${ball.y}px`;
  }
}

function update() {
  movePaddles();
  moveBall();
  draw();
  requestAnimationFrame(update);
}

let gameLoopStarted = false;

function handleKeyDown(event) {
  const key = event.key;
  if (key === 'w' || key === 'W') {
    leftPaddle.dy = -paddleSpeed;
  }
  if (key === 's' || key === 'S') {
    leftPaddle.dy = paddleSpeed;
  }
  if (!useAI) {
    if (key === rightControls.up || key === rightControls.up.toUpperCase()) {
      rightPaddle.dy = -paddleSpeed;
    }
    if (key === rightControls.down || key === rightControls.down.toUpperCase()) {
      rightPaddle.dy = paddleSpeed;
    }
  }
}

function handleKeyUp(event) {
  const key = event.key;
  if (key === 'w' || key === 'W' || key === 's' || key === 'S') {
    leftPaddle.dy = 0;
  }
  if (!useAI) {
    if (
      key === rightControls.up || key === rightControls.up.toUpperCase() ||
      key === rightControls.down || key === rightControls.down.toUpperCase()
    ) {
      rightPaddle.dy = 0;
    }
  }
}

function startGame() {
  resetGame();
  if (!gameLoopStarted) {
    gameLoopStarted = true;
    requestAnimationFrame(update);
  }
}

restartButton.addEventListener('click', startGame);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Start the game immediately when the page loads
startGame();
console.log('Pong script initialized on', pageName);
document.addEventListener('keyup', handleKeyUp);

startGame();
