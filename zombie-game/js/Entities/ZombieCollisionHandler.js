import * as THREE from 'three';

export class ZombieCollisionHandler {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.params = {
            lookAhead: 8,          // Reduced from 12 to 8
            whiskerAngle: Math.PI/4, 
            whiskerLength: 5       // Reduced from 8 to 5
        };
    }

    detectCollision(position, ray) {
        const rayDirection = ray.clone().normalize();
        return this.gameMap.isWallNearby(position, rayDirection, ray.length());
    }

    detectMovingCollision(position, ray, moveDir) {
        const rayDirection = ray.clone().normalize();
        
        // Only detect collision if moving toward the wall (dot product > 0)
        const movingToward = rayDirection.dot(moveDir) > 0;
        
        return movingToward && this.gameMap.isWallNearby(position, rayDirection, ray.length());
    }

    getAvoidanceForce(zombie) {
        // Create center and side whiskers
        const center = zombie.velocity.clone().normalize().multiplyScalar(this.params.lookAhead);
        const whisker1 = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), this.params.whiskerAngle);
        const whisker2 = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -this.params.whiskerAngle);
        
        // Add diagonal whiskers for better corner detection
        const whisker3 = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), this.params.whiskerAngle/2);
        const whisker4 = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -this.params.whiskerAngle/2);

        // Set whisker lengths
        whisker1.setLength(this.params.whiskerLength);
        whisker2.setLength(this.params.whiskerLength);
        whisker3.setLength(this.params.lookAhead * 0.7);
        whisker4.setLength(this.params.lookAhead * 0.7);

        // Check collisions - Only detect walls in the direction zombie is moving
        const zombieDir = zombie.velocity.clone().normalize();
        
        // Only check collisions in direction of movement (dot product > 0)
        const centerHit = this.detectMovingCollision(zombie.position, center, zombieDir);
        const whisker1Hit = this.detectMovingCollision(zombie.position, whisker1, zombieDir);
        const whisker2Hit = this.detectMovingCollision(zombie.position, whisker2, zombieDir);
        const whisker3Hit = this.detectMovingCollision(zombie.position, whisker3, zombieDir);
        const whisker4Hit = this.detectMovingCollision(zombie.position, whisker4, zombieDir);

        // Calculate avoidance force with increased strength
        const avoidanceForce = new THREE.Vector3();

        if (centerHit || whisker1Hit || whisker2Hit || whisker3Hit || whisker4Hit) {
            if (centerHit) {
                // Turn perpendicular to the wall, with stronger force
                const perpendicular = new THREE.Vector3(-center.z, 0, center.x);
                avoidanceForce.add(perpendicular.multiplyScalar(1.5)); // Reduced from 2.0
            }
            if (whisker1Hit) {
                avoidanceForce.sub(whisker1.multiplyScalar(1.2)); // Reduced from 1.5
            }
            if (whisker2Hit) {
                avoidanceForce.sub(whisker2.multiplyScalar(1.2)); // Reduced from 1.5
            }
            if (whisker3Hit) {
                avoidanceForce.sub(whisker3);
            }
            if (whisker4Hit) {
                avoidanceForce.sub(whisker4);
            }

            avoidanceForce.normalize().multiplyScalar(1.5); // Reduced from 2.0
        }

        return {
            force: avoidanceForce,
            isAvoiding: centerHit || whisker1Hit || whisker2Hit || whisker3Hit || whisker4Hit,
            // Add debug info
            whiskerInfo: {
                center: { ray: center, hit: centerHit },
                left: { ray: whisker1, hit: whisker1Hit },
                right: { ray: whisker2, hit: whisker2Hit },
                leftDiag: { ray: whisker3, hit: whisker3Hit },
                rightDiag: { ray: whisker4, hit: whisker4Hit }
            }
        };
    }

    checkCollision(position, velocity, deltaTime) {
        // Calculate next position with velocity
        const nextPosition = position.clone().add(velocity.clone().multiplyScalar(deltaTime));
        
        // Check if next position would be in a wall
        const willCollide = this.gameMap.isWall(nextPosition.x, nextPosition.z);
        
        // If collision detected, try to find valid position by checking multiple points around
        if (willCollide) {
            // Try separating movement into x and z components
            const xOnlyMove = position.clone();
            xOnlyMove.x += velocity.x * deltaTime;
            
            const zOnlyMove = position.clone();
            zOnlyMove.z += velocity.z * deltaTime;
            
            const xCollide = this.gameMap.isWall(xOnlyMove.x, xOnlyMove.z);
            const zCollide = this.gameMap.isWall(zOnlyMove.x, zOnlyMove.z);
            
            // Return the valid movement option or the original position if both collide
            if (!xCollide) {
                return { willCollide: false, nextPosition: xOnlyMove };
            } else if (!zCollide) {
                return { willCollide: false, nextPosition: zOnlyMove };
            }
        }
        
        return {
            willCollide: willCollide,
            nextPosition: willCollide ? position : nextPosition
        };
    }
}
