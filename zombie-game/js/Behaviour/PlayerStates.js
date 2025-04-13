import { State } from './State.js';
import * as THREE from 'three';

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

export class AttackState extends State {
  enterState(player) {
    // Play the Attack animation when entering the attack state
    if (player.actions && player.actions['Attack']) {
      // Set attack animation to play only once
      player.actions['Attack'].setLoop(THREE.LoopOnce);
      player.actions['Attack'].clampWhenFinished = false;
      
      // Set up the event listener for when the animation completes
      player.mixer.addEventListener('finished', this.onAttackComplete.bind(this));
      
      // Play the animation
      player.playAnimation('Attack', true); // Immediate transition to attack
    }
    console.log("Player state changed to ATTACK");
  }

  updateState(player, controller) {
    // During attack, player shouldn't move
    player.velocity.set(0, 0, 0);
  }
  
  onAttackComplete(event) {
    // This will be called when the attack animation finishes
    // Get the player from the event's mixer's root object
    const player = event.target.getRoot().userData.player;
    
    // Remove the event listener to avoid memory leaks
    player.mixer.removeEventListener('finished', this.onAttackComplete);
    
    // Clear attacking flag
    player.isAttacking = false;
    
    // Return to previous state (idle or moving)
    if (player.wasMoving) {
      player.switchState(new MovingState());
    } else {
      player.switchState(new IdleState());
    }
  }
}