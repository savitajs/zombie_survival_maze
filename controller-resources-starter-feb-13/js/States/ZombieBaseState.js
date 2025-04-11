export class ZombieBaseState {
    constructor() {
        if (this.constructor === ZombieBaseState) {
            throw new Error("Abstract class cannot be instantiated");
        }
    }

    enterState(zombie) { throw new Error("Must implement enterState"); }
    updateState(zombie, playerPosition, currentPath) { throw new Error("Must implement updateState"); }
    
    getPathDistance(path) {
        if (!path || path.length === 0) {
            return 0;
        }

        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            totalDistance += current.distanceTo(next);
        }
        return totalDistance;
    }
}
