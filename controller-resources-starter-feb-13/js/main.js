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
    // Start with a known safe position - the first node in the graph
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
        // Free camera handling - unchanged
        camera.position.copy(freeCameraPosition);
        camera.lookAt(freeCameraTarget);
        return;
    }
    
    // Get the player's forward direction (direction where the pointy part is facing)
    const forward = player.getForwardDirection();
    
    // In our third person mode, position the camera behind the player and look ahead facing:
    // Position camera a set distance behind the player (using negative forward) and a fixed height offset
    const targetCameraPosition = player.location.clone()
        .add(new THREE.Vector3(0, THIRD_PERSON_HEIGHT, 0))
        .add(forward.clone().negate().multiplyScalar(THIRD_PERSON_DISTANCE));
        
    // Set the lookAt target to be in front of the player – so the camera faces the same direction of movement
    const cameraLookAt = player.location.clone().add(forward.clone().multiplyScalar(10));
    
    // Smoothly lerp to these positions
    camera.position.lerp(targetCameraPosition, Math.min(1.0, deltaTime * 12));
    const tempLookAt = new THREE.Vector3().lerp(cameraLookAt, Math.min(1.0, deltaTime * 12));
    camera.lookAt(tempLookAt);
}

// Animate loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update player using the controller - now using force-based movement
    if (player && controller) {
        player.update(deltaTime, gameMap.bounds, controller);
        
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