import { Character } from './Character.js';
import { State } from './State.js';
import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

export class Player extends Character {
  constructor(color) {
    super(color);
    
    // Create appropriately sized player model for the larger maze
    const geometry = new THREE.ConeGeometry(1.5, 2, 5);
    const material = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    this.gameObject = new THREE.Mesh(geometry, material);
    
    // Rotate cone so its BASE faces BACKWARD (-Z) and pointy part faces FORWARD (+Z)
    this.gameObject.rotation.x = Math.PI / 2; // Flip to point along -Z axis
    
    this.location = this.gameObject.position;
    this.size = 5; // Match the size with the geometry
    
    // Movement properties based on path-following implementation
    this.topSpeed = 20;
    this.maxForce = 15;
    this.mass = 1;
    
    // State management
    this.state = new IdleState();
    this.state.enterState(this);

    // Add forward direction for camera positioning
    // The forward vector now points where the POINTY part is facing
    this.forward = new THREE.Vector3(0, 0, 1);

    // Add player health property
    this.totalHealth = 100;
    this.maxHealth = 100;
  }

  switchState(state) {
    this.state = state;
    this.state.enterState(this);
  }

  update(deltaTime, bounds, controller) {
    // Update state
    this.state.updateState(this, controller);
    
    // Apply force from controller input if moving
    if (controller && controller.isMoving()) {
        const moveForce = controller.getMoveForce();
        this.applyForce(moveForce);
        
        if (this.state.constructor.name !== 'MovingState') {
            this.switchState(new MovingState());
        }
    } else if (this.velocity.length() > 0) {
        const brakeForce = this.applyBrakes();
        this.applyForce(brakeForce);
    } else if (this.state.constructor.name !== 'IdleState') {
        this.switchState(new IdleState());
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

  // Get player's forward direction - this points where the POINTY part is facing
  getForwardDirection() {
    // Return the direction the pointy part is facing
    return this.forward.clone();
  }

  // Get player's backward direction - this points where the BASE is facing
  getBackwardDirection() {
    // Return the direction the base is facing
    return this.forward.clone().negate();
  }

  getTotalHealth() {
    return this.totalHealth;
  }

  setTotalHealth(health) {
    this.totalHealth = Math.max(0, Math.min(health, this.maxHealth));
  }
}

export class IdleState extends State {
  enterState(player) {
    // No special action required for idle
  }

  updateState(player, controller) {
    // The state transition is handled in the Player.update method
  }
}

export class MovingState extends State {
  enterState(player) {
    // No special action required for moving
  }

  updateState(player, controller) {
    // The state transition is handled in the Player.update method
  }
}