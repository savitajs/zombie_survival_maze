export default class GameObject {
    constructor(position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 }) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.mesh = null; // Placeholder for 3D model or mesh
    }

    async loadGLBModel(glbFilePath, loader) {
        return new Promise((resolve, reject) => {
            loader.load(
                glbFilePath,
                (gltf) => {
                    this.mesh = gltf.scene;
                    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
                    this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
                    this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
                    resolve(this.mesh);
                },
                undefined,
                (error) => {
                    console.error(`Error loading GLB model: ${error}`);
                    reject(error);
                }
            );
        });
    }

    update(deltaTime) {
        // Override this method in subclasses to define behavior
    }
}