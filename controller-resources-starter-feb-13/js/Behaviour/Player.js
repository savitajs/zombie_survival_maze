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
        // Calculate next position
        const nextPosition = this.location.clone().addScaledVector(this.velocity, deltaTime);
        
        // Player radius (half of the cone's base size)
        const radius = 0.75;
        
        // Check collision points around the player
        const collisionPoints = [];
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            collisionPoints.push({
                x: nextPosition.x + Math.cos(angle) * radius,
                z: nextPosition.z + Math.sin(angle) * radius
            });
        }
        
        // Check if any collision point would be in a wall
        let collision = false;
        for (const point of collisionPoints) {
            if (bounds.gameMap.isWall(Math.floor(point.x), Math.floor(point.z))) {
                collision = true;
                break;
            }
        }
        
        if (collision) {
            // If collision detected, try to slide along walls
            const normalizedVelocity = this.velocity.clone().normalize();
            const slideDirections = [
                { x: normalizedVelocity.x, z: 0 },  // Slide horizontally
                { x: 0, z: normalizedVelocity.z }   // Slide vertically
            ];
            
            let canSlide = false;
            for (const direction of slideDirections) {
                // Try sliding in this direction
                const slidePosition = this.location.clone();
                slidePosition.x += direction.x * this.velocity.length() * deltaTime;
                slidePosition.z += direction.z * this.velocity.length() * deltaTime;
                
                // Check if sliding would cause collision
                let slideCollision = false;
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    const point = {
                        x: slidePosition.x + Math.cos(angle) * radius,
                        z: slidePosition.z + Math.sin(angle) * radius
                    };
                    if (bounds.gameMap.isWall(Math.floor(point.x), Math.floor(point.z))) {
                        slideCollision = true;
                        break;
                    }
                }
                
                if (!slideCollision) {
                    // We can slide in this direction
                    this.velocity.x = this.velocity.length() * direction.x;
                    this.velocity.z = this.velocity.length() * direction.z;
                    nextPosition.copy(slidePosition);
                    canSlide = true;
                    break;
                }
            }
            
            if (!canSlide) {
                // Can't slide, stop movement
                this.velocity.setLength(0);
                return;
            }
        }
        
        // Update position if no collision or after successful slide
        this.location.copy(nextPosition);
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