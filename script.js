const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 400;
canvas.height = 800; // Increased height for a longer road

// Car Image (Declare at top level)
const carImage = new Image();
carImage.src = 'car.png'; // Make sure you have a car.png in your game directory!

// Game variables
let playerCar = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100, // Position relative to new canvas height
    width: 50,
    height: 80,
    speed: 0,
    angle: 0,
    maxSpeed: 10, // Increased max speed
    acceleration: 0.2, // Increased acceleration
    deceleration: 0.05, // Reduced deceleration
    turnSpeed: 0.05 // Reduced turn speed for less sensitive turning
};

let road = {
    y: 0,
    speed: 5
};

let obstacles = [];
let trees = []; // New array for trees
let obstacleSpawnInterval = 100; // How often to try and spawn an obstacle (frames)
let obstacleTimer = 0;
let gameOver = false;
let score = 0;
let level = 1; // New variable for current level
let gameStarted = false; // New variable to control game state
let weatherTypes = ['sunny', 'rainy', 'snowy', 'night'];
let currentWeatherIndex = 0;
let currentWeather = weatherTypes[currentWeatherIndex];

let keys = {};

// Audio elements
const crashSound = new Audio('crash.mp3');
const backgroundMusic = new Audio('background_music.mp3');
backgroundMusic.loop = true; // Loop background music

// Event Listeners for input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && (!gameStarted || gameOver)) { // Spacebar to start/restart
        if (!gameStarted) {
            gameStarted = true;
            resetGame();
        } else if (gameOver) {
            resetGame();
            gameStarted = true;
        }
    } else if (e.key === 't') { // Toggle weather
        currentWeatherIndex = (currentWeatherIndex + 1) % weatherTypes.length;
        currentWeather = weatherTypes[currentWeatherIndex];
        console.log("Weather changed to: ", currentWeather);
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game Loop
function gameLoop() {
    if (gameStarted && !gameOver) {
        update();
        draw();
    } else if (!gameStarted) {
        drawStartScreen();
    } else if (gameOver) {
        drawGameOverScreen();
    }
    requestAnimationFrame(gameLoop);

    // Play/pause background music
    if (gameStarted && !gameOver) {
        backgroundMusic.play();
    } else {
        backgroundMusic.pause();
    }
}

function resetGame() {
    playerCar = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 100, // Position relative to new canvas height
        width: 50,
        height: 80,
        speed: 0,
        angle: 0,
        maxSpeed: 10,
        acceleration: 0.2,
        deceleration: 0.05,
        turnSpeed: 0.05
    };
    road.y = 0;
    obstacles = [];
    trees = []; // Clear trees on reset
    spawnObstacle(); // Spawn an initial obstacle immediately
    obstacleTimer = 0;
    gameOver = false;
    score = 0;
    level = 1; // Reset level on new game
    keys = {};
    backgroundMusic.currentTime = 0; // Reset music to start
    crashSound.currentTime = 0; // Reset crash sound
    currentWeatherIndex = 0; // Reset weather to sunny
    currentWeather = weatherTypes[currentWeatherIndex];
}

