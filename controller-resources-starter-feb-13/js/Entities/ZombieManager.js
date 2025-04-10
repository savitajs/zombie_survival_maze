import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ZombieCollisionHandler } from './ZombieCollisionHandler.js';
import { WhiskerDebug } from '../Debug/ZombieDebug.js';
import { PathFinder } from '../Pathfinding/PathFinder.js';
import { PathDebug } from '../Debug/PathDebug.js';
import { ZombieState } from '../States/ZombieState.js';
import { StateDebug } from '../Debug/StateDebug.js';
import { HealthManager } from '../Health/HealthManager.js';

export class ZombieManager {
    constructor(scene, gameMap) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.zombies = [];
        this.zombieModel = null;
        this.lastPositionLog = Date.now(); // Add timer for position logging
        this.positionLogInterval = 20000; // 20 seconds in milliseconds

        // Store the required zombie count for this level
        this.zombieCount = gameMap.getZombieCount();

        // Add movement configuration
        this.movementConfig = {
            speed: 5.0,           // Base movement speed
            turnRate: 0.8,        // How quickly zombies can turn
        };

        this.collisionHandler = new ZombieCollisionHandler(gameMap);
        this.debug = new WhiskerDebug(scene);
        this.pathFinder = new PathFinder(gameMap);
        this.pathDebug = new PathDebug(scene);
        this.stateDebug = new StateDebug(scene);
        
        this.mixers = [];  // We'll keep this for consistency but won't use it
        this.animations = {
            'idle': 'idle',
            'walk': 'walk',
            'attack': 'attack',
            'death': 'death'
        };  // Simple string mappings instead of actual animations

        this.detectionRadius = 50; // Detection radius in units
        this.attackRadius = 5;    // Attack radius in units

        this.playerAttacking = false; // Track player attacks
        document.addEventListener('keydown', (e) => {
            if (e.key === 'x') {
                this.playerAttacking = true;
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'x') {
                this.playerAttacking = false;
            }
        });

        this.healthManager = null;

