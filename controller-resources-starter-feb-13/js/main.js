import * as THREE from 'three';
import { Player } from './Behaviour/Player.js';
import { Controller } from './Behaviour/Controller.js';
import { GameMap } from './World/GameMap.js';
import { ZombieManager } from './Entities/ZombieManager.js';

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 200, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 10;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// Create clock
const clock = new THREE.Clock();

// Create controller
const controller = new Controller(document, camera);

// Declare our GameMap and Player
let gameMap;
let player;

// Declare ZombieManager
let zombieManager;

// Game state
let gameState = {
    currentLevel: 1,
    maxLevel: 3,
    escaped: false,
    gameOver: false,
    startTime: 0,
    escapeTime: 0,
    transitioning: false,
    transitionTimer: 0,
    transitionDuration: 10 // 10 seconds between levels
};

// Camera parameters - adjusted for larger maze
const THIRD_PERSON_DISTANCE = 5; // Adjusted distance for clear view of cone's base
const THIRD_PERSON_HEIGHT = 3;   // Lower height to better see the cone's base
const FIRST_PERSON_HEIGHT = 2;   // Height for first-person view
const CAMERA_CHECK_DISTANCE = 20; // Distance for wall detection
const FREE_CAMERA_HEIGHT = 100;   // Height for free camera view

// Camera modes: 'third-person', 'first-person', or 'free'
let cameraMode = 'third-person';
let previousCameraMode = 'third-person'; // Store previous mode for toggling back
let cameraAngle = 0;
let cameraHeight = THIRD_PERSON_HEIGHT;
let isDragging = false;

// Free camera controls
const freeCameraPosition = new THREE.Vector3(0, FREE_CAMERA_HEIGHT, 0);
const freeCameraTarget = new THREE.Vector3(0, 0, 0);

// Raycaster for wall detection
const raycaster = new THREE.Raycaster();

// UI elements for game status
const statusElement = document.createElement('div');
statusElement.style.position = 'absolute';
statusElement.style.top = '20px';
statusElement.style.left = '20px';
statusElement.style.color = 'white';
statusElement.style.fontSize = '18px';
statusElement.style.fontFamily = 'Arial, sans-serif';
statusElement.style.padding = '10px';
statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
statusElement.style.borderRadius = '5px';
document.body.appendChild(statusElement);

// Level display element
const levelElement = document.createElement('div');
levelElement.style.position = 'absolute';
levelElement.style.top = '60px';
levelElement.style.left = '20px';
levelElement.style.color = 'white';
levelElement.style.fontSize = '18px';
levelElement.style.fontFamily = 'Arial, sans-serif';
levelElement.style.padding = '10px';
levelElement.style.backgroundColor = 'rgba(223, 161, 161, 0.5)';
levelElement.style.borderRadius = '5px';
document.body.appendChild(levelElement);

// Mouse control status element
const mouseControlStatusElement = document.createElement('div');
mouseControlStatusElement.style.position = 'absolute';
mouseControlStatusElement.style.top = '100px';
mouseControlStatusElement.style.left = '20px';
mouseControlStatusElement.style.color = 'white';
mouseControlStatusElement.style.fontSize = '14px';
mouseControlStatusElement.style.fontFamily = 'Arial, sans-serif';
mouseControlStatusElement.style.padding = '5px';
mouseControlStatusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
mouseControlStatusElement.style.borderRadius = '5px';
mouseControlStatusElement.textContent = 'Mouse camera control: ON (press M to toggle)';
document.body.appendChild(mouseControlStatusElement);

// Victory/transition message
const messageElement = document.createElement('div');
messageElement.style.position = 'absolute';
messageElement.style.top = '50%';
messageElement.style.left = '50%';
messageElement.style.transform = 'translate(-50%, -50%)';
messageElement.style.color = 'white';
messageElement.style.fontSize = '36px';
messageElement.style.fontFamily = 'Arial, sans-serif';
messageElement.style.textAlign = 'center';
messageElement.style.padding = '20px';
messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
messageElement.style.borderRadius = '10px';
messageElement.style.display = 'none';
document.body.appendChild(messageElement);

// Prevent context menu on right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Add resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Cleanup current level objects
function cleanupLevel() {
    // Remove existing map
    if (gameMap && gameMap.gameObject) {
        scene.remove(gameMap.gameObject);
    }
    
    // Remove existing player
    if (player && player.gameObject) {
        scene.remove(player.gameObject);
    }
    
    // Cleanup zombie manager
    if (zombieManager) {
        zombieManager.cleanup();
    }
}

