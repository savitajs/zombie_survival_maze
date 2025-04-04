import * as THREE from 'three';
import { MathUtil } from '../Util/MathUtil.js';
import { MapGraph } from './MapGraph.js';
import { MapNode } from './MapNode.js';
import { MapRenderer } from './MapRenderer.js';
import { MazeGenerator } from './MazeGenerator.js';


export class GameMap {

  // Constructor for our GameMap class
  constructor() {
  
    // Restore original tile size
    this.tileSize = 10;

    // Restore original bounds
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-100, 0, -100),
      new THREE.Vector3(100, 0, 100)
    );

    // worldSize is a Vector3 with 
    // the dimensions of our bounds
    this.worldSize = new THREE.Vector3();
    this.bounds.getSize(this.worldSize);

    // Calculate columns and rows based on original size
    this.cols = Math.floor(this.worldSize.x / this.tileSize);
    this.rows = Math.floor(this.worldSize.z / this.tileSize);

    // Create graph with proper dimensions
    this.mapGraph = new MapGraph(this.cols, this.rows);
    
    
    // Generate our maze here!
    this.mazeGenerator = new MazeGenerator(this.mapGraph);
    // this.mazeGenerator.dfsMaze(this.mapGraph.get(0));
    this.mazeGenerator.braidedMaze(this.mapGraph.get(0), 1);


    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    this.gameObject = this.mapRenderer.createRendering();

    console.log("MapGraph dimensions:", this.mapGraph.width, this.mapGraph.height);

  }

  

  // Method to get from node to world location
  localize(node) {
    let x = this.bounds.min.x + (node.i * this.tileSize) + this.tileSize/2;
    let y = this.tileSize;
    let z = this.bounds.min.z + (node.j * this.tileSize) + this.tileSize/2;
    return new THREE.Vector3(x, y, z);
  }

  // Method to get from world location to node
  quantize(location) {
    let nodeI = Math.floor((location.x - this.bounds.min.x)/this.tileSize);
    let nodeJ = Math.floor((location.z - this.bounds.min.z)/this.tileSize);

    return this.mapGraph.getAt(nodeI, nodeJ);
  }

  isWall(x, z) {
    if (x < 0 || x >= this.mapGraph.width || z < 0 || z >= this.mapGraph.height) {
        return true;
    }
    return this.mapGraph.getAt(x, z) === 0; // Assuming 0 represents walls
  }

}