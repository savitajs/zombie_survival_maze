import * as THREE from 'three';
import { Character } from './Character.js';
import { VectorUtil } from '../Util/VectorUtil.js';

export class ZombieAI extends Character {
    constructor(color) {
        super(color || new THREE.Color(0x00ff00));
        this.maxForce = 10;
        this.topSpeed = 15;
        
        // Flocking parameters
        this.perceptionRadius = 20;
        this.separationWeight = 1.5;
        this.alignmentWeight = 1.0;
        this.cohesionWeight = 1.0;
        this.seekWeight = 1.2;
    }

    update(deltaTime, bounds, flowField, target, zombies) {
        // Calculate flocking forces
        const separation = this.separate(zombies).multiplyScalar(this.separationWeight);
        const alignment = this.align(zombies).multiplyScalar(this.alignmentWeight);
        const cohesion = this.cohesion(zombies).multiplyScalar(this.cohesionWeight);
        
        // Get flow direction (seeking force) from flowfield
        const seeking = flowField.getFlowDirection(this.location)
            .multiplyScalar(this.topSpeed)
            .sub(this.velocity)
            .multiplyScalar(this.seekWeight);

        // Apply all forces
        this.applyForce(separation);
        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(seeking);

        super.update(deltaTime, bounds);
    }

    separate(zombies) {
        let steering = new THREE.Vector3();
        let total = 0;

        zombies.forEach(zombie => {
            if(zombie !== this) {
                let d = this.location.distanceTo(zombie.location);
                if(d < this.perceptionRadius) {
                    let diff = VectorUtil.sub(this.location, zombie.location);
                    diff.divideScalar(d); // Weight by distance
                    steering.add(diff);
                    total++;
                }
            }
        });

        if(total > 0) {
            steering.divideScalar(total);
            steering.setLength(this.topSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, this.maxForce);
        }

        return steering;
    }

    align(zombies) {
        let steering = new THREE.Vector3();
        let total = 0;

        zombies.forEach(zombie => {
            if(zombie !== this) {
                let d = this.location.distanceTo(zombie.location);
                if(d < this.perceptionRadius) {
                    steering.add(zombie.velocity);
                    total++;
                }
            }
        });

        if(total > 0) {
            steering.divideScalar(total);
            steering.setLength(this.topSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, this.maxForce);
        }

        return steering;
    }

    cohesion(zombies) {
        let steering = new THREE.Vector3();
        let total = 0;

        zombies.forEach(zombie => {
            if(zombie !== this) {
                let d = this.location.distanceTo(zombie.location);
                if(d < this.perceptionRadius) {
                    steering.add(zombie.location);
                    total++;
                }
            }
        });

        if(total > 0) {
            steering.divideScalar(total);
            steering.sub(this.location);
            steering.setLength(this.topSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, this.maxForce);
        }

        return steering;
    }
}
