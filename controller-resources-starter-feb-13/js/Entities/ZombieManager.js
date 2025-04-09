import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ZombieCollisionHandler } from './ZombieCollisionHandler.js';
import { WhiskerDebug } from '../Debug/ZombieDebug.js';
import { PathFinder } from '../Pathfinding/PathFinder.js';
import { PathDebug } from '../Debug/PathDebug.js';
import { ZombieState } from '../States/ZombieState.js';
import { StateDebug } from '../Debug/StateDebug.js';

export class ZombieManager {
    constructor(scene, gameMap) {
        this.scene = scene;
        this.gameMap = gameMap;
        this.zombies = [];
        this.zombieModel = null;
        this.lastPositionLog = Date.now(); // Add timer for position logging
        this.positionLogInterval = 20000; // 20 seconds in milliseconds

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
        
        this.mixers = [];  // Store animation mixers
        this.animations = {};  // Store animations by name

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

        // Create a fallback geometry (temporary for testing)
        const createFallbackModel = () => {
            console.log('Creating fallback cube model');
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const mesh = new THREE.Mesh(geometry, material);
            this.zombieModel = mesh;
            this.spawnInitialZombies();
        };

        this.loadZombieModel();
    }

    loadZombieModel() {
        const loader = new GLTFLoader();
        loader.load(
            './models/low_poly_zombie_game_animation.glb',
            (gltf) => {
                console.log('Zombie model loaded successfully');
                console.log('Available animations:', gltf.animations);
                
                this.zombieModel = gltf.scene;
                
                // Reduce scale to make zombie smaller relative to environment
                this.zombieModel.scale.set(0.8, 0.8, 0.8);  // Changed from 2 to 0.8
                
                // Position slightly above ground to show feet
                const box = new THREE.Box3().setFromObject(this.zombieModel);
                const height = box.max.y - box.min.y;
                this.zombieModel.position.set(0, (height * 0.1) + 13, 0);  // Lift by 10% of height
                this.zombieModel.rotation.y = Math.PI;
                
                console.log('Model loaded with height:', height);
                
                // Store animations
                gltf.animations.forEach(animation => {
                    this.animations[animation.name] = animation;
                    console.log('Animation loaded:', animation.name);
                });
                
                this.spawnInitialZombies();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading zombie model:', error);
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

        // Get center position of a random ground tile
        const getValidSpawnPosition = () => {
            const validNodes = this.gameMap.mapGraph.nodes.filter(node => !this.gameMap.isWall(
                this.gameMap.localize(node).x,
                this.gameMap.localize(node).z
            ));
            
            if (validNodes.length === 0) return new THREE.Vector3(0, 40, 0);
            
            const randomNode = validNodes[Math.floor(Math.random() * validNodes.length)];
            const worldPos = this.gameMap.localize(randomNode);
            const box = new THREE.Box3().setFromObject(this.zombieModel);
            const height = box.max.y - box.min.y;
            worldPos.y = height * 0.1; // Match the height offset from model loading
            
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

        // Set up animation mixer for this zombie
        const mixer = new THREE.AnimationMixer(newZombie.model);
        this.mixers.push(mixer);
        
        // Play idle animation by default
        if (this.animations['idle']) {
            const action = mixer.clipAction(this.animations['idle']);
            action.play();
        }

        newZombie.mixer = mixer;
        newZombie.model.position.copy(position);
        this.scene.add(newZombie.model);
        this.zombies.push(newZombie);
    }

    setZombieAnimation(zombie, animationName) {
        if (zombie.currentAnimation === animationName) return;
        
        const mixer = zombie.mixer;
        if (!mixer || !this.animations[animationName]) return;

        // Fade out current animation
        if (zombie.currentAnimation) {
            const current = mixer.clipAction(this.animations[zombie.currentAnimation]);
            current.fadeOut(0.5);
        }

        // Fade in new animation
        const newAction = mixer.clipAction(this.animations[animationName]);
        newAction.reset().fadeIn(0.5).play();
        
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
        // Update animation mixers
        this.mixers.forEach(mixer => mixer.update(deltaTime));

        const zombie = this.zombies[0];
        if (!zombie) return;

        const distanceToPlayer = zombie.position.distanceTo(playerPosition);
        const stateUpdate = zombie.state.update(playerPosition, this.playerAttacking);
        
        // Update debug displays
        this.stateDebug.updateState(stateUpdate.animation, distanceToPlayer);
        
        this.setZombieAnimation(zombie, stateUpdate.animation);

        if (!stateUpdate.shouldMove) return;

        let steeringForce = new THREE.Vector3();

        // Only do pathfinding if state allows it
        if (stateUpdate.shouldPathFind) {
            const path = this.pathFinder.findPathToTarget(zombie.position, playerPosition);
            if (path) {
                this.pathDebug.showPath(path);
                steeringForce = this.followPath(zombie, path);
            }
        } else {
            this.pathDebug.clearPath(); // Clear path when not pathfinding
        }

        // Log positions every 20 seconds
        const currentTime = Date.now();
        if (currentTime - this.lastPositionLog >= this.positionLogInterval) {
            console.log('Position Log:');
            console.log('Player:', {
                x: Math.round(playerPosition.x * 100) / 100,
                y: Math.round(playerPosition.y * 100) / 100,
                z: Math.round(playerPosition.z * 100) / 100
            });
            console.log('Zombie:', {
                x: Math.round(zombie.position.x * 100) / 100,
                y: Math.round(zombie.position.y * 100) / 100,
                z: Math.round(zombie.position.z * 100) / 100
            });
            this.lastPositionLog = currentTime;
        }

        // Apply movement updates
        zombie.velocity.add(steeringForce.multiplyScalar(deltaTime));
        
        // Update velocity and position
        if (zombie.velocity.length() > zombie.speed) {
            zombie.velocity.normalize().multiplyScalar(zombie.speed);
        }
        
        zombie.position.add(zombie.velocity.clone().multiplyScalar(deltaTime));
        const modelY = (zombie.model.position.y - zombie.position.y) || 13;
        zombie.model.position.set(
            zombie.position.x,
            modelY,
            zombie.position.z
        );

        // Update rotation
        if (zombie.velocity.length() > 0.01) {
            const targetRotation = new THREE.Vector3(
                zombie.position.x + zombie.velocity.x,
                zombie.model.position.y,
                zombie.position.z + zombie.velocity.z
            );
            zombie.model.lookAt(targetRotation);
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
