import * as THREE from 'three';
import { ZombieBaseState } from './ZombieBaseState.js';

// Define attack range directly instead of using zombie.attackRange
const attackRange = 20.0; // Adjust this value as needed

export class IdleState extends ZombieBaseState {
    enterState(zombie) {
        console.log("ZombieStates.js: State changed to IDLE");
        return { animation: 'Idle' };
    }

    updateState(zombie, playerPosition, currentPath) {
        const pathDistance = this.getPathDistance(currentPath);
        if (pathDistance <= zombie.state.detectionRange) {

            zombie.state.currentState = new ApproachState();
            return zombie.state.currentState.enterState(zombie);
        }

        return {
            animation: 'Idle',
            shouldMove: false,
            shouldPathFind: false,
            pathDistance
        };
    }
}

export class ApproachState extends ZombieBaseState {
    enterState(zombie) {
        console.log("ZombieStates.js: State changed to APPROACH");
        return { animation: 'Walk' };
    }

    updateState(zombie, playerPosition, currentPath) {
        const pathDistance = this.getPathDistance(currentPath);
        const zombiePosition = zombie.position;
        
        // Calculate distance using only X and Z coordinates (ignoring height)
        const xDiff = zombiePosition.x - playerPosition.x;
        const zDiff = zombiePosition.z - playerPosition.z;
        const xzDistance = Math.sqrt(xDiff * xDiff + zDiff * zDiff);
        
        
        
        if (xzDistance <= attackRange) {

            console.log("ZombieStates.js: Changing state to ATTACK.");
            return new AttackState().enterState(zombie);
        }

        if (xzDistance > zombie.state.maxChaseDistance) {
            return new IdleState().enterState(zombie);
        }

        return {
            animation: 'Walk',
            shouldMove: true,
            shouldPathFind: true,
            pathDistance
        };
    }
}

export class AttackState extends ZombieBaseState {
    enterState(zombie) {
        console.log("ZombieStates.js: State changed to ATTACK");
        return { animation: 'Attack' };
    }

    updateState(zombie, playerPosition, currentPath) {
        const pathDistance = this.getPathDistance(currentPath);
        const zombiePosition = zombie.position;
        
        // Calculate distance using only X and Z coordinates (ignoring height)
        const xDiff = zombiePosition.x - playerPosition.x;
        const zDiff = zombiePosition.z - playerPosition.z;
        const xzDistance = Math.sqrt(xDiff * xDiff + zDiff * zDiff);
        
        if (xzDistance > zombie.attackRange) {
            return new ApproachState().enterState(zombie);
        }

        if(zombie.hitPoints <= 0 && xzDistance <= zombie.attackRange) {
            return new DeathState().enterState(zombie);
        }

        return {
            animation: 'Attack',
            shouldMove: false,
            shouldPathFind: false,
            pathDistance
        };
    }
}

export class DeathState extends ZombieBaseState {
    enterState(zombie) {
        console.log("ZombieStates.js: State changed to DEATH");
        return { animation: 'Death' };
    }

    updateState(zombie, playerPosition, currentPath) {
        return {
            animation: 'Death',
            shouldMove: false,
            shouldPathFind: false,
            clearPath: true
        };
    }
}
