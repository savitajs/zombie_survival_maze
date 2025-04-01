import * as THREE from 'three';

export class MathUtil {

  // Get random int in range
  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  
  // Manhattan distance between two vectors
  static manhattanDistance(v1, v2) {
    return Math.abs(v1.x - v2.x) + Math.abs(v1.y - v2.y);
  }
}