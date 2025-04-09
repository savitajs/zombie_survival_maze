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
        this.detectionRange = 50;
    }

    update(playerPosition, playerAttacking) {
        if (this.currentState === ZombieState.States.DEATH) {
            return { 
                animation: 'death', 
                shouldMove: false,
                shouldPathFind: false 
            };
        }

        // Calculate direct Euclidean distance ignoring y-axis
        const distanceToPlayer = Math.sqrt(
            Math.pow(this.zombie.position.x - playerPosition.x, 2) + 
            Math.pow(this.zombie.position.z - playerPosition.z, 2)
        );

        // Handle player attack
        if (playerAttacking && distanceToPlayer <= this.attackRange) {
            this.hitPoints--;
            if (this.hitPoints <= 0) {
                this.currentState = ZombieState.States.DEATH;
                return { 
                    animation: 'death', 
                    shouldMove: false,
                    shouldPathFind: false 
                };
            }
        }

        // State transitions
        switch (this.currentState) {
            case ZombieState.States.IDLE:
                if (distanceToPlayer <= this.detectionRange) {
                    this.currentState = ZombieState.States.APPROACH;
                }
                return { 
                    animation: 'idle', 
                    shouldMove: false,
                    shouldPathFind: false 
                };

            case ZombieState.States.APPROACH:
                if (distanceToPlayer <= this.attackRange) {
                    this.currentState = ZombieState.States.ATTACK;
                }
                return { 
                    animation: 'walk', 
                    shouldMove: true,
                    shouldPathFind: true  // Enable pathfinding during approach
                };

            case ZombieState.States.ATTACK:
                if (distanceToPlayer > this.attackRange) {
                    this.currentState = ZombieState.States.APPROACH;
                    return { 
                        animation: 'walk', 
                        shouldMove: true,
                        shouldPathFind: true 
                    };
                }
                return { 
                    animation: 'attack', 
                    shouldMove: false,
                    shouldPathFind: false 
                };
        }
    }
}
