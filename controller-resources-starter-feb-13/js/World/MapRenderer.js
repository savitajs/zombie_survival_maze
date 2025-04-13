import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MapNode } from './MapNode.js';
import { MathUtil } from '../Util/MathUtil.js';

export class MapRenderer {

  // MapRenderer constructor
  constructor(gameMap) {
    this.gameMap = gameMap;

    // Wall dimensions based on tile size - adjusted for proportions
    this.wallDepth = this.gameMap.tileSize * 0.1;
    this.wallWidth = this.gameMap.tileSize + this.wallDepth;
    this.wallHeight = this.gameMap.tileSize; // Slightly lower walls for better visibility
    
    // Randomly select a wall boundary and position for the exit
    this.selectRandomExitWall();
    
    // Load textures
    this.textures = {
      wall: new THREE.TextureLoader().load('./public/textures/Rust005_2K-JPG_Color.jpg'),
      wallNormal: new THREE.TextureLoader().load('./public/textures/Rust005_2K-JPG_Displacement.jpg'),
      floor: new THREE.TextureLoader().load('./public/textures/Rust005_2K-JPG_Displacement.jpg'),
      exitWall: new THREE.TextureLoader().load('./public/textures/Rust005_2K-JPG_Displacement.jpg')
    };
    
    // Configure texture repeats based on tile size
    Object.values(this.textures).forEach(texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
    });
    
