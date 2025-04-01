import { MapNode } from './MapNode.js';
import { MapGraph } from './MapGraph.js';

import { MathUtil } from '../Util/MathUtil.js'
import { Rect } from '../Util/Rect.js';

import { Partition } from './Partition.js';


// Dungeon Generator class
export class DungeonGenerator {

  // Dungeon generator constructor
  constructor(graph, minRoomSize) {
    this.graph = graph;
    this.minRoomSize = minRoomSize;
    // This looks decent
    this.minPartitionSize = minRoomSize * 2;
  }

  // Main generate method
  generate() {
    let root = new Partition(0, 0, this.graph.cols, this.graph.rows);
    root.split(this.minPartitionSize);

    // These are the partitions with no children
    let partitions = root.getLeaves();
    let rooms = this.createRooms(partitions);

    // Create connections (MST)
    let connections = this.createConnections(rooms);

    // Iterate over all of the connections
    // Creating a corridor between them
    for (let con of connections) {
      this.carveCorridor(con.from, con.to);
    }

    // Lastly, connect up our graph
    this.graph.createEdges();

  }

  // Create rooms
  createRooms(partitions) {

    // Initialize an empty array of rooms
    let rooms = [];

    // For each partition, centerate a random room that fits
    for (let part of partitions) {

      let roomWidth = MathUtil.getRandomInt(this.minRoomSize, part.rect.w - 2);
      let roomHeight = MathUtil.getRandomInt(this.minRoomSize, part.rect.h - 2);

      let roomX = MathUtil.getRandomInt(part.rect.x + 1, part.rect.x + part.rect.w - roomWidth - 1);
      let roomY = MathUtil.getRandomInt(part.rect.y + 1, part.rect.y + part.rect.h - roomHeight - 1);

      // Push our room to our list of rooms
      rooms.push(new Rect(roomX, roomY, roomWidth, roomHeight));

      // Set the tiles in each room to be groud or traversable
      for (let i = roomX; i < roomX + roomWidth; i++) {
        for (let j = roomY; j < roomY + roomHeight; j++) {
          let node = this.graph.getAt(i, j);
          node.type = MapNode.Type.Ground;
        }
      }
    }
    return rooms;
  }

  // Create connections between our rooms
  // Finding the MST (minimum spanning tree)
  createConnections(rooms) {

    // Create an array of connections
    // Which will hold a rooms to and from
    let connections = [];

    // Keep track of whats connected
    let connected = new Set();
    connected.add(rooms[0]);

    // Keep track of whats remaining
    let remaining = new Set();
    for (let r of rooms) {
      if (r !== rooms[0]) {
        remaining.add(r);
      }  
    }

    // While remaining is not empty
    while (remaining.size > 0) {
      let best = Infinity;
      let from = null;
      let to = null;

      // For all of the connected rooms,
      // Look for the shortest distance to a remaining room
      for (let r1 of connected) {
        for (let r2 of remaining) {
          let dist = MathUtil.manhattanDistance(r1.getCenter(), r2.getCenter());
          
          if (dist < best) {
            best = dist;
            from = r1;
            to = r2;
          }  
        }
      } 
      // Add our shortest connection TO to connected
      connected.add(to);
      // Remove it from remaining
      remaining.delete(to);
      // Push to our list of connections
      connections.push({from: from, to: to});
    }
    return connections;
  }

  // Carve corridor between room a and room b
  // via their centers
  carveCorridor(a, b) {
    let centerA = a.getCenter();
    let centerB = b.getCenter();

    if (Math.random() < 0.5) {
      // Horizontal, then vertical
      this.carveHorizontal(centerA.x, centerB.x, centerA.y);
      this.carveVertical(centerA.y, centerB.y, centerB.x);  
    } else {
      // Vertical, then horizontal
      this.carveVertical(centerA.y, centerB.y, centerA.x);
      this.carveHorizontal(centerA.x, centerB.x, centerB.y);
    }
 
  }

  // Carve a horizontal path
  carveHorizontal(x1, x2, y) {
    let start = Math.min(x1, x2);
    let end = Math.max(x1, x2);
    
    // Iterate from start to end of the corridor
    for (let x = start; x <= end; x++) {
      let node = this.graph.getAt(x, y);
      node.type = MapNode.Type.Ground;
    }
  }

  // Carve a vertical path
  carveVertical(y1, y2, x) {
    let start = Math.min(y1, y2);
    let end = Math.max(y1, y2);

    // Iterate from start to end of the corridor
    for (let y = start; y <= end; y++) {
      let node = this.graph.getAt(x, y);
      node.type = MapNode.Type.Ground;
    }
  }
}













