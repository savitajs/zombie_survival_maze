import * as THREE from 'three';

export class WhiskerDebug {
    constructor(scene) {
        this.scene = scene;
        
        // Create debug lines for whiskers
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        this.centerLine = new THREE.Line(geometry.clone(), material.clone());
        this.leftLine = new THREE.Line(geometry.clone(), material.clone());
        this.rightLine = new THREE.Line(geometry.clone(), material.clone());
        
        this.scene.add(this.centerLine);
        this.scene.add(this.leftLine);
        this.scene.add(this.rightLine);

        // Add detection radius visualization
        const circleGeometry = new THREE.CircleGeometry(1, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.2
        });
        this.detectionCircle = new THREE.Mesh(circleGeometry, circleMaterial);
        this.detectionCircle.rotation.x = -Math.PI / 2; // Lay flat
        scene.add(this.detectionCircle);
    }

    updateWhiskers(start, center, left, right, collisions) {
        // Update line positions
        this.setLinePoints(this.centerLine, start, center);
        this.setLinePoints(this.leftLine, start, left);
        this.setLinePoints(this.rightLine, start, right);

        // Set individual colors for each whisker
        this.centerLine.material.color.setHex(collisions.center ? 0xff0000 : 0x00ff00);
        this.leftLine.material.color.setHex(collisions.left ? 0xff0000 : 0x00ff00);
        this.rightLine.material.color.setHex(collisions.right ? 0xff0000 : 0x00ff00);
    }

    updateDetectionRadius(position, radius) {
        this.detectionCircle.position.copy(position);
        this.detectionCircle.scale.setScalar(radius);
    }

    setLinePoints(line, start, end) {
        const positions = new Float32Array([
            start.x, start.y, start.z,
            end.x, end.y, end.z
        ]);
        line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        line.geometry.attributes.position.needsUpdate = true;
    }

    remove() {
        this.scene.remove(this.centerLine);
        this.scene.remove(this.leftLine);
        this.scene.remove(this.rightLine);
        this.scene.remove(this.detectionCircle);
    }
}
