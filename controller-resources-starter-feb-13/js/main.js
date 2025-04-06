import * as THREE from 'three';
import { Player } from './Behaviour/Player.js';
import { Controller } from './Behaviour/Controller.js';
import { GameMap } from './World/GameMap.js';

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

// Animate loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update player using the controller - now using force-based movement
    if (player && controller) {
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
    }
    
    // Update camera
    updateCamera(deltaTime);
    
    renderer.render(scene, camera);
}

init();