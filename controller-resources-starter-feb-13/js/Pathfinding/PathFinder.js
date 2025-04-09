import * as THREE from 'three';
import { MinHeap } from '../Util/MinHeap.js';

export class PathFinder {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.detectionRadius = Infinity; // Changed to Infinity for full map detection
    }

    findPathToTarget(startPos, targetPos) {
        // Convert world positions to nodes
        const startNode = this.gameMap.quantize(startPos);
        const targetNode = this.gameMap.quantize(targetPos);
        
        if (!startNode || !targetNode) return null;

        // Use Dijkstra's algorithm to find path
        const costMap = new Map();
        const previousMap = new Map();
        const queue = new MinHeap();

        costMap.set(startNode, 0);
        queue.enqueue(startNode, 0);

        while (!queue.isEmpty()) {
            const current = queue.dequeue();
            
            if (current === targetNode) {
                return this.reconstructPath(previousMap, startNode, targetNode);
            }

            const currentCost = costMap.get(current);

            for (const edge of current.edges) {
                const neighbor = edge.node;
                const newCost = currentCost + edge.cost;

                if (!costMap.has(neighbor) || newCost < costMap.get(neighbor)) {
                    costMap.set(neighbor, newCost);
                    previousMap.set(neighbor, current);
                    queue.enqueue(neighbor, newCost);
                }
            }
        }

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
