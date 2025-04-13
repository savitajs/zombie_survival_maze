import * as THREE from 'three';
import { MathUtil } from '../Util/MathUtil.js';
import { MapGraph } from './MapGraph.js';
import { MapNode } from './MapNode.js';
import { MapRenderer } from './MapRenderer.js';
import { MazeGenerator } from './MazeGenerator.js';

export class GameMap {

  // Constructor for our GameMap class
  constructor(level = 1) {
    // Store the current level
    this.level = level;
    
    // Define maze sizes for different levels
    this.levelConfigs = {
      1: { // Level 1: Small maze
        bounds: new THREE.Box3(
          new THREE.Vector3(-250, 0, -250),
          new THREE.Vector3(250, 0, 250)
        ),
        tileSize: 50,
        zombieCount: 10
      },
      2: { // Level 2: Medium maze
        bounds: new THREE.Box3(
          new THREE.Vector3(-300, 0, -300),
          new THREE.Vector3(300, 0, 300)
        ),
        tileSize: 60,
        zombieCount: 15
      },
      3: { // Level 3: Large maze
        bounds: new THREE.Box3(
          new THREE.Vector3(-350, 0, -350), 
          new THREE.Vector3(350, 0, 350)
        ),
        tileSize: 70,
        zombieCount: 25
      }
    };
    
    // Apply level configuration
    const config = this.levelConfigs[level];
  
    // Initialize bounds based on level
    this.bounds = config.bounds;

    // worldSize is a Vector3 with 
    // the dimensions of our bounds
    this.worldSize = new THREE.Vector3();
    this.bounds.getSize(this.worldSize);

    // Let's define a tile size - increased further for wider routes
    this.tileSize = config.tileSize;

    // Columns and rows of our tile world
    this.cols = Math.floor(this.worldSize.x / this.tileSize);
    this.rows = Math.floor(this.worldSize.z / this.tileSize);

    // Create our graph!
    this.mapGraph = new MapGraph(this.cols, this.rows);
    
    // Generate our maze here!
    this.mazeGenerator = new MazeGenerator(this.mapGraph);
    
    // Adjust braided maze probability based on level (more loops in higher levels)
    const braidProbability = level === 1 ? 0.7 : (level === 2 ? 0.85 : 1.0);
    this.mazeGenerator.braidedMaze(this.mapGraph.get(0), braidProbability);

    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    this.gameObject = this.mapRenderer.createRendering();
  }

  // Method to get from node to world location
  localize(node) {
    let x = this.bounds.min.x + (node.i * this.tileSize) + this.tileSize/2;
    let y = this.tileSize;
    let z = this.bounds.min.z + (node.j * this.tileSize) + this.tileSize/2;
    return new THREE.Vector3(x, y, z);
  }

  // Get the number of zombies for this level
  getZombieCount() {
    return this.levelConfigs[this.level].zombieCount;
  }

  // Method to get from world location to node
  quantize(location) {
    let nodeI = Math.floor((location.x - this.bounds.min.x)/this.tileSize);
    let nodeJ = Math.floor((location.z - this.bounds.min.z)/this.tileSize);

    return this.mapGraph.getAt(nodeI, nodeJ);
  }

