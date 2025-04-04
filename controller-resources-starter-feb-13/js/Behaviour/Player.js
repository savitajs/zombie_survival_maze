import { Character } from './Character.js';
import { State } from './State';
import * as THREE from 'three';

export class Player extends Character {
  constructor(color) {
    super(color);
    
    // Create larger cone
    const geometry = new THREE.ConeGeometry(2, 4, 8);
    const material = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    this.gameObject = new THREE.Mesh(geometry, material);
    this.gameObject.rotation.x = Math.PI / 2;
    
    this.location = this.gameObject.position;
    this.size = 4;
    this.moveSpeed = 15;

    this.state = new IdleState();
    this.state.enterState(this);

    // Add default move vector
    this.moveVector = new THREE.Vector3();
  }

  switchState(state) {
    this.state = state;
    this.state.enterState(this);
  }

  update(deltaTime, bounds, controller) {
    super.update(deltaTime, bounds);
    
    // Safe check for controller and moveVector
    if (controller && controller.moveVector) {
      this.moveVector.copy(controller.moveVector);
      
      if (this.moveVector.length() > 0) {
        this.gameObject.rotation.y = Math.atan2(this.moveVector.x, this.moveVector.z);
      }
    }
  }
}

export class IdleState extends State {

  enterState(player) {

  }

  updateState(player, controller) {

  }

}

export class MovingState extends State {
  
  enterState(player) {

  }

  updateState(player, controller) {

  }

}