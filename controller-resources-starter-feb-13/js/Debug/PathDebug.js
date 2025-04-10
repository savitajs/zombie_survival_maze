import * as THREE from 'three';

export class PathDebug {
    constructor(scene) {
        this.scene = scene;
        this.pathLine = null;
        this.material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: 3,        // Make line thicker
            transparent: false,   // Make line solid
            depthTest: false     // Make sure line renders on top
        });
    }

    showPath(path) {
        this.clearPath();
        
        if (!path || path.length < 2) return;
        
        const points = path.map(point => new THREE.Vector3(point.x, 15, point.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        this.pathLine = new THREE.Line(geometry, this.material);
        this.scene.add(this.pathLine);
    }

    clearPath() {
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine.geometry.dispose();
            this.pathLine = null;
        }
    }
}
