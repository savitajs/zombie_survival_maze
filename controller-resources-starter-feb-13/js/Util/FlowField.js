import * as THREE from 'three';

export class FlowField {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.floor(width / cellSize);
        this.rows = Math.floor(height / cellSize);
        
        // Initialize flow field grid
        this.grid = new Array(this.cols * this.rows).fill(null)
            .map(() => new THREE.Vector3());
        
        // Debug visualization
        this.debugMesh = this.createDebugMesh();
    }

    createDebugMesh() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Create debug arrows for each cell
        for(let i = 0; i < this.cols; i++) {
            for(let j = 0; j < this.rows; j++) {
                const x = i * this.cellSize - this.width/2;
                const z = j * this.cellSize - this.height/2;
                positions.push(x, 0.1, z, x + this.cellSize/2, 0.1, z + this.cellSize/2);
                colors.push(0, 1, 0, 0, 0.5, 0);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({ vertexColors: true });
        return new THREE.LineSegments(geometry, material);
    }

    worldToGrid(worldPos) {
        const x = Math.floor((worldPos.x + this.width/2) / this.cellSize);
        const z = Math.floor((worldPos.z + this.height/2) / this.cellSize);
        return { x: THREE.MathUtils.clamp(x, 0, this.cols-1), 
                z: THREE.MathUtils.clamp(z, 0, this.rows-1) };
    }

    getFlowDirection(worldPos) {
        const gridPos = this.worldToGrid(worldPos);
        return this.grid[gridPos.z * this.cols + gridPos.x];
    }

    update(target) {
        const targetGrid = this.worldToGrid(target);

        for(let i = 0; i < this.cols; i++) {
            for(let j = 0; j < this.rows; j++) {
                const dx = targetGrid.x - i;
                const dz = targetGrid.z - j;
                const direction = new THREE.Vector3(dx, 0, dz).normalize();
                this.grid[j * this.cols + i].copy(direction);
            }
        }

        this.updateDebugMesh();
    }

    updateDebugMesh() {
        const positions = this.debugMesh.geometry.attributes.position.array;
        for(let i = 0; i < this.cols; i++) {
            for(let j = 0; j < this.rows; j++) {
                const idx = (j * this.cols + i) * 6;
                const direction = this.grid[j * this.cols + i];
                const x = i * this.cellSize - this.width/2;
                const z = j * this.cellSize - this.height/2;
                positions[idx] = x;
                positions[idx+1] = 0.1;
                positions[idx+2] = z;
                positions[idx+3] = x + direction.x * this.cellSize;
                positions[idx+4] = 0.1;
                positions[idx+5] = z + direction.z * this.cellSize;
            }
        }
        this.debugMesh.geometry.attributes.position.needsUpdate = true;
    }
}
