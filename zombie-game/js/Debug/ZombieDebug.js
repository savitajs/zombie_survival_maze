import * as THREE from 'three';

export class WhiskerDebug {
    constructor(scene) {
        this.scene = scene;
        this.visible = false; // Start with whiskers hidden
        
        // Create debug lines for whiskers
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        this.centerLine = new THREE.Line(geometry.clone(), material.clone());
        this.leftLine = new THREE.Line(geometry.clone(), material.clone());
        this.rightLine = new THREE.Line(geometry.clone(), material.clone());
        
        // Create diagonal whiskers
        this.leftDiagLine = new THREE.Line(geometry.clone(), material.clone());
        this.rightDiagLine = new THREE.Line(geometry.clone(), material.clone());

        // Add all whiskers to scene but set visibility to false initially
        this.scene.add(this.centerLine);
        this.scene.add(this.leftLine);
        this.scene.add(this.rightLine);
        this.scene.add(this.leftDiagLine);
        this.scene.add(this.rightDiagLine);
        
        // Hide all lines initially
        this.setWhiskersVisibility(false);

        // Add detection radius visualization
        const circleGeometry = new THREE.CircleGeometry(1, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.2
        });
        this.detectionCircle = new THREE.Mesh(circleGeometry, circleMaterial);
        this.detectionCircle.rotation.x = -Math.PI / 2; // Lay flat
        this.detectionCircle.visible = false; // Hide initially
        scene.add(this.detectionCircle);
        
        // Add key listener for C key to toggle whisker visibility
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleKeyDown(event) {
        if (event.key === 'c' || event.key === 'C') {
            this.toggleVisibility();
            console.log(`Whisker debug visibility: ${this.visible ? 'ON' : 'OFF'}`);
        }
    }
    
    toggleVisibility() {
        this.visible = !this.visible;
        this.setWhiskersVisibility(this.visible);
        this.detectionCircle.visible = this.visible;
    }
    
    setWhiskersVisibility(isVisible) {
        this.centerLine.visible = isVisible;
        this.leftLine.visible = isVisible;
        this.rightLine.visible = isVisible;
        this.leftDiagLine.visible = isVisible;
        this.rightDiagLine.visible = isVisible;
    }

    updateWhiskers(start, center, left, right, collisions) {
        // Don't update if not visible (performance optimization)
        if (!this.visible) return;
        
        // Update line positions
        this.setLinePoints(this.centerLine, start, center);
        this.setLinePoints(this.leftLine, start, left);
        this.setLinePoints(this.rightLine, start, right);
        
        // Set individual colors for each whisker
        this.centerLine.material.color.setHex(collisions.center ? 0xff0000 : 0x00ff00);
        this.leftLine.material.color.setHex(collisions.left ? 0xff0000 : 0x00ff00);
        this.rightLine.material.color.setHex(collisions.right ? 0xff0000 : 0x00ff00);
        
        // Update diagonal whiskers if provided
        if (collisions.leftDiag !== undefined) {
            const leftDiagEnd = new THREE.Vector3().addVectors(start, collisions.leftDiag.ray);
            this.setLinePoints(this.leftDiagLine, start, leftDiagEnd);
            this.leftDiagLine.material.color.setHex(collisions.leftDiag.hit ? 0xff0000 : 0x00ff00);
            
            const rightDiagEnd = new THREE.Vector3().addVectors(start, collisions.rightDiag.ray);
            this.setLinePoints(this.rightDiagLine, start, rightDiagEnd);
            this.rightDiagLine.material.color.setHex(collisions.rightDiag.hit ? 0xff0000 : 0x00ff00);
        }
    }

    updateDetectionRadius(position, radius) {
        if (!this.visible) return;
        
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
        this.scene.remove(this.leftDiagLine);
        this.scene.remove(this.rightDiagLine);
        this.scene.remove(this.detectionCircle);
        
        // Remove key listener
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}
