import * as THREE from 'three';
import { Player } from './Behaviour/Player.js';
import { Controller } from './Behaviour/Controller.js';
import { GameMap } from './World/GameMap.js';
import { ZombieManager } from './Entities/ZombieManager.js';

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

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
  escaped: false,
  gameOver: false,
  startTime: 0,
  escapeTime: 0
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

// Mouse control status element
const mouseControlStatusElement = document.createElement('div');
mouseControlStatusElement.style.position = 'absolute';
mouseControlStatusElement.style.top = '50px';
mouseControlStatusElement.style.left = '20px';
mouseControlStatusElement.style.color = 'white';
mouseControlStatusElement.style.fontSize = '14px';
mouseControlStatusElement.style.fontFamily = 'Arial, sans-serif';
mouseControlStatusElement.style.padding = '5px';
mouseControlStatusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
mouseControlStatusElement.style.borderRadius = '5px';
mouseControlStatusElement.textContent = 'Mouse camera control: ON (press M to toggle)';
document.body.appendChild(mouseControlStatusElement);

// Victory message
const victoryElement = document.createElement('div');
victoryElement.style.position = 'absolute';
victoryElement.style.top = '50%';
victoryElement.style.left = '50%';
victoryElement.style.transform = 'translate(-50%, -50%)';
victoryElement.style.color = 'white';
victoryElement.style.fontSize = '36px';
victoryElement.style.fontFamily = 'Arial, sans-serif';
victoryElement.style.textAlign = 'center';
victoryElement.style.padding = '20px';
victoryElement.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
victoryElement.style.borderRadius = '10px';
victoryElement.style.display = 'none';
document.body.appendChild(victoryElement);

// Prevent context menu on right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Add resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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

        console.log('Invalid position:', x, z);
        
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

    // Create map
    gameMap = new GameMap();
    scene.add(gameMap.gameObject);

    // Create player
    player = new Player(new THREE.Color(0x00ff00));
    const startPos = getRandomMazePosition(gameMap);
    console.log('Start Position:', startPos);
    player.location.copy(startPos);
    scene.add(player.gameObject);

    // Basic lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(0, 10, 0);
    scene.add(directional);

    // Set up initial camera position behind player
    updateCamera(0);

    // Set up mouse control callback
    controller.setMouseMoveCallback((deltaX, deltaY) => {
        if (cameraMode === 'third-person') {
            cameraAngle -= deltaX;
        }
    });

    // Add zombie manager
    zombieManager = new ZombieManager(scene, gameMap);
    
    // Record game start time
    gameState.startTime = Date.now();

    animate();
}

// Check if camera would hit a wall in the given direction
function wouldHitWall(direction, distance) {
    return gameMap.isWallNearby(player.location, direction, distance);
}

// Toggle free camera mode
function toggleFreeCamera() {
    if (cameraMode !== 'free') {
        // Store the current camera mode before switching to free mode
        previousCameraMode = cameraMode;
        cameraMode = 'free';
        
        // Set up free camera initial position
        freeCameraPosition.set(
            player.location.x, 
            FREE_CAMERA_HEIGHT,
            player.location.z
        );
        freeCameraTarget.copy(player.location);
    } else {
        // Return to previous camera mode
        cameraMode = previousCameraMode;
    }
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

// Update zombies
function updateZombies(deltaTime) {
    if (zombieManager && !gameState.gameOver) {
        zombieManager.update(deltaTime, player.location);
    }
}

// Check if player reached the exit
function checkExitReached() {
    if (gameMap.isAtExit(player.location.x, player.location.z) && !gameState.escaped) {
        gameState.escaped = true;
        gameState.escapeTime = (Date.now() - gameState.startTime) / 1000; // in seconds
        showVictoryMessage();
    }
}

// Show victory message
function showVictoryMessage() {
    victoryElement.innerHTML = `
        <h2>Escaped!</h2>
        <p>You escaped the maze in ${gameState.escapeTime.toFixed(2)} seconds!</p>
        <p>Press F5 to play again</p>
    `;
    victoryElement.style.display = 'block';
    
    // Optionally slow down time or pause the game
    player.velocity.multiplyScalar(0);
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
    
    // Update player using the controller - now using force-based movement
    if (player && controller && !gameState.gameOver) {
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
    }
    
    // Update zombies
    updateZombies(deltaTime);
    
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