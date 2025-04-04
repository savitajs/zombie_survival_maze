import * as THREE from 'three';
// Remove OrbitControls import
import { Player } from './Behaviour/Player.js';
import { Controller } from './Behaviour/Controller.js';
import { GameMap } from './World/GameMap.js';

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
// Remove OrbitControls initialization

// Create clock
const clock = new THREE.Clock();

// Create controller
const controller = new Controller(document, camera);

// Declare our GameMap and Player
let gameMap;
let player;

// Update camera control variables
let cameraAngle = 0;
let cameraHeight = 8;  // Lower height for better player view
let cameraDistance = 15; // Closer to player
let isDragging = false;

// Prevent context menu on right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Add resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getRandomMazePosition(gameMap) {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random coordinates within the maze bounds
        const x = Math.floor(Math.random() * gameMap.cols);
        const z = Math.floor(Math.random() * gameMap.rows);
        
        // Check if this position is a valid path (not a wall)
        if (!gameMap.isWall(x, z)) {
            // Convert maze coordinates to world coordinates
            const worldX = gameMap.bounds.min.x + (x * gameMap.tileSize) + gameMap.tileSize/2;
            const worldZ = gameMap.bounds.min.z + (z * gameMap.tileSize) + gameMap.tileSize/2;
            
            console.log("Spawning player at maze position:", x, z);
            return new THREE.Vector3(worldX, 10, worldZ);
        }
    }
    
    // Fallback to a safe position if no valid random position found
    console.warn("Could not find random position, using fallback position");
    return new THREE.Vector3(gameMap.tileSize * 1.5, 1, gameMap.tileSize * 1.5);
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

  // Set up camera
  // Adjust initial camera position to be closer
  camera.position.set(
    startPos.x, 
    10,  // Lower height
    startPos.z + 15 // Slightly behind player
  );
  camera.lookAt(startPos);


  console.log("Player start position:", startPos);
  console.log("Player location after copy:", player.location);
  console.log("Player gameObject position:", player.gameObject.position);
  

  animate();
}

// animate loop
function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  player.update(deltaTime, gameMap.bounds, controller);
  
  // Update camera based on controller mouse movement
  if (controller.isMouseDown) {
    cameraAngle += controller.mouseDelta.x * 0.01;
    cameraHeight = Math.max(5, Math.min(30, cameraHeight - controller.mouseDelta.y * 0.1));
  }
  
  // Calculate camera position
  const targetCameraPos = new THREE.Vector3(
    player.location.x + Math.sin(cameraAngle) * cameraDistance,
    player.location.y + cameraHeight,
    player.location.z + Math.cos(cameraAngle) * cameraDistance
  );
  
  camera.position.lerp(targetCameraPos, 0.1);
  camera.lookAt(player.location);
  
  renderer.render(scene, camera);
}

init();