  // Check if a position is near a wall
  isWallNearby(position, direction, distance) {
    const node = this.quantize(position);
    if (!node) return true;
    
    // Cast a ray in the given direction to check for walls
    const rayDirection = direction.clone().normalize();
    const rayCaster = new THREE.Raycaster(position, rayDirection, 0, distance);
    
    // Get wall positions around current node
    const walls = this.getWallPositions(node);
    
    // Check if the ray intersects any wall
    for (const wall of walls) {
      const wallBox = new THREE.Box3();
      const halfSize = this.tileSize / 2;
      wallBox.min.set(wall.x - halfSize, 0, wall.z - halfSize);
      wallBox.max.set(wall.x + halfSize, this.mapRenderer.wallHeight, wall.z + halfSize);
      
      // Simple ray-box intersection
      if (this.rayIntersectsBox(position, rayDirection, wallBox, distance)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Get positions of walls around a node
  getWallPositions(node) {
    const walls = [];
    const pos = this.localize(node);
    const half = this.tileSize / 2;
    
    // Check in all four directions
    const directions = [
      { i: -1, j: 0, x: -half, z: 0 },
      { i: 1, j: 0, x: half, z: 0 },
      { i: 0, j: -1, x: 0, z: -half },
      { i: 0, j: 1, x: 0, z: half }
    ];
    
    for (const dir of directions) {
      if (!node.hasEdgeTo(node.i + dir.i, node.j + dir.j)) {
        walls.push(new THREE.Vector3(
          pos.x + dir.x,
          pos.y,
          pos.z + dir.z
        ));
      }
    }
    
    return walls;
  }
  
  // Simple ray-box intersection
  rayIntersectsBox(origin, direction, box, maxDistance) {
    const invDir = new THREE.Vector3(
      1.0 / direction.x,
      1.0 / direction.y,
      1.0 / direction.z
    );
    
    const tMin = new THREE.Vector3(
      (box.min.x - origin.x) * invDir.x,
      (box.min.y - origin.y) * invDir.y,
      (box.min.z - origin.z) * invDir.z
    );
    
    const tMax = new THREE.Vector3(
      (box.max.x - origin.x) * invDir.x,
      (box.max.y - origin.y) * invDir.y,
      (box.max.z - origin.z) * invDir.z
    );
    
    const t1 = new THREE.Vector3(
      Math.min(tMin.x, tMax.x),
      Math.min(tMin.y, tMax.y),
      Math.min(tMin.z, tMax.z)
    );
    
    const t2 = new THREE.Vector3(
      Math.max(tMin.x, tMax.x),
      Math.max(tMin.y, tMax.y),
      Math.max(tMin.z, tMax.z)
    );
    
    const tNear = Math.max(Math.max(t1.x, t1.y), t1.z);
    const tFar = Math.min(Math.min(t2.x, t2.y), t2.z);
    
    return tFar >= tNear && tNear <= maxDistance && tFar >= 0;
  }

  // Check if a world position is valid (not a wall)
  isWall(x, z) {
    // Convert world coordinates to tile coordinates
    const nodeI = Math.floor((x - this.bounds.min.x) / this.tileSize);
    const nodeJ = Math.floor((z - this.bounds.min.z) / this.tileSize);
    
    // Check if out of bounds
    if (nodeI < 0 || nodeI >= this.cols || nodeJ < 0 || nodeJ >= this.rows) {
      return true; // Out of bounds is considered a wall
    }
    
    // Get the node at these coordinates
    const node = this.mapGraph.getAt(nodeI, nodeJ);
    if (!node) return true; // No node means it's a wall
    
    // Position within the current tile
    const localX = ((x - this.bounds.min.x) % this.tileSize + this.tileSize) % this.tileSize;
    const localZ = ((z - this.bounds.min.z) % this.tileSize + this.tileSize) % this.tileSize;
    
    // Wall thickness (as fraction of tile size)
    const wallThickness = this.tileSize * 0.1;
    const thresholdFromWall = wallThickness * 1.1; // Slightly larger to prevent clipping
    
    // Check proximity to cell borders with no adjacent node
    
    // Check west wall (left edge)
    if (localX < thresholdFromWall && !node.hasEdgeTo(nodeI - 1, nodeJ)) {
      return true;
    }
    
    // Check east wall (right edge)
    if (localX > this.tileSize - thresholdFromWall && !node.hasEdgeTo(nodeI + 1, nodeJ)) {
      return true;
    }
    
    // Check north wall (top edge)
    if (localZ < thresholdFromWall && !node.hasEdgeTo(nodeI, nodeJ - 1)) {
      return true;
    }
    
    // Check south wall (bottom edge)
    if (localZ > this.tileSize - thresholdFromWall && !node.hasEdgeTo(nodeI, nodeJ + 1)) {
      return true;
    }
    
    // Not a wall
    return false;
  }

  // Check if a position is at the exit
  isAtExit(x, z) {
    // If we don't have an exit wall defined, return false
    if (!this.exitWall) return false;
    
    // Get the node containing the exit
    const exitNode = this.mapGraph.getAt(this.exitWall.i, this.exitWall.j);
    if (!exitNode) return false;
    
    // Get the position of the exit node
    const exitPos = this.localize(exitNode);
    
    // Calculate distance from the position to the exit
    const dist = Math.sqrt(
      Math.pow(x - exitPos.x, 2) + 
      Math.pow(z - exitPos.z, 2)
    );
    
    // Check if we're close enough to the exit (using a threshold based on tile size)
    const threshold = this.tileSize * 0.6;
    
    // Also check that we're on the correct side of the exit wall
    // For east exit, check if x is greater than exit position x
    let correctSide = false;
    
    if (this.exitWall.side === 'east') {
      correctSide = x > exitPos.x;
    } else if (this.exitWall.side === 'west') {
      correctSide = x < exitPos.x;
    } else if (this.exitWall.side === 'north') {
      correctSide = z < exitPos.z;
    } else if (this.exitWall.side === 'south') {
      correctSide = z > exitPos.z;
    }
    
    return dist < threshold && correctSide;
  }
}