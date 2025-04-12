import { Character } from './Character.js';
import { State } from './State.js';
import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player extends Character {
  constructor(color) {
    super(color);
    
    // Create a temporary placeholder until the model loads
    const geometry = new THREE.ConeGeometry(1.5, 2, 5);
    const material = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    this.gameObject = new THREE.Mesh(geometry, material);
    this.gameObject.rotation.x = Math.PI / 2;
    
    this.location = this.gameObject.position;
    this.size = 5;
    
    // Movement properties based on path-following implementation
    this.topSpeed = 20;
    this.maxForce = 15;
    this.mass = 1;
    
    // Animation properties
    this.mixer = null;
    this.actions = {};
    this.currentAnimation = null;
    this.animationDebug = {
      lastLogTime: 0,
      loopCount: 0,
      durations: {}
    };
    
    // State management with transition tracking
    this.state = new IdleState();
    this.previousState = null;
    this.stateTransitionTime = 0;
    this.movementInputActive = false; // Tracks if movement keys are currently pressed
    this.wasMoving = false; // Tracks previous movement state
    
    this.state.enterState(this);

    // Add forward direction for camera positioning
    this.forward = new THREE.Vector3(0, 0, 1);

    // Health properties
    this.maxHealth = 100;
    this.health = this.maxHealth;
    
    // Load the player model
    this.loadModel();
  }
  
  loadModel() {
    const loader = new GLTFLoader();
    
    // Try both potential paths for the model
    const modelPaths = ['./public/models/remi.glb', './models/remi.glb'];
    let currentPathIndex = 0;
    
    const tryLoadModel = (pathIndex) => {
      if (pathIndex >= modelPaths.length) {
        console.error('Failed to load player model after trying all paths');
        return;
      }
      
      const path = modelPaths[pathIndex];
      console.log(`Loading player model from: ${path}`);
      
      loader.load(
        path,
        (gltf) => {
          console.log('Player model loaded successfully');
          console.log('Available animations:', gltf.animations.map(a => a.name));
          
          // Store the model
          const model = gltf.scene;
          
          // Calculate appropriate scale
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const scale = 9.5 / Math.max(size.x, size.y, size.z);
          
          // Apply scale and position
          model.scale.set(scale, scale, scale);
          
          // Replace the placeholder with the loaded model
          if (this.gameObject.parent) {
            const parent = this.gameObject.parent;
            const position = this.gameObject.position.clone();
            const rotation = this.gameObject.rotation.clone();
            
            parent.remove(this.gameObject);
            this.gameObject = model;
            this.gameObject.position.copy(position);
            this.gameObject.rotation.y = rotation.y;
            parent.add(this.gameObject);
          } else {
            this.gameObject = model;
          }
          
          // Set up animation mixer
          this.mixer = new THREE.AnimationMixer(model);
          
          // Process animations
          gltf.animations.forEach(clip => {
            const action = this.mixer.clipAction(clip);
            this.actions[clip.name] = action;
            
            // Store animation durations for debugging
            this.animationDebug.durations[clip.name] = clip.duration;
            
            console.log(`Animation "${clip.name}" prepared, duration: ${clip.duration.toFixed(2)}s`);
          });
          
          // Add animation finished callback
          this.mixer.addEventListener('loop', (e) => {
            const clipName = e.action._clip.name;
            this.animationDebug.loopCount++;
            console.log(`Animation "${clipName}" completed a loop (${this.animationDebug.loopCount})`);
          });
          
          // Start with the Idle animation
          if (this.actions['Idle']) {
            this.playAnimation('Idle');
          } else {
            console.warn('Idle animation not found in model');
          }
        },
        (xhr) => {
          console.log(`${path}: ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (error) => {
          console.error(`Error loading model from ${path}:`, error);
          // Try next path
          tryLoadModel(pathIndex + 1);
        }
      );
    };
    
    // Start trying the first path
    tryLoadModel(0);
  }
  
  playAnimation(name, immediate = false) {
    if (this.currentAnimation === name) return;
    
    if (!this.actions || !this.actions[name]) {
      console.warn(`Animation '${name}' not found for player`);
      return;
    }
    
    console.log(`Changing player animation to ${name} (duration: ${this.animationDebug.durations[name]?.toFixed(2)}s)`);
    
    // Set transition time based on whether this is an immediate transition
    const transitionTime = immediate ? 0.1 : 0.5;
    
    // Fade out current animation if it exists
    if (this.currentAnimation && this.actions[this.currentAnimation]) {
      this.actions[this.currentAnimation].fadeOut(transitionTime);
    }
    
    // Fade in new animation
    this.actions[name].reset().fadeIn(transitionTime).play();
    this.currentAnimation = name;
    
    // Reset animation debug time
    this.animationDebug.lastLogTime = 0;
    this.animationDebug.animationTime = 0;
  }

  switchState(state) {
    if (this.state.constructor.name === state.constructor.name) {
      return; // Don't switch to the same state type
    }
    
    this.previousState = this.state;
    this.state = state;
    this.stateTransitionTime = 0;
    this.state.enterState(this);
  }

  update(deltaTime, bounds, controller) {
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
      
      // Log animation time every second
      if (this.currentAnimation) {
        this.animationDebug.animationTime += deltaTime;
        
        // Only log once per second
        if (this.animationDebug.animationTime - this.animationDebug.lastLogTime >= 1.0) {
          const duration = this.animationDebug.durations[this.currentAnimation];
          const currentTime = this.animationDebug.animationTime % duration;
          const progress = Math.floor((currentTime / duration) * 100);
          
          console.log(`Animation "${this.currentAnimation}": ${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s (${progress}% complete)`);
          
          this.animationDebug.lastLogTime = Math.floor(this.animationDebug.animationTime);
        }
      }
    }
    
    // Increment state transition time
    this.stateTransitionTime += deltaTime;
    
    // Check health for death state - play Death animation when health is 0
    if (this.health <= 0 && this.currentAnimation !== 'Death') {
      this.playAnimation('Death');
      if (!(this.state instanceof DeathState)) {
        this.switchState(new DeathState());
      }
      // Skip further state processing when dead
      return;
    }
    
    // Track if we're currently receiving movement input from controller
    const currentlyMoving = controller && controller.isMoving();
    
    // Handle state transitions based on movement input changes
    if (currentlyMoving !== this.wasMoving) {
      // Movement state has changed
      if (currentlyMoving) {
        // Just started moving
        if (!(this.state instanceof MovingState)) {
          this.switchState(new MovingState());
        }
      } else {
        // Just stopped moving
        if (!(this.state instanceof IdleState)) {
          this.switchState(new IdleState());
        }
      }
      // Update tracking state
      this.wasMoving = currentlyMoving;
    }
    
    // Update state behavior
    this.state.updateState(this, controller);
    
    // Apply force from controller input if moving
    if (currentlyMoving) {
        const moveForce = controller.getMoveForce();
        
        // Transform the movement force based on camera angle
        // This makes movement relative to where the player is facing
        const transformedForce = new THREE.Vector3();
        const playerAngle = this.gameObject.rotation.y;
        
        // Apply rotation transform to make movement relative to player's facing direction
        // Using standard rotation matrix for 2D rotation around Y axis
        transformedForce.x = moveForce.x * Math.cos(playerAngle) - moveForce.z * Math.sin(playerAngle);
        transformedForce.z = moveForce.x * Math.sin(playerAngle) + moveForce.z * Math.cos(playerAngle);
        transformedForce.y = 0;
        
        this.applyForce(transformedForce);
    } else {
        // Immediately stop when no movement input is received
        this.velocity.set(0, 0, 0);
    }
    
    // Update physics
    this.velocity.addScaledVector(this.acceleration, deltaTime);
    if (this.velocity.length() > this.topSpeed) {
        this.velocity.setLength(this.topSpeed);
    }
    
    if (bounds.gameMap) {
        // Store current position before moving
        const currentPosition = this.location.clone();
        
        // Calculate next position based on velocity
        const nextPosition = currentPosition.clone().addScaledVector(this.velocity, deltaTime);
        
        // Player collision radius (half of the cone's base size)
        const radius = 1.0; // Slightly larger than before for better collision detection
        
        // Create multiple collision check points around the player (8 points on the perimeter plus center)
        const collisionPoints = [];
        const segments = 8;
        
        // Center point
        collisionPoints.push({ x: nextPosition.x, z: nextPosition.z });
        
        // Points around the perimeter
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            collisionPoints.push({
                x: nextPosition.x + Math.cos(angle) * radius,
                z: nextPosition.z + Math.sin(angle) * radius
            });
        }
        
        // Check if any collision point would hit a wall
        let collision = false;
        
        for (const point of collisionPoints) {
            if (bounds.gameMap.isWall(point.x, point.z)) {
                collision = true;
                break;
            }
        }
        
        if (collision) {
            // Try sliding along walls by separating X and Z movements
            // Try X movement only
            const xOnlyPosition = currentPosition.clone();
            xOnlyPosition.x += this.velocity.x * deltaTime;
            
            // Check if X movement alone causes collision
            let xCollision = false;
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const point = {
                    x: xOnlyPosition.x + Math.cos(angle) * radius,
                    z: xOnlyPosition.z + Math.sin(angle) * radius
                };
                if (bounds.gameMap.isWall(point.x, point.z)) {
                    xCollision = true;
                    break;
                }
            }
            
            // Try Z movement only
            const zOnlyPosition = currentPosition.clone();
            zOnlyPosition.z += this.velocity.z * deltaTime;
            
            // Check if Z movement alone causes collision
            let zCollision = false;
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const point = {
                    x: zOnlyPosition.x + Math.cos(angle) * radius,
                    z: zOnlyPosition.z + Math.sin(angle) * radius
                };
                if (bounds.gameMap.isWall(point.x, point.z)) {
                    zCollision = true;
                    break;
                }
            }
            
            // Update position based on what's possible
            if (!xCollision) {
                this.location.x = xOnlyPosition.x;
            }
            
            if (!zCollision) {
                this.location.z = zOnlyPosition.z;
            }
            
            // If both directions cause collisions, we can't move
            if (xCollision && zCollision) {
                // Bounce back slightly
                this.velocity.multiplyScalar(-0.1);
            }
        } else {
            // No collision, so we can update the position normally
            this.location.copy(nextPosition);
        }
    }
    
    this.checkBounds(bounds);
    
    // Only update rotation when moving significantly
    if (this.velocity.length() > 0.1) {
        const angle = Math.atan2(this.velocity.x, this.velocity.z);
        this.gameObject.rotation.y = angle;
        
        this.forward.set(
            Math.sin(angle),
            0,
            Math.cos(angle)
        ).normalize();
    }
    
    this.gameObject.position.copy(this.location);
    this.acceleration.setLength(0);
  }

  // Get player's forward direction - this points where the character is facing
  getForwardDirection() {
    return this.forward.clone();
  }

  // Get player's backward direction
  getBackwardDirection() {
    return this.forward.clone().negate();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.playAnimation('Death', true); // Immediate transition to death
      this.switchState(new DeathState());
    }
    return this.health;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health;
  }
  
  setColor(color) {
    // For compatibility with the old Character class
    // This doesn't affect the GLB model, but prevents errors
    console.log(`Setting player color to ${color} (visual effect not applied to GLB model)`);
  }
}

export class IdleState extends State {
  enterState(player) {
    // Play the idle animation when entering the idle state
    if (player.actions && player.actions['Idle']) {
      player.playAnimation('Idle');
    }
    console.log("Player state changed to IDLE");
  }

  updateState(player, controller) {
    // Nothing to do here - transitions are handled in Player.update
  }
}

export class MovingState extends State {
  enterState(player) {
    // Play the Run animation when entering the moving state
    if (player.actions && player.actions['Run']) {
      player.playAnimation('Run');
    }
    console.log("Player state changed to MOVING");
  }

  updateState(player, controller) {
    // Nothing to do here - transitions are handled in Player.update
  }
}

export class DeathState extends State {
  enterState(player) {
    // Play the Death animation when entering the death state
    if (player.actions && player.actions['Death']) {
      player.playAnimation('Death', true); // Immediate transition
    }
    console.log("Player state changed to DEATH");
  }

  updateState(player, controller) {
    // In death state, player can't move
    player.velocity.set(0, 0, 0);
  }
}