        this.loadZombieModel();
    }

    setHealthBar(healthBar, player) {
        this.healthManager = new HealthManager(healthBar, player);
    }

    loadZombieModel() {
        console.log('Creating cube model');
        const geometry = new THREE.BoxGeometry(2, 4, 2); // Doubled size
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.zombieModel = new THREE.Mesh(geometry, material);
        this.zombieModel.position.y = 20; // Set initial height to 20
        this.spawnInitialZombies();
    }

    spawnInitialZombies() {
        console.log(`Spawning ${this.zombieCount} zombies for level ${this.gameMap.level}`);
        // Spawn the required number of zombies for this level
        for (let i = 0; i < this.zombieCount; i++) {
            this.spawnZombie();
        }
    }

    spawnZombie() {
        if (!this.zombieModel) return;

        // Get center position of a random ground tile
        const getValidSpawnPosition = () => {
            const validNodes = this.gameMap.mapGraph.nodes.filter(node => !this.gameMap.isWall(
                this.gameMap.localize(node).x,
                this.gameMap.localize(node).z
            ));
            
            if (validNodes.length === 0) return new THREE.Vector3(0, 20, 0); // Changed y to 20
            
            const randomNode = validNodes[Math.floor(Math.random() * validNodes.length)];
            const worldPos = this.gameMap.localize(randomNode);
            worldPos.y = 20; // Set y position to 20
            
            return worldPos;
        };

        const position = getValidSpawnPosition();
        console.log('Spawning zombie at:', position);

        // Create zombie object first before passing to state
        const newZombie = {
            model: this.zombieModel.clone(),
            position: position,
            velocity: new THREE.Vector3(1, 0, 0),
            speed: 5.0,
            currentAnimation: 'idle'
        };

        // Now create state with the complete zombie object
        newZombie.state = new ZombieState(newZombie);

        newZombie.model.position.copy(position);
        this.scene.add(newZombie.model);
        this.zombies.push(newZombie);
    }

    setZombieAnimation(zombie, animationName) {
        if (zombie.currentAnimation === animationName) return;
        
        // Update material color based on state
        switch(animationName) {
            case 'death':
                zombie.model.material.color.setHex(0x000000); // Black for death
                break;
            case 'attack':
                zombie.model.material.color.setHex(0xff0000); // Red for attack
                break;
            case 'walk':
                zombie.model.material.color.setHex(0xff3333); // Lighter red for walk
                break;
            case 'idle':
                zombie.model.material.color.setHex(0xff6666); // Even lighter red for idle
                break;
        }
        
        zombie.currentAnimation = animationName;
    }

    seek(zombie, target) {
        // Get direction to target
        const desired = new THREE.Vector3()
            .subVectors(target, zombie.position)
            .normalize()
            .multiplyScalar(zombie.speed);

        // Return steering force
        return desired.sub(zombie.velocity);
    }

    detectCollision(zombie) {
        const lookAhead = 15;
        const whiskerLength = lookAhead * 0.7;
        const whiskerAngle = Math.PI/4;

        // Create whiskers
        const center = zombie.velocity.clone().normalize().multiplyScalar(lookAhead);
        const leftWhisker = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), whiskerAngle);
        const rightWhisker = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -whiskerAngle);
        
        // Set lengths
        leftWhisker.setLength(whiskerLength);
        rightWhisker.setLength(whiskerLength);

        // Calculate end points for visualization
        const centerEnd = zombie.position.clone().add(center);
        const leftEnd = zombie.position.clone().add(leftWhisker);
        const rightEnd = zombie.position.clone().add(rightWhisker);

        // Get current node and surrounding walls
        const currentNode = this.gameMap.quantize(zombie.position);
        const nearbyWalls = currentNode ? this.gameMap.getWallPositions(currentNode) : [];

        // Check collisions using rayIntersectsBox for better accuracy
        const centerHit = nearbyWalls.some(wallPos => {
            const wallBox = new THREE.Box3();
            const halfSize = this.gameMap.tileSize / 2;
            wallBox.min.set(wallPos.x - halfSize, 0, wallPos.z - halfSize);
            wallBox.max.set(wallPos.x + halfSize, this.gameMap.tileSize, wallPos.z + halfSize);
            return this.gameMap.rayIntersectsBox(zombie.position, center.normalize(), wallBox, lookAhead);
        });

        const leftHit = nearbyWalls.some(wallPos => {
            const wallBox = new THREE.Box3();
            const halfSize = this.gameMap.tileSize / 2;
            wallBox.min.set(wallPos.x - halfSize, 0, wallPos.z - halfSize);
            wallBox.max.set(wallPos.x + halfSize, this.gameMap.tileSize, wallPos.z + halfSize);
            return this.gameMap.rayIntersectsBox(zombie.position, leftWhisker.normalize(), wallBox, whiskerLength);
        });

        const rightHit = nearbyWalls.some(wallPos => {
            const wallBox = new THREE.Box3();
            const halfSize = this.gameMap.tileSize / 2;
            wallBox.min.set(wallPos.x - halfSize, 0, wallPos.z - halfSize);
            wallBox.max.set(wallPos.x + halfSize, this.gameMap.tileSize, wallPos.z + halfSize);
            return this.gameMap.rayIntersectsBox(zombie.position, rightWhisker.normalize(), wallBox, whiskerLength);
        });

        // Update debug visualization with individual hits
        this.debug.updateWhiskers(
            zombie.position,
            centerEnd,
            leftEnd,
            rightEnd,
            { center: centerHit, left: leftHit, right: rightHit }
        );

        return {
            center: centerHit,
            left: leftHit,
            right: rightHit,
            hasCollision: centerHit || leftHit || rightHit
        };
    }

    followPath(zombie, path) {
        if (!path || path.length === 0) return new THREE.Vector3();

        // Get next waypoint
        const target = path[0];
        const distanceToTarget = zombie.position.distanceTo(target);

        // If close enough to current waypoint, move to next one
        if (distanceToTarget < 2) {
            path.shift();
            return this.followPath(zombie, path);
        }

        // Use seek behavior to move towards waypoint
        return this.seek(zombie, target);
    }

    update(deltaTime, playerPosition) {
        const currentTime = Date.now();
        
        // Get reference to health bar if we don't have it
        if (!this.healthBar) {
            this.healthBar = document.querySelector('.health-bar');
        }

        // Update health manager
        if (this.healthManager) {
            this.healthManager.update();
        }

        this.zombies.forEach(zombie => {
            const path = this.pathFinder.findPathToTarget(zombie.position, playerPosition);
            const stateUpdate = zombie.state.update(playerPosition, this.playerAttacking, path);
            
            // Update debug displays
            if (zombie === this.zombies[0]) {
                this.stateDebug.updateState(stateUpdate.animation, stateUpdate.pathDistance);
                
                // Clear path if state indicates it should be cleared
                if (stateUpdate.clearPath) {
                    this.pathDebug.clearPath();
                }
                
                // Only show path for the first zombie to avoid visual clutter
                if (stateUpdate.shouldPathFind && path) {
                    this.pathDebug.showPath(path);
                }
            }

            this.setZombieAnimation(zombie, stateUpdate.animation);

            // Handle attacking state and health reduction
            if (stateUpdate.animation === 'attack' && this.healthManager) {
                this.healthManager.handleZombieAttack();
            }

            // Handle movement
            if (stateUpdate.shouldMove && path && path.length > 0) {
                const steeringForce = this.followPath(zombie, path);
                zombie.velocity.add(steeringForce.multiplyScalar(deltaTime));
                
                if (zombie.velocity.length() > zombie.speed) {
                    zombie.velocity.normalize().multiplyScalar(zombie.speed);
                }
                
                zombie.position.add(zombie.velocity.clone().multiplyScalar(deltaTime));
                zombie.model.position.set(
                    zombie.position.x,
                    20, // Keep y position fixed at 20
                    zombie.position.z
                );

                // Update rotation
                if (zombie.velocity.length() > 0.01) {
                    const targetRotation = new THREE.Vector3(
                        zombie.position.x + zombie.velocity.x,
                        20,
                        zombie.position.z + zombie.velocity.z
                    );
                    zombie.model.lookAt(targetRotation);
                }
            }
        });

        // Log positions and health every 20 seconds (but only if we have zombies)
        if (this.zombies.length > 0) {
            const currentTime = Date.now();
            if (currentTime - this.lastPositionLog >= this.positionLogInterval) {
                console.log('=== Status Log ===');
                if (this.healthManager) {
                    const health = this.healthManager.getCurrentHealth();
                    console.log('Player Health:', health);
                }
                console.log('Player Position:', {
                    x: Math.round(playerPosition.x * 100) / 100,
                    y: Math.round(playerPosition.y * 100) / 100,
                    z: Math.round(playerPosition.z * 100) / 100
                });
                this.zombies.forEach((zombie, index) => {
                    console.log(`Zombie ${index}:`, {
                        x: Math.round(zombie.position.x * 100) / 100,
                        y: Math.round(zombie.position.y * 100) / 100,
                        z: Math.round(zombie.position.z * 100) / 100
                    });
                });
                console.log('================');
                this.lastPositionLog = currentTime;
            }
        }
    }

    cleanup() {
        this.zombies.forEach(zombie => {
            this.scene.remove(zombie.model);
        });
        this.zombies = [];
        this.debug.remove();
        this.pathDebug.clearPath();
        this.stateDebug.cleanup();
        this.mixers = [];
    }
}
