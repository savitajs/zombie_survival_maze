import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MapNode } from './MapNode.js';

export class MapRenderer {


  // MapRenderer constructor
  constructor(gameMap) {
    this.gameMap = gameMap;

    this.groundColor = new THREE.Color(0xDDDDDD);
    this.obstacleColor = new THREE.Color(0x555555);
   
  }


  // To create the actual game object
  // associated with our GameMap
  createRendering() {

    let groundMaterial = new THREE.MeshStandardMaterial({ color: this.groundColor, flatShading: true });
    let obstacleMaterial = new THREE.MeshStandardMaterial({ color: this.obstacleColor, flatShading: true });
  
    // Group nodes by type
    let nodes = this.gameMap.mapGraph.nodes;
    let groundNodes = nodes.filter(n => n.type === MapNode.Type.Ground);
    let obstacleNodes = nodes.filter(n => n.type === MapNode.Type.Obstacle);

    // Create shared box geometry
    let tileGeometry = new THREE.BoxGeometry(
      this.gameMap.tileSize, 
      this.gameMap.tileSize, 
      this.gameMap.tileSize
      );

    // Create instanced meshes
    let groundMesh = new THREE.InstancedMesh(tileGeometry, groundMaterial, groundNodes.length);
    let obstacleMesh = new THREE.InstancedMesh(tileGeometry, obstacleMaterial, obstacleNodes.length);
   
    // Create mesh transforms per type
    this.setMeshTransforms(groundMesh, groundNodes);
    this.setMeshTransforms(obstacleMesh, obstacleNodes);
  
    // Group everything
    let gameObject = new THREE.Group();
    gameObject.add(groundMesh, obstacleMesh);
    return gameObject;
   
  }

  // Set mesh transforms
  setMeshTransforms(mesh, nodeList) {
    let half = this.gameMap.tileSize / 2;
    let minX = this.gameMap.bounds.min.x;
    let minZ = this.gameMap.bounds.min.z;
    let tileSize = this.gameMap.tileSize;

    // Iterate over nodes
    for (let i = 0; i < nodeList.length; i++) {
      let node = nodeList[i];

      let elevation = 0;
      if (node.type === MapNode.Type.Obstacle) {
        elevation = 2;
      }

      // Get translation
      let x = minX + node.i * tileSize + half;
      let y = elevation/2;
      let z = minZ + node.j * tileSize + half;

      // Create matrix to translate and scale
      let translation = new THREE.Matrix4().makeTranslation(x, y, z);
      let scale = new THREE.Matrix4().makeScale(1, elevation, 1);
      let matrix = translation.multiply(scale);

      mesh.setMatrixAt(i, matrix);
    }
  }

}

