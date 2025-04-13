import { IdleState, ApproachState, AttackState, DeathState } from './ZombieStates.js';

export class ZombieStateManager {
    constructor(zombie, healthManager) {
        this.zombie = zombie;
        this.healthManager = healthManager;
        this.currentState = new IdleState();
        this.attackRange = 30;
        this.detectionRange = 300;
        this.maxChaseDistance = 200;
        this.damageTimer = 0;
        this.damageCooldown = 1000; // 1 second cooldown
        this.damageAmount = 5;
    }

    update(playerPosition, playerAttacking, currentPath, healthManager, deltaTime) {
        // Update damage timer
        if (this.damageTimer > 0) {
            this.damageTimer -= deltaTime * 1000; // Convert to milliseconds
        }
        
        // Check if player is attacking and within range
        if (playerAttacking && this.getPathDistance(currentPath) <= this.attackRange) {
            // Reduce hit points
            this.zombie.hitPoints = this.zombie.hitPoints - 1;
            console.log("Hitpoints left: " + this.zombie.hitPoints);
            
            // Update health bar if it exists
            if (this.zombie.healthBar) {
                this.zombie.healthBar.updateHealth(this.zombie.hitPoints);
            }
            
            if (this.zombie.hitPoints <= 0) {
                this.currentState = new DeathState();
                return this.currentState.enterState(this.zombie);
            }
        }

        const stateUpdate = this.currentState.updateState(this.zombie, playerPosition, currentPath);

        // Handle zombie attacking player
        if (stateUpdate.animation === 'Attack' && this.damageTimer <= 0) {
            healthManager.damagePlayer(this.damageAmount);
            this.damageTimer = this.damageCooldown;
        }

        return stateUpdate;
    }

    getPathDistance(path) {
        return this.currentState.getPathDistance(path);
    }
}