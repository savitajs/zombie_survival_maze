import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HealthPack } from './HealthPack.js';

export class HealthPackManager {
    constructor(scene, gameMap, healthManager) {
        if (!scene || !gameMap) {
            console.error('HealthPackManager: scene or gameMap is undefined');
            return;
        }
        this.scene = scene;
        this.gameMap = gameMap;
        this.healthManager = healthManager;
        this.healthPacks = [];
        this.spawnHealthPacks(3, 'HealthPackManagerConstructor'); // Spawn 3 health packs

        // Add debug display
        this.debugElement = document.createElement('div');
        this.debugElement.style.position = 'absolute';
        this.debugElement.style.top = '140px';  // Below other UI elements
        this.debugElement.style.left = '20px';
        this.debugElement.style.color = 'white';
        this.debugElement.style.fontSize = '14px';
        this.debugElement.style.fontFamily = 'Arial, sans-serif';
        this.debugElement.style.padding = '10px';
        this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.debugElement.style.borderRadius = '5px';
        document.body.appendChild(this.debugElement);
    }

    spawnHealthPacks(count, who) {
        console.log(`Spawning ${count} health packs`);
        console.log(`Spawning done by: ${who}`);

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
        worldPos.y = 25; // Adjust height as needed
        
        return worldPos;
    }

    update(playerPosition, currentHealth, healthManager) {
        const PICKUP_RADIUS = 10;
        
        // Update debug display with Y coordinates
        let debugText = `Player: x:${playerPosition.x.toFixed(1)}, y:${playerPosition.y.toFixed(1)}, z:${playerPosition.z.toFixed(1)}\n`;
        debugText += 'Health Packs:\n';
        
        for (const pack of this.healthPacks) {
            if (!pack.used) {
                const packPositionXZ = new THREE.Vector2(pack.position.x, pack.position.z);
                const playerPositionXZ = new THREE.Vector2(playerPosition.x, playerPosition.z);
                const distance = packPositionXZ.distanceTo(playerPositionXZ);

                debugText += `Pack: x:${pack.position.x.toFixed(1)}, y:${pack.position.y.toFixed(1)}, z:${pack.position.z.toFixed(1)} (dist: ${distance.toFixed(1)})\n`;

                if (distance < PICKUP_RADIUS && currentHealth < 100) {
                    healthManager.healPlayer();
                    return pack.collect();
                }
            }
        }
        
        this.debugElement.innerText = debugText;
        return false;
    }

    cleanup() {
        this.healthPacks.forEach(pack => pack.cleanup());
        this.healthPacks = [];
        if (this.debugElement && this.debugElement.parentNode) {
            this.debugElement.parentNode.removeChild(this.debugElement);
        }
    }
}
