import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class HealthPack {
    constructor(scene, position, id) {
        this.scene = scene;
        this.position = position;
        this.id = id;
        this.used = false;
        this.model = null;
        
        // Load the health pack model
        const loader = new GLTFLoader();
        loader.load(
            './models/health_pack.glb',
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(5, 5, 5);
                this.model.position.copy(this.position);
                this.model.position.y = 25;  // Height is set to 20 units
                this.scene.add(this.model);
                
                console.log(`Health Pack ${this.id} loaded at:`, {
                    x: Math.round(this.position.x * 100) / 100,
                    y: Math.round(this.position.y * 100) / 100,
                    z: Math.round(this.position.z * 100) / 100
                });
            },
            undefined,
            (error) => console.error('Error loading health pack:', error)
        );
    }

    collect() {
        if (!this.used) {
            this.used = true;
            if (this.model) {
                this.model.visible = false;
                console.log(`Health Pack ${this.id} collected!`);
            }
            return true;
        }
        return false;
    }

    remove() {
        if (this.model) {
            this.scene.remove(this.model);
        }
    }
}