// Load a specific level
function loadLevel(levelNumber) {
    console.log(`Loading level ${levelNumber}`);
    
    // Clean up existing level objects
    cleanupLevel();
    
    // Create new map with specified level
    gameMap = new GameMap(levelNumber);
    scene.add(gameMap.gameObject);
    
    // Create player
    player = new Player(new THREE.Color(0x00ff00));
    const startPos = getRandomMazePosition(gameMap);
    console.log('Start Position:', startPos);
    player.location.copy(startPos);
    scene.add(player.gameObject);
    
    // Create zombie manager
    zombieManager = new ZombieManager(scene, gameMap);
    
    // Reset game state
    gameState.escaped = false;
    gameState.startTime = Date.now();
    gameState.escapeTime = 0;
    gameState.transitioning = false;
    
    // Update level display
    updateLevelDisplay();
}

// Transition to the next level
function startNextLevelTransition() {
    if (gameState.currentLevel < gameState.maxLevel) {
        // Start transition to next level
        gameState.transitioning = true;
        gameState.transitionTimer = gameState.transitionDuration;
        
        // Show transition message
        showTransitionMessage(gameState.currentLevel + 1, gameState.transitionTimer);
    } else {
        // Show game complete message
        showGameCompleteMessage();
    }
}

// Show transition message
function showTransitionMessage(nextLevel, seconds) {
    messageElement.innerHTML = `
        <h2>Level ${gameState.currentLevel} Complete!</h2>
        <p>Playing Level ${nextLevel} in ${seconds} seconds...</p>
    `;
    messageElement.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
    messageElement.style.display = 'block';
}

// Update the transition timer
function updateTransition(deltaTime) {
    if (!gameState.transitioning) return;
    
    gameState.transitionTimer -= deltaTime;
    
    // Update transition message with countdown
    const secondsRemaining = Math.ceil(gameState.transitionTimer);
    if (gameState.currentLevel < gameState.maxLevel) {
        showTransitionMessage(gameState.currentLevel + 1, secondsRemaining);
    }
    
    // When timer reaches zero, load next level
    if (gameState.transitionTimer <= 0) {
        gameState.transitioning = false;
        messageElement.style.display = 'none';
        
        if (gameState.currentLevel < gameState.maxLevel) {
            gameState.currentLevel++;
            loadLevel(gameState.currentLevel);
        }
    }
}

// Show game complete message
function showGameCompleteMessage() {
    messageElement.innerHTML = `
        <h2>Congratulations!</h2>
        <p>You've completed all ${gameState.maxLevel} levels!</p>
        <p>Press F5 to play again</p>
    `;
    messageElement.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
    messageElement.style.display = 'block';
    gameState.gameOver = true;
}

// Update level display
function updateLevelDisplay() {
    levelElement.textContent = `Level: ${gameState.currentLevel} / ${gameState.maxLevel}`;
}

// Find a valid starting position in the maze
function getRandomMazePosition(gameMap) {
    const maxAttempts = 100; // Prevent infinite loops
    let attempts = 0;

    const width = gameMap.bounds.max.x - gameMap.bounds.min.x;
    const height = gameMap.bounds.max.z - gameMap.bounds.min.z;
    
    while (attempts < maxAttempts) {
        // Get random grid coordinates within the map bounds
        const x = Math.floor(Math.random() * width);
        const z = Math.floor(Math.random() * height);
        
        // Check if this position is not a wall
        if (!gameMap.isWall(x, z)) {

            console.log('Found valid position:', x, z);
            // Return position with slight offset to center of cell
            return new THREE.Vector3(
                x + 0.5, // Center of the cell X
                20,      // Ground level
                z + 0.5 // Center of the cell Z
            );
        }
        
        attempts++;
    }
    
    // Fallback to a known safe position if we couldn't find a random one
    console.warn('Could not find random position, using fallback position');
    const startNode = gameMap.mapGraph.get(0);
    return gameMap.localize(startNode);
}

// Setup our scene
function init() {
    // Basic scene setup
    scene.background = new THREE.Color(0x333333);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Set up mouse control callback
    controller.setMouseMoveCallback((deltaX, deltaY) => {
        if (cameraMode === 'third-person') {
            cameraAngle -= deltaX;
        }
    });

    // Load the first level
    loadLevel(gameState.currentLevel);

    animate();
}

