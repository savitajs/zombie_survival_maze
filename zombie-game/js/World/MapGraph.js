import * as THREE from 'three';
import { MapNode } from './MapNode.js';


export class MapGraph {
  
  // Constructor for our MapGraph class
  constructor(cols, rows) {

    // node array for our Graph class
    this.nodes = [];

    // Columns and rows
    // as instance variables
    this.cols = cols;
    this.rows = rows;

    // Create nodes
    this.createNodes();
  
  }

  // Get a node at a particular index
  get(index) {
    return this.nodes[index];
  }

  // Get a node at i and j indices
  getAt(i, j) {
    return this.get(j * this.cols + i);
  }

  // The number of nodes in our graph
  length() {
    return this.nodes.length;
  }


  // Create tile-based nodes
  createNodes() {
    // Loop over all rows and columns
    // to create all of our nodes
    // and add them to our node array
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {

        let type = MapNode.Type.Ground;

        let node = new MapNode(this.length(), i, j, type);
        this.nodes.push(node);

      }
    }
  }

}