    // Set floor texture to repeat more based on world size
    const repeatX = Math.ceil(this.gameMap.worldSize.x / (this.gameMap.tileSize * 2));
    const repeatZ = Math.ceil(this.gameMap.worldSize.z / (this.gameMap.tileSize * 2));
    this.textures.floor.repeat.set(repeatX, repeatZ);
  }
  
  // Method to randomly select an exit wall position
  selectRandomExitWall() {
    // Choose a random boundary: 0=North, 1=East, 2=South, 3=West
    const sides = ['north', 'east', 'south', 'west'];
    let validExitFound = false;
    let attempts = 0;
    let exitWallPosition;
    
    // Try to find a valid exit wall with parallel adjacent walls
    while (!validExitFound && attempts < 50) {
      attempts++;
      
      // Pick a random side
      const sideIndex = Math.floor(Math.random() * 4);
      const side = sides[sideIndex];
      
      // Generate a random position on that side
      let i, j;
      switch(side) {
        case 'north':
          i = Math.floor(Math.random() * (this.gameMap.cols - 2)) + 1; // Avoid corners
          j = 0;
          break;
        case 'east':
          i = this.gameMap.cols - 1;
          j = Math.floor(Math.random() * (this.gameMap.rows - 2)) + 1; // Avoid corners
          break;
        case 'south':
          i = Math.floor(Math.random() * (this.gameMap.cols - 2)) + 1; // Avoid corners
          j = this.gameMap.rows - 1;
          break;
        case 'west':
          i = 0;
          j = Math.floor(Math.random() * (this.gameMap.rows - 2)) + 1; // Avoid corners
          break;
      }
      
      // Check if this position has parallel adjacent walls
      const node = this.gameMap.mapGraph.getAt(i, j);
      if (!node) continue;
      
      // For each side, check if adjacent cells have walls facing the same direction
      let hasParallelWalls = false;
      
      if (side === 'north' || side === 'south') {
        // For north/south exits, check east and west neighbors for parallel walls
        const leftNode = this.gameMap.mapGraph.getAt(i-1, j);
        const rightNode = this.gameMap.mapGraph.getAt(i+1, j);
        
        // Check if both adjacent nodes exist and also have north/south exterior walls
        if (leftNode && rightNode) {
          if (side === 'north') {
            hasParallelWalls = !leftNode.hasEdgeTo(i-1, j-1) && !rightNode.hasEdgeTo(i+1, j-1);
          } else { // south
            hasParallelWalls = !leftNode.hasEdgeTo(i-1, j+1) && !rightNode.hasEdgeTo(i+1, j+1);
          }
        }
      } else { // east or west
        // For east/west exits, check north and south neighbors for parallel walls
        const topNode = this.gameMap.mapGraph.getAt(i, j-1);
        const bottomNode = this.gameMap.mapGraph.getAt(i, j+1);
        
        // Check if both adjacent nodes exist and also have east/west exterior walls
        if (topNode && bottomNode) {
          if (side === 'east') {
            hasParallelWalls = !topNode.hasEdgeTo(i+1, j-1) && !bottomNode.hasEdgeTo(i+1, j+1);
          } else { // west
            hasParallelWalls = !topNode.hasEdgeTo(i-1, j-1) && !bottomNode.hasEdgeTo(i-1, j+1);
          }
        }
      }
      
      // If we have parallel walls, we've found a good exit position
      if (hasParallelWalls) {
        exitWallPosition = { i, j, side };
        validExitFound = true;
      }
    }
    
    // If we couldn't find a perfect location, fall back to a simple position
    if (!validExitFound) {
      console.warn("Couldn't find ideal exit position with parallel walls after", attempts, "attempts. Using fallback position.");
      
      // Pick a random side and a position not at the corner
      const sideIndex = Math.floor(Math.random() * 4);
      const side = sides[sideIndex];
      
      let i, j;
      switch(side) {
        case 'north':
          i = Math.floor(this.gameMap.cols / 2);
          j = 0;
          break;
        case 'east':
          i = this.gameMap.cols - 1;
          j = Math.floor(this.gameMap.rows / 2);
          break;
        case 'south':
          i = Math.floor(this.gameMap.cols / 2);
          j = this.gameMap.rows - 1;
          break;
        case 'west':
          i = 0;
          j = Math.floor(this.gameMap.rows / 2);
          break;
      }
      
      exitWallPosition = { i, j, side };
    }
    
    this.exitWallPosition = exitWallPosition;
    console.log(`Exit wall selected: ${exitWallPosition.side} side at (${exitWallPosition.i}, ${exitWallPosition.j})`);
  }
 
  // To create the actual game object
  // associated with our GameMap
  createRendering() {
    // Create material and geometry for the ground
    let groundMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.floor,
      roughness: 0.8,
      metalness: 0.2,
      color: 0xcccccc, // Slight tint to make the texture look worn
      envMapIntensity: 0.5 // Less reflective for worn look
    });
    
    let groundGeometry = new THREE.BoxGeometry(
      this.gameMap.worldSize.x, 
      this.gameMap.tileSize, 
      this.gameMap.worldSize.z
    );  

    // Create the mesh for the ground
    let ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true; // Add shadow receiving to ground

    // Prepare material for the walls and exit
    let wallMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.wall,
      normalMap: this.textures.wallNormal, // Add normal map for more detail
      color: 0xf0f0f0,  // Slightly off-white for science facility walls
      roughness: 0.7,
      metalness: 0.3,
      bumpScale: 0.1 // Subtle bump effect
    });
    
    let exitMaterial = new THREE.MeshStandardMaterial({ 
      map: this.textures.exitWall,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5, // Increased intensity for better visibility
      transparent: true,      // Make slightly transparent 
      opacity: 0.9            // Slight transparency helps distinguish it
    });
    
    // Separate geometries for regular walls and exit wall
    let wallGeometries = [];
    let exitWallGeometries = [];

    // Loop through all nodes in the map graph to build their walls
    for (let node of this.gameMap.mapGraph.nodes) {
      // Get walls for this node
      const walls = this.buildWalls(node);
      
      // Check if this node contains the exit wall
      if (node.i === this.exitWallPosition.i && node.j === this.exitWallPosition.j) {
        // For the exit node, check each wall and determine if it's an exterior wall
        for (let wall of walls) {
          // Determine if this wall is on the correct exit side
          let isExitWall = false;
          
          if ((this.exitWallPosition.side === 'east' && node.i === this.gameMap.cols - 1 && !node.hasEdgeTo(node.i + 1, node.j)) ||
              (this.exitWallPosition.side === 'west' && node.i === 0 && !node.hasEdgeTo(node.i - 1, node.j)) ||
              (this.exitWallPosition.side === 'north' && node.j === 0 && !node.hasEdgeTo(node.i, node.j - 1)) ||
              (this.exitWallPosition.side === 'south' && node.j === this.gameMap.rows - 1 && !node.hasEdgeTo(node.i, node.j + 1))) {
            isExitWall = true;
          }
          
          if (isExitWall) {
            // This is our exit wall, add it to the exit geometries
            exitWallGeometries.push(wall);
            
            // Store exit info in the game map for collision detection
            this.gameMap.exitWall = {
              i: node.i,
              j: node.j,
              side: this.exitWallPosition.side
            };
          } else {
            // Regular wall
            wallGeometries.push(wall);
          }
        }
      } else {
        // Regular node, add all walls to wall geometries
        for (let wall of walls) {
          wallGeometries.push(wall);
        }
      }
    }

    // Merge regular wall geometries and create mesh
    let mergedWalls = BufferGeometryUtils.mergeGeometries(wallGeometries);
    let walls = new THREE.Mesh(mergedWalls, wallMaterial);
    walls.castShadow = true;
    walls.receiveShadow = true;
    
    // Create exit wall if we found one
    let exitWall = null;
    if (exitWallGeometries.length > 0) {
      let mergedExitWalls = BufferGeometryUtils.mergeGeometries(exitWallGeometries);
      exitWall = new THREE.Mesh(mergedExitWalls, exitMaterial);
      exitWall.castShadow = true;
      exitWall.receiveShadow = true;
      
      // Add a flashing animation effect to make the exit more visible
      this.setupExitWallAnimation(exitWall);
    } else {
      console.error("Failed to create exit wall, retrying with a different position");
      // If for some reason we didn't get an exit wall, try a different position
      this.selectRandomExitWall();
      return this.createRendering();
    }

    // Create a container for the full map
    let gameObject = new THREE.Group();

    // Add ground, walls, and exit wall to the game object
    gameObject.add(ground, walls);
    if (exitWall) {
      gameObject.add(exitWall);
    }
 
    return gameObject;
  }
  
  // Add a pulsing animation to make the exit wall more noticeable
  setupExitWallAnimation(exitWall) {
    // This will be called in the main animation loop
    exitWall.userData.animate = (deltaTime) => {
      const time = performance.now() * 0.001; // Convert to seconds
      // Pulse the emissive intensity
      exitWall.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.2;
    };
  }

  // Helper method to create and return a single wall geometry
  buildWall(x, y, z, rotation) {
    let wall = new THREE.BoxGeometry(this.wallWidth, this.wallHeight, this.wallDepth);
    
    // Rotate the wall to face the correct direction
    wall.rotateY(rotation); 

    // Move the wall to the correct position
    wall.translate(x, y, z);
    return wall; 
  }

  // Build walls by node
  buildWalls(node) {
    
    let walls = []

    // Declare half here for clarity
    let half = this.gameMap.tileSize/2;

    // Get position of the center of our node
    let pos = this.gameMap.localize(node);

    // Raise the wall to be centered vertically
    pos.y = this.wallHeight/2 + half;

    // If there is no edge to i-1, j
    // Build a wall at:
    // x - half tileSize, z
    // Rotate our wall PI/2
    if (!node.hasEdgeTo(node.i-1, node.j)) {
      let w = this.buildWall(pos.x - half, pos.y, pos.z, Math.PI/2);
      walls.push(w);
    }

    // If there is no edge to i+1, j
    // Build a wall at:
    // x + half tileSize, z
    // Rotate our wall PI/2
    if (!node.hasEdgeTo(node.i+1, node.j)) {
      let w = this.buildWall(pos.x + half, pos.y, pos.z, Math.PI/2);
      walls.push(w);
    }

    // If there is no edge to i, j-1
    // Build a wall at:
    // x, z - half tileSize
    // Rotate our wall PI/2
    if (!node.hasEdgeTo(node.i, node.j-1)) {
      let w = this.buildWall(pos.x, pos.y, pos.z - half, 0);
      walls.push(w);
    }
    
    // If there is no edge to i1, j+1
    // Build a wall at:
    // x, z + half tileSize
    // Rotate our wall PI/2
    if (!node.hasEdgeTo(node.i, node.j+1)) {
      let w = this.buildWall(pos.x, pos.y, pos.z + half, 0);
      walls.push(w);
    }
    
    // return the walls around this node
    return walls;
  }
}