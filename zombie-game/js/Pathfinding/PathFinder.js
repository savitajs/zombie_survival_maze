import * as THREE from 'three';
import { MinHeap } from '../Util/MinHeap.js';

export class PathFinder {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.detectionRadius = Infinity; // Changed to Infinity for full map detection
    }

    // Heuristic function for A* - Manhattan distance
    calculateHeuristic(nodeA, nodeB) {
        const posA = this.gameMap.localize(nodeA);
        const posB = this.gameMap.localize(nodeB);
        
        // Manhattan distance
        return Math.abs(posA.x - posB.x) + Math.abs(posA.z - posB.z);
    }

    findPathToTarget(startPos, targetPos) {
        // Convert world positions to nodes
        const startNode = this.gameMap.quantize(startPos);
        const targetNode = this.gameMap.quantize(targetPos);
        
        if (!startNode || !targetNode) return null;

        // Use A* algorithm to find path (modified Dijkstra's with heuristic)
        const gScore = new Map(); // Cost from start to current node
        const fScore = new Map(); // gScore + heuristic (estimated total cost)
        const previousMap = new Map();
        const queue = new MinHeap();

        // Initialize scores
        gScore.set(startNode, 0);
        fScore.set(startNode, this.calculateHeuristic(startNode, targetNode));
        
        // Add start node to queue with priority based on fScore
        queue.enqueue(startNode, fScore.get(startNode));

        while (!queue.isEmpty()) {
            const current = queue.dequeue();
            
            // If we reached the target, reconstruct path
            if (current === targetNode) {
                return this.reconstructPath(previousMap, startNode, targetNode);
            }

            const currentGScore = gScore.get(current);

            // Check all neighbors
            for (const edge of current.edges) {
                const neighbor = edge.node;
                const tentativeGScore = currentGScore + edge.cost;

                // If this path is better than any previous path to this neighbor
                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                    // Update the best path
                    previousMap.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    
                    // Calculate fScore = gScore + heuristic
                    const heuristicCost = this.calculateHeuristic(neighbor, targetNode);
                    fScore.set(neighbor, tentativeGScore + heuristicCost);
                    
                    // Add to queue if not already there
                    if (!queue.contains(neighbor)) {
                        queue.enqueue(neighbor, fScore.get(neighbor));
                    } else {
                        // Update priority with new fScore
                        queue.updatePriority(neighbor, fScore.get(neighbor));
                    }
                }
            }
        }

        // No path found
        return null;
    }

    reconstructPath(previousMap, startNode, targetNode) {
        const path = [];
        let current = targetNode;

        while (current !== startNode) {
            path.unshift(this.gameMap.localize(current));
            current = previousMap.get(current);
            if (!current) break;
        }

        return path;
    }

    canDetectTarget(zombiePos, targetPos) {
        // Check if target is within detection radius
        return zombiePos.distanceTo(targetPos) <= this.detectionRadius;
    }
}
