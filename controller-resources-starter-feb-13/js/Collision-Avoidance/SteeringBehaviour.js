import * as THREE from 'three';

export class SteeringBehaviour {
    constructor(scene) {
        this.scene = scene;
        this.maxForce = 1.0;       // Maximum steering force
        this.maxSpeed = 2.0;       // Maximum speed
        this.arrivalRadius = 10;   // Radius to start slowing down
        this.separationRadius = 5; // Radius for separation
        this.avoidanceRadius = 8;  // Radius for collision avoidance
    }

    calculateSteering(entity, target, neighbors = []) {
        // Calculate individual forces using Reynolds' algorithms
        const seekForce = this.seek(entity, target);
        const arriveForce = this.arrive(entity, target);
        const separationForce = this.separate(entity, neighbors);
        const avoidanceForce = this.avoid(entity);

        // Combine forces with weights
        const finalForce = new THREE.Vector3()
            .add(seekForce.multiplyScalar(0.4))
            .add(arriveForce.multiplyScalar(0.3))
            .add(separationForce.multiplyScalar(0.5))
            .add(avoidanceForce.multiplyScalar(0.8));

        // Clamp to maximum force
        if (finalForce.length() > this.maxForce) {
            finalForce.normalize().multiplyScalar(this.maxForce);
        }

        return finalForce;
    }

    seek(entity, target) {
        // Desired velocity = normalized(target - position) * maxSpeed
        const desired = new THREE.Vector3()
            .subVectors(target, entity.position)
            .normalize()
            .multiplyScalar(this.maxSpeed);

        // Steering = desired - current velocity
        return desired.sub(entity.velocity || new THREE.Vector3());
    }

    arrive(entity, target) {
        const desired = new THREE.Vector3().subVectors(target, entity.position);
        const distance = desired.length();

        // Speed varies based on distance within arrival radius
        if (distance < this.arrivalRadius) {
            const speed = this.maxSpeed * (distance / this.arrivalRadius);
            desired.normalize().multiplyScalar(speed);
        } else {
            desired.normalize().multiplyScalar(this.maxSpeed);
        }

        return desired.sub(entity.velocity || new THREE.Vector3());
    }

    separate(entity, neighbors) {
        const steering = new THREE.Vector3();
        let neighborCount = 0;

        neighbors.forEach(neighbor => {
            const distance = entity.position.distanceTo(neighbor.position);

            if (distance > 0 && distance < this.separationRadius) {
                const diff = new THREE.Vector3()
                    .subVectors(entity.position, neighbor.position)
                    .normalize()
                    .divideScalar(distance); // Weight by distance
                steering.add(diff);
                neighborCount++;
            }
        });

        if (neighborCount > 0) {
            steering.divideScalar(neighborCount);
            steering.normalize().multiplyScalar(this.maxSpeed);
            steering.sub(entity.velocity || new THREE.Vector3());
            if (steering.length() > this.maxForce) {
                steering.normalize().multiplyScalar(this.maxForce);
            }
        }

        return steering;
    }

    avoid(entity) {
        const ahead = entity.velocity ? entity.velocity.clone().normalize().multiplyScalar(this.avoidanceRadius) : new THREE.Vector3();
        const raycaster = new THREE.Raycaster(entity.position, ahead.normalize());
        
        const obstacles = raycaster.intersectObjects(this.scene.children, true);
        
        if (obstacles.length > 0 && obstacles[0].distance < this.avoidanceRadius) {
            const avoidanceForce = new THREE.Vector3()
                .copy(ahead)
                .normalize()
                .multiplyScalar(this.maxForce);

            // Add lateral force to encourage moving around obstacles
            avoidanceForce.add(new THREE.Vector3(-ahead.z, 0, ahead.x));
            
            return avoidanceForce;
        }
        
        return new THREE.Vector3();
    }
}