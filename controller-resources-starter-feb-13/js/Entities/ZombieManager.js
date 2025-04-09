import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ZombieCollisionHandler } from './ZombieCollisionHandler.js';
import { WhiskerDebug } from '../Debug/ZombieDebug.js';

export class ZombieManager {
    constructor(scene, gameMap) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.zombies = [];
        this.zombieModel = null;
        this.lastPositionLog = 0; // Add timer for position logging

        // Add movement configuration
        this.movementConfig = {
            wanderSpeed: 15.0,         // Units per second
            turnRate: 0.8,             // How quickly zombies can turn
            directionChangeRate: 0.3,   // How often direction changes
            collisionBounceSpeed: 5.0   // Speed after hitting wall
        };

        // Add wander parameters
        this.wanderParams = {
            maxSpeed: 8.0,           // Base movement speed
            turnSpeed: 2.0,          // How fast they can turn
            randomStrength: 0.5,     // How random the movement is
            rayLength: 8,            // Collision detection distance
            rayCount: 8              // Number of rays for collision
        };

        this.collisionHandler = new ZombieCollisionHandler(gameMap);
        this.debug = new WhiskerDebug(scene);
        
        // Create a fallback geometry (temporary for testing)
        const createFallbackModel = () => {
            console.log('Creating fallback cube model');
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const mesh = new THREE.Mesh(geometry, material);
            this.zombieModel = mesh;
            this.spawnInitialZombies();
        };

        // Try to load model or use fallback
        const loader = new GLTFLoader();
        loader.load(
            'car.glb',  // Changed back to original path
            (gltf) => {
                console.log('Model loaded successfully');
                this.zombieModel = gltf.scene;
                this.zombieModel.scale.set(0.02, 0.02, 0.02);
                this.spawnInitialZombies();
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                createFallbackModel();
            }
        );
    }

    spawnInitialZombies() {
        // Only spawn one zombie for testing
        this.spawnZombie();
    }

    spawnZombie() {
        if (!this.zombieModel) return;

        const position = new THREE.Vector3(0, this.gameMap.tileSize/2, 0); // Start at center
        console.log('Spawning zombie at:', position);

        const zombie = {
            model: this.zombieModel.clone(),
            position: position,
            velocity: new THREE.Vector3(1, 0, 0), // Start moving right
            speed: 5.0,
            wanderAngle: 0,
            lastDebugTime: 0
        };

        zombie.model.position.copy(position);
        this.scene.add(zombie.model);
        this.zombies.push(zombie);
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

    wander(zombie) {
        // Larger distance and smaller radius for straighter paths
        const distance = 30;      // Increased from 10 to look further ahead
        const radius = 2;         // Reduced from 10 for less circular motion
        const angleOffset = 0.1;  // Reduced from 0.3 for more gradual turns

        let futureLocation = zombie.velocity.clone();
        futureLocation.setLength(distance);
        futureLocation.add(zombie.position);
        
        // Smaller circle for target calculation
        let target = new THREE.Vector3(
            radius * Math.sin(zombie.wanderAngle),
            0,
            radius * Math.cos(zombie.wanderAngle)
        );
        target.add(futureLocation);
        
        const desired = target.clone().sub(zombie.position).normalize().multiplyScalar(zombie.speed);
        const steer = desired.sub(zombie.velocity);

        // Smaller angle changes for smoother turns
        const change = (Math.random() * angleOffset) - (angleOffset * 0.5);
        zombie.wanderAngle += change;
        
        return steer;
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

    update(deltaTime, playerPosition) {
        const zombie = this.zombies[0];
        if (!zombie) return;

        // Check for collisions first
        const collision = this.detectCollision(zombie);
        if (collision.hasCollision) {
            console.log('Collision detected at position:', 
                `x: ${zombie.position.x.toFixed(2)}, z: ${zombie.position.z.toFixed(2)}`);
        }

        // Apply wander force as before
        const wanderForce = this.wander(zombie);
        zombie.velocity.add(wanderForce.multiplyScalar(deltaTime));
        
        // Limit speed
        if (zombie.velocity.length() > zombie.speed) {
            zombie.velocity.normalize().multiplyScalar(zombie.speed);
        }

        // Update position
        zombie.position.add(zombie.velocity.clone().multiplyScalar(deltaTime));
        zombie.model.position.copy(zombie.position);
        
        if (zombie.velocity.length() > 0.01) {
            zombie.model.lookAt(zombie.position.clone().add(zombie.velocity));
        }
    }

    cleanup() {
        this.zombies.forEach(zombie => {
            this.scene.remove(zombie.model);
        });
        this.zombies = [];
        this.debug.remove();
    }
}
