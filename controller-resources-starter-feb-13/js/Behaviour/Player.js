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
        
        // Switch to moving state if needed
        if (this.state.constructor.name !== 'MovingState') {
            this.switchState(new MovingState());
        }
    } else if (this.velocity.length() > 0) {
        // Apply braking force when no keys are pressed but still moving
        const brakeForce = this.applyBrakes();
        this.applyForce(brakeForce);
    } else if (this.state.constructor.name !== 'IdleState') {
        this.switchState(new IdleState());
    }
    
    // Update physics and rotate to face movement direction
    this.velocity.addScaledVector(this.acceleration, deltaTime);
    if (this.velocity.length() > this.topSpeed) {
        this.velocity.setLength(this.topSpeed);
    }
    
    // Calculate next position
    const nextPosition = this.location.clone().addScaledVector(this.velocity, deltaTime);
    
    // Check if next position would hit a wall
    if (bounds.gameMap && bounds.gameMap.isWall(nextPosition.x, nextPosition.z)) {
        // If we would hit a wall, stop movement
        this.velocity.setLength(0);
    } else {
        // If no wall, update position
        this.location.copy(nextPosition);
    }
    
    this.checkBounds(bounds);
    
    // Only update rotation when moving significantly
    if (this.velocity.length() > 0.1) {
        const angle = Math.atan2(this.velocity.x, this.velocity.z);
        this.gameObject.rotation.y = angle;
        
        // Update the forward vector (pointy part direction)
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