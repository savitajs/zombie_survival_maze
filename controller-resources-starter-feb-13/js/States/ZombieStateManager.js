import { IdleState, ApproachState, AttackState, DeathState } from './ZombieStates.js';

export class ZombieStateManager {
    constructor(zombie) {
        this.zombie = zombie;
        this.currentState = new IdleState();
        this.hitPoints = 5;
        this.attackRange = 30;
        this.detectionRange = 300;
        this.maxChaseDistance = 200;
    }

    update(playerPosition, playerAttacking, currentPath) {
        if (playerAttacking && this.getPathDistance(currentPath) <= this.attackRange) {
            this.hitPoints--;
            if (this.hitPoints <= 0) {
                this.currentState = new DeathState();
                return this.currentState.enterState(this.zombie);
            }
        }

        return this.currentState.updateState(this.zombie, playerPosition, currentPath);
    }

    getPathDistance(path) {
        return this.currentState.getPathDistance(path);
    }
}