// Toggle between free camera and third person camera modes
function toggleFreeCamera() {
    if (cameraMode === 'free') {
        // Switch back to previous camera mode
        cameraMode = previousCameraMode;
    } else {
        // Store current mode and switch to free camera
        previousCameraMode = cameraMode;
        cameraMode = 'free';
        
        // Position free camera above player
        freeCameraPosition.set(
            player.location.x,
            FREE_CAMERA_HEIGHT,
            player.location.z
        );
        
        // Target player position
        freeCameraTarget.copy(player.location);
    }
    
    console.log('Camera mode:', cameraMode);
}

// Update camera position based on current mode
function updateCamera(deltaTime) {
    if (cameraMode === 'free') {
        controller.updateFreeCamera(freeCameraPosition, freeCameraTarget, deltaTime);
        camera.position.copy(freeCameraPosition);
        camera.lookAt(freeCameraTarget);
        return;
    }
    
    // Get the player's forward direction
    const forward = player.getForwardDirection();
    
    // Calculate camera position for orbit
    const distance = THIRD_PERSON_DISTANCE;
    const cameraX = player.location.x + Math.sin(cameraAngle) * distance;
    const cameraZ = player.location.z + Math.cos(cameraAngle) * distance;
    
    const targetCameraPosition = new THREE.Vector3(
        cameraX,
        player.location.y + THIRD_PERSON_HEIGHT,
        cameraZ
    );
    
    // Look at player's position slightly above ground
    const lookAtTarget = player.location.clone();
    lookAtTarget.y += 1;
    
    // Smoothly move camera
    camera.position.lerp(targetCameraPosition, Math.min(1.0, deltaTime * 5));
    camera.lookAt(lookAtTarget);
}

// Check if player reached the exit
function checkExitReached() {
    if (gameMap.isAtExit(player.location.x, player.location.z) && !gameState.escaped && !gameState.transitioning) {
        gameState.escaped = true;
        gameState.escapeTime = (Date.now() - gameState.startTime) / 1000; // in seconds
        
        // Display victory message and begin next level transition
        startNextLevelTransition();
    }
}

// Update game status display
function updateStatusDisplay() {
    const elapsedTime = (Date.now() - gameState.startTime) / 1000;
    statusElement.innerHTML = gameState.escaped 
        ? `Escaped in ${gameState.escapeTime.toFixed(2)} seconds!` 
        : `Time: ${elapsedTime.toFixed(1)} seconds`;
    
    // Update mouse control status text
    if (mouseControlStatusElement) {
        mouseControlStatusElement.textContent = `Mouse camera control: ${controller.isMouseControlEnabled() ? 'ON' : 'OFF'} (press M to toggle)`;
    }
}

// Animate loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Handle level transitions
    if (gameState.transitioning) {
        updateTransition(deltaTime);
    }
    
    // Update player using the controller - now using force-based movement
    if (player && controller && !gameState.gameOver && !gameState.transitioning) {
        player.update(deltaTime, { ...gameMap.bounds, gameMap }, controller);
        
        // Update free camera controls if needed
        if (cameraMode === 'free') {
            controller.updateFreeCamera(freeCameraPosition, freeCameraTarget, deltaTime);
        }
        
        // Check for camera mode toggle
        if (controller.toggleCameraMode) {
            toggleFreeCamera();
            controller.toggleCameraMode = false;
        }
        
        // Check if player reached the exit
        checkExitReached();
        
        // Update zombies
        if (zombieManager) {
            zombieManager.update(deltaTime, player.location);
        }
    }
    
    // Update camera
    updateCamera(deltaTime);
    
    // Update status display
    updateStatusDisplay();
    
    // Animate exit wall pulsing effect if it exists
    animateExitWall(deltaTime);
    
    renderer.render(scene, camera);
}

// Animate the exit wall to make it more noticeable
function animateExitWall(deltaTime) {
    if (gameMap && gameMap.gameObject) {
        // Find the exit wall mesh by checking userData
        gameMap.gameObject.traverse((child) => {
            if (child.userData && child.userData.animate && typeof child.userData.animate === 'function') {
                child.userData.animate(deltaTime);
            }
        });
    }
}

init();