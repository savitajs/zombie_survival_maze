export class ZombieState {
    static States = {
        IDLE: 'idle',
        APPROACH: 'approach',
        ATTACK: 'attack',
        DEATH: 'death'
    };

    constructor(zombie) {
        this.zombie = zombie;
        this.currentState = ZombieState.States.IDLE;
        this.hitPoints = 5; // Takes 5 hits to kill
        this.attackRange = 5;
        this.detectionRange = 300;
        this.maxChaseDistance = 200; // Maximum distance before returning to idle
    }

    getPathDistance(path) {
        if (!path || path.length < 2) return Infinity;

        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            totalDistance += current.distanceTo(next);
        }
        return totalDistance;
    }

    update(playerPosition, playerAttacking, currentPath) {
        if (this.currentState === ZombieState.States.DEATH) {
            return { 
                animation: 'death', 
                shouldMove: false,
                shouldPathFind: false,
                clearPath: true // Add flag to clear debug path
            };
        }

        // Use path distance instead of direct distance
        const pathDistance = this.getPathDistance(currentPath);
        
        // Return to idle if path distance exceeds maximum chase distance
        if (pathDistance > this.maxChaseDistance && 
            this.currentState === ZombieState.States.APPROACH) {
            this.currentState = ZombieState.States.IDLE;
            return {
                animation: 'idle',
                shouldMove: false,
                shouldPathFind: false,
                pathDistance: pathDistance,
                clearPath: true // Add flag to clear debug path when returning to idle
            };
        }

        // Handle player attack
        if (playerAttacking && pathDistance <= this.attackRange) {
            this.hitPoints--;
            if (this.hitPoints <= 0) {
                this.currentState = ZombieState.States.DEATH;
                return { 
                    animation: 'death', 
                    shouldMove: false,
                    shouldPathFind: false,
                    clearPath: true // Add flag to clear debug path
                };
            }
        }

        // State transitions
        switch (this.currentState) {
            case ZombieState.States.IDLE:
                if (pathDistance <= this.detectionRange) {
                    this.currentState = ZombieState.States.APPROACH;
                }
                return { 
                    animation: 'idle', 
                    shouldMove: false,
                    shouldPathFind: false,
                    pathDistance: pathDistance,
                    clearPath: true // Add flag to clear debug path in idle state
                };

            case ZombieState.States.APPROACH:
                if (pathDistance <= this.attackRange) {
                    this.currentState = ZombieState.States.ATTACK;
                }
                return { 
                    animation: 'walk', 
                    shouldMove: true,
                    shouldPathFind: true,
                    pathDistance: pathDistance
                };

            case ZombieState.States.ATTACK:
                if (pathDistance > this.attackRange) {
                    this.currentState = ZombieState.States.APPROACH;
                    return { 
                        animation: 'walk', 
                        shouldMove: true,
                        shouldPathFind: true,
                        pathDistance: pathDistance
                    };
                }
                return { 
                    animation: 'attack', 
                    shouldMove: false,
                    shouldPathFind: false,
                    pathDistance: pathDistance
                };
        }
    }
}
