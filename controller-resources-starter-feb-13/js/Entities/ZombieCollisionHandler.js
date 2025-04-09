import * as THREE from 'three';

export class ZombieCollisionHandler {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.params = {
            lookAhead: 10,        // Distance to look ahead
            whiskerAngle: Math.PI/6, // 30 degrees
            whiskerLength: 5      // Length of side whiskers
        };
    }

    detectCollision(position, ray) {
        const endPoint = position.clone().add(ray);
        return this.gameMap.isWallNearby(position, ray.normalize(), ray.length());
    }

    getAvoidanceForce(zombie) {
        // Create center and side whiskers
        const center = zombie.velocity.clone().normalize().multiplyScalar(this.params.lookAhead);
        const whisker1 = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), this.params.whiskerAngle);
        const whisker2 = center.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -this.params.whiskerAngle);

        // Set side whisker lengths
        whisker1.setLength(this.params.whiskerLength);
        whisker2.setLength(this.params.whiskerLength);

        // Check collisions
        const centerHit = this.detectCollision(zombie.position, center);
        const whisker1Hit = this.detectCollision(zombie.position, whisker1);
        const whisker2Hit = this.detectCollision(zombie.position, whisker2);

        // Calculate avoidance force
        const avoidanceForce = new THREE.Vector3();

        if (centerHit || whisker1Hit || whisker2Hit) {
            if (centerHit) {
                // Turn perpendicular to the wall
                avoidanceForce.add(new THREE.Vector3(-center.z, 0, center.x));
            }
            if (whisker1Hit) {
                avoidanceForce.sub(whisker1);
            }
            if (whisker2Hit) {
                avoidanceForce.sub(whisker2);
            }

            avoidanceForce.normalize();
        }

        return {
            force: avoidanceForce,
            isAvoiding: centerHit || whisker1Hit || whisker2Hit
        };
    }

    checkCollision(position, velocity, deltaTime) {
        const nextPosition = position.clone().add(velocity.clone().multiplyScalar(deltaTime));
        return {
            willCollide: this.gameMap.isWall(nextPosition.x, nextPosition.z),
            nextPosition: nextPosition
        };
    }
}
