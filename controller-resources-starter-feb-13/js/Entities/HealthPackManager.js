import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HealthPack } from './HealthPack.js';

export class HealthPackManager {
    constructor(scene, gameMap) {
        if (!scene || !gameMap) {
            console.error('HealthPackManager: scene or gameMap is undefined');
            return;
        }
        this.scene = scene;
        this.gameMap = gameMap;
        this.healthPacks = [];
        this.spawnHealthPacks(3); // Spawn 3 health packs
    }

    spawnHealthPacks(count) {
        console.log(`Spawning ${count} health packs`);

        for (let i = 0; i < count; i++) {
            const position = this.getValidSpawnPosition();
            if (!position) continue;

            const healthPack = new HealthPack(
                this.scene,
                position,
                i + 1
            );
            this.healthPacks.push(healthPack);
        }
    }

    getValidSpawnPosition() {
        if (!this.gameMap || !this.gameMap.mapGraph) {
            console.error('Invalid gameMap or mapGraph');
            return null;
        }

        const validNodes = this.gameMap.mapGraph.nodes.filter(node => 
            !this.gameMap.isWall(
                this.gameMap.localize(node).x,
                this.gameMap.localize(node).z
            )
        );
        
        if (validNodes.length === 0) return null;
        
        const randomNode = validNodes[Math.floor(Math.random() * validNodes.length)];
        const worldPos = this.gameMap.localize(randomNode);
        worldPos.y = 20; // Adjust height as needed
        
        return worldPos;
    }

    update(playerPosition, playerHealth, maxHealth) {
        const PICKUP_RADIUS = 3;

        for (const pack of this.healthPacks) {
            if (!pack.used) {
                const distance = pack.position.distanceTo(playerPosition);
                if (distance < PICKUP_RADIUS && playerHealth < maxHealth) {
                    return pack.collect();
                }
            }
        }
        return false;
    }

    cleanup() {
        this.healthPacks.forEach(pack => pack.cleanup());
        this.healthPacks = [];
    }
}
