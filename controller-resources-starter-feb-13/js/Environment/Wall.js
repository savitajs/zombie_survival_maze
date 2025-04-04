import * as THREE from 'three';

export class Wall {
    constructor(width = 10, height = 10, depth = 2) {
        this.width = width;
        this.height = height;
        this.depth = depth;

        // Create wall mesh
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Create collision box
        this.boundingBox = new THREE.Box3();
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
        this.updateBoundingBox();
        return this;
    }

    setRotation(angle) {
        this.mesh.rotation.y = angle;
        this.updateBoundingBox();
        return this;
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }

    intersects(point) {
        return this.boundingBox.containsPoint(point);
    }
}
