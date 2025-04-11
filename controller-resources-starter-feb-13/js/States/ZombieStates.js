import * as THREE from 'three';
import { ZombieBaseState } from './ZombieBaseState.js';

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
        
        if (pathDistance <= zombie.attackRange || !pathDistance) {
            return new AttackState().enterState(zombie);
        }

        if (pathDistance > zombie.state.maxChaseDistance) {
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
        return { animation: 'Attak' };
    }

    updateState(zombie, playerPosition, currentPath) {
        const pathDistance = this.getPathDistance(currentPath);
        
        if (pathDistance > zombie.attackRange) {
            return new ApproachState().enterState(zombie);
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