function spawnObstacle() {
    const obstacleWidth = 40 + Math.random() * 30; // Random width
    const obstacleHeight = 60 + Math.random() * 40; // Random height
    const obstacleX = Math.random() * (canvas.width - obstacleWidth);
    const obstacleY = -obstacleHeight; // Start off-screen at the top
    const colors = ['red', 'green', 'purple', 'orange', 'gray', 'brown'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newObstacle = {
        x: obstacleX,
        y: obstacleY,
        width: obstacleWidth,
        height: obstacleHeight,
        color: randomColor
    };
    obstacles.push(newObstacle);
    console.log("Spawned obstacle:", newObstacle);
}

function spawnTree() {
    const treeWidth = 20 + Math.random() * 10;
    const treeHeight = 50 + Math.random() * 30;
    const treeY = -treeHeight; // Start off-screen at the top

    // Left side tree
    trees.push({
        x: 20, // Fixed X for left side
        y: treeY,
        width: treeWidth,
        height: treeHeight,
        color: 'green', // Tree color
        trunkColor: 'brown' // Trunk color
    });

    // Right side tree
    trees.push({
        x: canvas.width - 20 - treeWidth, // Fixed X for right side
        y: treeY,
        width: treeWidth,
        height: treeHeight,
        color: 'green', // Tree color
        trunkColor: 'brown' // Trunk color
    });
}

// Update game state
function update() {
    console.log("playerCar state: ", playerCar);
    if (!playerCar) {
        console.error("playerCar is undefined! Stopping update.");
        return; // Stop update if playerCar is not defined
    }
    // Car movement
    if (keys['ArrowUp'] || keys['w']) {
        playerCar.speed = Math.min(playerCar.speed + playerCar.acceleration, playerCar.maxSpeed);
    } else if (keys['ArrowDown'] || keys['s']) {
        playerCar.speed = Math.max(playerCar.speed - playerCar.acceleration, -playerCar.maxSpeed / 2); // Allow reverse
    } else {
        // Decelerate if no acceleration/braking
        if (playerCar.speed > 0) {
            playerCar.speed = Math.max(0, playerCar.speed - playerCar.deceleration);
        } else if (playerCar.speed < 0) {
            playerCar.speed = Math.min(0, playerCar.speed + playerCar.deceleration);
        }
    }

    if (keys['ArrowLeft'] || keys['a']) {
        playerCar.angle -= playerCar.turnSpeed; // Turn consistently regardless of speed
    }
    if (keys['ArrowRight'] || keys['d']) {
        playerCar.angle += playerCar.turnSpeed; // Turn consistently regardless of speed
    }

    // Apply movement based on speed and angle
    playerCar.x += Math.sin(playerCar.angle) * playerCar.speed;
    playerCar.y -= Math.cos(playerCar.angle) * playerCar.speed;

    // Road scrolling
    road.y += playerCar.speed;
    if (road.y >= canvas.height) {
        road.y = 0;
    }

    // Keep car within horizontal bounds (simple for now)
    if (playerCar.x < 0) playerCar.x = 0;
    if (playerCar.x + playerCar.width > canvas.width) playerCar.x = canvas.width - playerCar.width;

    // Keep car within vertical bounds (simple for now)
    if (playerCar.y < 0) playerCar.y = 0;
    if (playerCar.y + playerCar.height > canvas.height) playerCar.y = canvas.height - playerCar.height;

    // Increment score based on speed
    score += Math.floor(playerCar.speed * 0.1);
    score = Math.max(0, score); // Ensure score does not go below zero

    // Leveling logic
    if (score > level * 500) { // Increase level every 500 points
        level++;
        road.speed += 0.5; // Increase road speed
        obstacleSpawnInterval = Math.max(50, obstacleSpawnInterval - 10); // Increase obstacle frequency
        playerCar.maxSpeed += 0.5; // Allow car to go faster
        console.log(`Level Up! Current Level: ${level}, Road Speed: ${road.speed}, Obstacle Interval: ${obstacleSpawnInterval}`);
    }

    // Obstacle logic
    obstacleTimer++;
    if (obstacleTimer >= obstacleSpawnInterval) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    // Tree logic
    // Spawn trees more frequently to create a consistent line
    if (Math.random() < 0.5) { 
        spawnTree();
    }

    console.log("Obstacles array before loop:", obstacles);
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        console.log("Processing obstacle at index ", i, ": ", obs);
        if (!obs) { // Check if obstacle is undefined
            console.error("Undefined obstacle found at index: ", i);
            obstacles.splice(i, 1); // Remove the undefined entry
            continue; // Skip to next iteration
        }
        obs.y += road.speed; // Obstacles move down with road speed

        // Remove obstacles that are off-screen
        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
        }

        // Collision detection (AABB - Axis-Aligned Bounding Box)
        if (
            playerCar.x < obs.x + obs.width &&
            playerCar.x + playerCar.width > obs.x &&
            playerCar.y < obs.y + obs.height &&
            playerCar.y + playerCar.height > obs.y
        ) {
            gameOver = true;
            crashSound.play();
        }
    }
    console.log("Obstacles array after loop:", obstacles);

    for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i];
        tree.y += road.speed; // Trees move down with road speed

        // Remove trees that are off-screen
        if (tree.y > canvas.height) {
            trees.splice(i, 1);
        }
    }
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Road
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply weather effects
    applyWeatherEffects();

    // Draw Lane Lines (simple for now)
    ctx.fillStyle = '#fff';
    const laneWidth = 10;
    const laneGap = 20;
    const numLanes = 3;
    for (let i = 0; i < numLanes; i++) {
        let x = (canvas.width / (numLanes + 1)) * (i + 1) - laneWidth / 2;
        for (let j = 0; j < canvas.height / (laneGap * 2); j++) {
            ctx.fillRect(x, (j * laneGap * 2 + road.y) % canvas.height, laneWidth, laneGap);
        }
    }

    // Draw Player Car
    ctx.save(); // Save current canvas state
    ctx.translate(playerCar.x + playerCar.width / 2, playerCar.y + playerCar.height / 2); // Move origin to car center
    ctx.rotate(playerCar.angle); // Rotate
    
    if (carImage.complete && carImage.naturalHeight !== 0) {
        ctx.drawImage(carImage, -playerCar.width / 2, -playerCar.height / 2, playerCar.width, playerCar.height);
    } else {
        console.log("Car image not loaded, drawing fallback shape.");
        // Fallback to drawing if image not loaded
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(0, -playerCar.height / 2); // Top center
        ctx.lineTo(playerCar.width / 2, -playerCar.height / 2 + 20); // Top right
        ctx.lineTo(playerCar.width / 2 - 10, playerCar.height / 2); // Bottom right
        ctx.lineTo(-playerCar.width / 2 + 10, playerCar.height / 2); // Bottom left
        ctx.lineTo(-playerCar.width / 2, -playerCar.height / 2 + 20); // Top left
        ctx.closePath();
        ctx.fill();

        // Draw cockpit/windshield
        ctx.fillStyle = '#ADD8E6'; // Light blue for windshield
        ctx.beginPath();
        ctx.moveTo(-playerCar.width / 4, -playerCar.height / 2 + 15);
        ctx.lineTo(playerCar.width / 4, -playerCar.height / 2 + 15);
        ctx.lineTo(playerCar.width / 4 - 5, 0);
        ctx.lineTo(-playerCar.width / 4 + 5, 0);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore(); // Restore canvas state

    // Draw Trees
    for (let i = 0; i < trees.length; i++) {
        const tree = trees[i];
        // Draw trunk
        ctx.fillStyle = tree.trunkColor;
        ctx.fillRect(tree.x, tree.y + tree.height * 0.7, tree.width, tree.height * 0.3); // Trunk at bottom
        // Draw leaves (triangle for a more tree-like shape)
        ctx.fillStyle = tree.color;
        ctx.beginPath();
        ctx.moveTo(tree.x + tree.width / 2, tree.y); // Top point
        ctx.lineTo(tree.x - tree.width * 0.5, tree.y + tree.height * 0.8); // Bottom-left point
        ctx.lineTo(tree.x + tree.width * 1.5, tree.y + tree.height * 0.8); // Bottom-right point
        ctx.closePath();
        ctx.fill();
    }

    // Draw Obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        ctx.fillStyle = obs.color;

        ctx.beginPath();
        ctx.rect(obs.x, obs.y, obs.width, obs.height);
        ctx.fill();

        // Draw obstacle windows (simple rectangles for now)
        ctx.fillStyle = '#ADD8E6'; // Light blue for windows
        ctx.fillRect(obs.x + obs.width * 0.1, obs.y + obs.height * 0.1, obs.width * 0.8, obs.height * 0.3);
        ctx.fillRect(obs.x + obs.width * 0.1, obs.y + obs.height * 0.6, obs.width * 0.8, obs.height * 0.3);

        // Draw wheels
        ctx.fillStyle = '#333'; // Dark color for wheels
        // Front left wheel
        ctx.fillRect(obs.x - obs.width * 0.1, obs.y + obs.height * 0.2, obs.width * 0.2, obs.height * 0.2);
        // Front right wheel
        ctx.fillRect(obs.x + obs.width * 0.9, obs.y + obs.height * 0.2, obs.width * 0.2, obs.height * 0.2);
        // Rear left wheel
        ctx.fillRect(obs.x - obs.width * 0.1, obs.y + obs.height * 0.6, obs.width * 0.2, obs.height * 0.2);
        // Rear right wheel
        ctx.fillRect(obs.x + obs.width * 0.9, obs.y + obs.height * 0.6, obs.width * 0.2, obs.height * 0.2);
    }

    // Draw Score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Draw Level
    ctx.fillText(`Level: ${level}`, 10, 90);

    // Draw Speed
    ctx.fillText(`Speed: ${Math.floor(playerCar.speed * 10)} km/h`, 10, 60);

    // Draw Weather
    ctx.fillText(`Weather: ${currentWeather.toUpperCase()}`, 10, 120);
}

function applyWeatherEffects() {
    if (currentWeather === 'rainy') {
        // Draw rain drops
        ctx.fillStyle = 'rgba(173, 216, 230, 0.5)'; // Light blue, semi-transparent
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 10);
        }
    } else if (currentWeather === 'snowy') {
        // Draw snowflakes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // White, semi-transparent
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (currentWeather === 'night') {
        // Apply a dark overlay
        ctx.fillStyle = 'rgba(0, 0, 50, 0.4)'; // Dark blue, semi-transparent
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawStartScreen() {
    console.log("Drawing Start Screen");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRINCE DRIVING', canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '18px Arial';
    ctx.fillText('Use Arrow Keys or WASD to Drive', canvas.width / 2, canvas.height / 2 + 60);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Level Reached: ${level}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 70);
}

// Start the game loop
gameLoop();