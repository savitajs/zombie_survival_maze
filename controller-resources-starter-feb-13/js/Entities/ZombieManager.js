import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ZombieCollisionHandler } from './ZombieCollisionHandler.js';
import { WhiskerDebug } from '../Debug/ZombieDebug.js';
import { PathFinder } from '../Pathfinding/PathFinder.js';
import { PathDebug } from '../Debug/PathDebug.js';
import { StateDebug } from '../Debug/StateDebug.js';
import { ZombieStateManager } from '../States/ZombieStateManager.js';

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
        
        this.mixers = [];  // Store animation mixers for each zombie
        this.animationClips = {}; // Store original animation clips by name

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

        this.loadZombieModel();
    }

    loadZombieModel() {
        const loader = new GLTFLoader();
        
        // First try with the correct path
        const modelPath = './public/models/low_poly_zombie_game_animation.glb';
        console.log('Attempting to load zombie model from:', modelPath);
        
        loader.load(
            modelPath,
            (gltf) => {
                console.log('Zombie model loaded successfully');
                console.log('Available animations:', gltf.animations.map(a => a.name));
                
                this.zombieModel = gltf.scene;
                
                // Reduce scale to make zombie smaller relative to environment
                this.zombieModel.scale.set(0.8, 0.8, 0.8);
                
                // Position slightly above ground to show feet
                const box = new THREE.Box3().setFromObject(this.zombieModel);
                const height = box.max.y - box.min.y;
                this.zombieModel.position.set(0, (height * 0.1) + 13, 0);
                this.zombieModel.rotation.y = Math.PI;
                
                console.log('Model loaded with height:', height);
                
                // Store original animation clips in a map for easier access
                gltf.animations.forEach(clip => {
                    this.animationClips[clip.name] = clip;
                    console.log('Animation clip stored:', clip.name, 'duration:', clip.duration);
                });
                
                // Debug the model structure
                console.log('Model structure:');
                this.debugObject(this.zombieModel);
                
                this.spawnInitialZombies();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading zombie model from', modelPath, error);
                
                // Try the alternate path as a fallback
                const altPath = './models/low_poly_zombie_game_animation.glb';
                console.log('Trying alternate path:', altPath);
                
                loader.load(
                    altPath,
                    (gltf) => {
                        console.log('Zombie model loaded successfully from alternate path');
                        console.log('Available animations:', gltf.animations.map(a => a.name));
                        
                        this.zombieModel = gltf.scene;
                        
                        // Reduce scale to make zombie smaller relative to environment
                        this.zombieModel.scale.set(0.8, 0.8, 0.8);
                        
                        // Position slightly above ground to show feet
                        const box = new THREE.Box3().setFromObject(this.zombieModel);
                        const height = box.max.y - box.min.y;
                        this.zombieModel.position.set(0, (height * 0.1) + 13, 0);
                        this.zombieModel.rotation.y = Math.PI;
                        
                        console.log('Model loaded with height:', height);
                        
                        // Store original animation clips in a map for easier access
                        gltf.animations.forEach(clip => {
                            this.animationClips[clip.name] = clip;
                            console.log('Animation clip stored:', clip.name, 'duration:', clip.duration);
                        });
                        
                        this.spawnInitialZombies();
                    },
                    (xhr) => {
                        console.log('Alternate path: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    (error) => {
                        console.error('Error loading zombie model from alternate path', error);
                        this.createFallbackModel();
                    }
                );
            }
        );
    }
    
    // Helper method to debug object structure
    debugObject(object, indent = '') {
        if (!object) return;
        
        console.log(indent + 'Object name:', object.name || 'unnamed', 'type:', object.type);
        
        if (object.animations) {
            console.log(indent + 'Animations:', object.animations.length);
        }
        
        if (object.skeleton) {
            console.log(indent + 'Has skeleton with', object.skeleton.bones.length, 'bones');
        }
        
        if (object.children && object.children.length > 0) {
            console.log(indent + 'Children:', object.children.length);
            object.children.forEach(child => {
                this.debugObject(child, indent + '  ');
            });
        }
    }

    createFallbackModel() {
        console.log('Creating fallback cube model');
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        this.zombieModel = mesh;
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
        
        // Important: Load a fresh copy of the model for each zombie to ensure proper animation
        // This is more reliable than cloning for complex models with animations
        const loader = new GLTFLoader();
        
        // Try both paths
        const tryPaths = ['./public/models/low_poly_zombie_game_animation.glb', './models/low_poly_zombie_game_animation.glb'];
        let loadAttempt = 0;
        
        const loadModelAtPath = (pathIndex) => {
            if (pathIndex >= tryPaths.length) {
                console.error('Failed to load zombie model after trying all paths');
                return;
            }
            
            const path = tryPaths[pathIndex];
            console.log(`Loading zombie model from ${path} (attempt ${pathIndex + 1})`);
            
            loader.load(
                path,
                (gltf) => {
                    console.log(`Individual zombie model loaded from ${path}`);
                    
                    const zombieModelInstance = gltf.scene;
                    zombieModelInstance.scale.set(0.8, 0.8, 0.8);
                    
                    // Create zombie object
                    const newZombie = {
                        model: zombieModelInstance,
                        position: position.clone(),
                        velocity: new THREE.Vector3(1, 0, 0),
                        speed: 5.0,
                        currentAnimation: null,
                        actions: {}, // Animation actions for this specific zombie
                        gltf: gltf // Store the entire gltf object
                    };
                    
                    // Set up animation mixer for this specific zombie instance
                    const mixer = new THREE.AnimationMixer(zombieModelInstance);
                    newZombie.animationMixer = mixer;
                    this.mixers.push(mixer);
                    
                    // Create animation actions directly from this model's animations
                    if (gltf.animations && gltf.animations.length > 0) {
                        // Map animation names to standardized names if needed
                        gltf.animations.forEach(clip => {
                            // Create action directly from this model's own animations
                            const action = mixer.clipAction(clip);
                            newZombie.actions[clip.name] = action;
                            console.log(`Created animation action "${clip.name}" for new zombie`);
                        });
                        
                        // Start with Idle animation if available
                        if (newZombie.actions['Idle']) {
                            newZombie.actions['Idle'].play();
                            newZombie.currentAnimation = 'Idle';
                            console.log('Started Idle animation for new zombie');
                        } else if (Object.keys(newZombie.actions).length > 0) {
                            // If no 'Idle' animation, use the first available animation
                            const firstAnimName = Object.keys(newZombie.actions)[0];
                            newZombie.actions[firstAnimName].play();
                            newZombie.currentAnimation = firstAnimName;
                            console.log(`No Idle animation found, using ${firstAnimName} instead`);
                        }
                    } else {
                        // Fall back to using stored animation clips
                        console.log('No animations in model, using stored animation clips');
                        for (const clipName in this.animationClips) {
                            const action = mixer.clipAction(this.animationClips[clipName]);
                            newZombie.actions[clipName] = action;
                        }
                        
                        // Start with Idle animation
                        if (newZombie.actions['Idle']) {
                            newZombie.actions['Idle'].play();
                            newZombie.currentAnimation = 'Idle';
                        }
                    }
                    
                    // Create state with the complete zombie object
                    newZombie.state = new ZombieStateManager(newZombie);
                    newZombie.model.position.copy(position);
                    this.scene.add(newZombie.model);
                    this.zombies.push(newZombie);
                    
                    // Log success
                    console.log(`Zombie #${this.zombies.length} added to scene successfully`);
                },
                undefined,
                (error) => {
                    console.error(`Error loading zombie from ${path}:`, error);
                    // Try next path
                    loadAttempt++;
                    loadModelAtPath(loadAttempt);
                }
            );
        };
        
        // Start loading with the first path
        loadModelAtPath(0);
    }

    setZombieAnimation(zombie, animationName) {
        if (zombie.currentAnimation === animationName) return;
        
        //Check if this zombie has the requested animation
        if (!zombie.actions || !zombie.actions[animationName]) {
            console.warn(`Animation '${animationName}' not found for zombie, available animations: ${Object.keys(zombie.actions).join(', ')}`);
            return;
        }
        
        console.log(`Changing zombie animation from ${zombie.currentAnimation} to ${animationName}`);
        
        // Fade out current animation if it exists
        if (zombie.currentAnimation && zombie.actions[zombie.currentAnimation]) {
            zombie.actions[zombie.currentAnimation].fadeOut(0.5);
        }

        // Fade in new animation
        zombie.actions[animationName].reset().fadeIn(0.5).play();
        
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
        // Update all animation mixers
        this.mixers.forEach(mixer => {
            if (mixer) mixer.update(deltaTime);
        });

        // Update all zombies
        this.zombies.forEach(zombie => {
            const path = this.pathFinder.findPathToTarget(zombie.position, playerPosition);
                        const stateUpdateResult = zombie.state.update(playerPosition, this.playerAttacking, path);
            
            // Update debug displays with path distance - only for the first zombie
            if (zombie === this.zombies[0]) {
                this.stateDebug.updateState(stateUpdateResult.animation, stateUpdateResult.pathDistance);
                
                // Clear path if state indicates it should be cleared
                if (stateUpdateResult.clearPath) {
                    this.pathDebug.clearPath();
                }
                
                // Only show path for the first zombie to avoid visual clutter
                if (stateUpdateResult.shouldPathFind && path) {
                    this.pathDebug.showPath(path);
                }
            }

            // Set animation according to state
            // Map state animation names to actual available animation names
            const animationMap = {
                'Idle': 'Idle',
                'Walk': 'Walk',
                'Attack': 'Attack',
                'Death': 'Death'
            };
            
            // Get the correct animation name from the map
            const availableAnimName = animationMap[stateUpdateResult.animation];
            if (availableAnimName) {
                this.setZombieAnimation(zombie, availableAnimName);
            } else {
                console.warn(`Animation "${stateUpdateResult.animation}" not mapped to an available animation`);
            }

            // *** CRITICAL FIX: Don't return early, otherwise we'll only update the first zombie ***
            // Only continue with movement logic if the state indicates movement is allowed
            if (stateUpdateResult.shouldMove) {
                let steeringForce = new THREE.Vector3();

                // Only do pathfinding if state allows it
                if (stateUpdateResult.shouldPathFind && path) {
                    steeringForce = this.followPath(zombie, path);
                }

                // Apply movement updates
                zombie.velocity.add(steeringForce.multiplyScalar(deltaTime));
                
                // Update velocity and position
                if (zombie.velocity.length() > zombie.speed) {
                    zombie.velocity.normalize().multiplyScalar(zombie.speed);
                }
                
                zombie.position.add(zombie.velocity.clone().multiplyScalar(deltaTime));
                const modelY = zombie.model.position.y || 13; // Use existing Y or default to 13
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
        });

        // Log positions every 20 seconds (but only if we have zombies)
        if (this.zombies.length > 0) {
            const currentTime = Date.now();
            if (currentTime - this.lastPositionLog >= this.positionLogInterval) {
                console.log('Position Log:');
                console.log('Player:', {
                    x: Math.round(playerPosition.x * 100) / 100,
                    y: Math.round(playerPosition.y * 100) / 100,
                    z: Math.round(playerPosition.z * 100) / 100
                });
                this.zombies.forEach((zombie, index) => {
                    console.log(`Zombie ${index}:`, {
                        x: Math.round(zombie.position.x * 100) / 100,
                        y: Math.round(zombie.position.y * 100) / 100,
                        z: Math.round(zombie.position.z * 100) / 100,
                        animation: zombie.currentAnimation
                    });
                });
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
