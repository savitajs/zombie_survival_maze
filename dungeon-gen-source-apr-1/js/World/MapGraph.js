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

    // Create nodes and edges
    this.createNodes();
    this.createEdges();
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

        let type = MapNode.Type.Obstacle;

        let node = new MapNode(this.length(), i, j, type);
        this.nodes.push(node);

      }
    }
  }
  
  // Create tile-based edges
  createEdges() {
    
    // Loop over all rows and columns
    // to create all of our edges
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {

        // The index of our current node
        let index = j * this.cols + i
        let current = this.nodes[index];

        // Check if the current node is traversable
        if (current.isTraversable()) {

          if (i > 0) {
          	let west = this.nodes[index - 1];
          	current.tryAddEdge(west, 1);
          }

          if (i < this.cols - 1) {
          	let east = this.nodes[index + 1];
          	current.tryAddEdge(east, 1);
          }

          if (j > 0) {
            let north = this.nodes[index - this.cols];
            current.tryAddEdge(north, 1);
          }

          if (j < this.rows - 1) {
            let south = this.nodes[index + this.cols];
            current.tryAddEdge(south, 1);
          }
        }
      }
    }
  }

  
}