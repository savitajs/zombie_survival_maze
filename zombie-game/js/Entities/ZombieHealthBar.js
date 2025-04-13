import * as THREE from 'three';

export class ZombieHealthBar {
    constructor(maxHealth, scene, zombie) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.scene = scene;
        this.zombie = zombie;
        
        // Health bar container
        this.container = new THREE.Object3D();
        scene.add(this.container);
        
        // Health bar background (dark grey) - INCREASED SIZE
        const bgGeometry = new THREE.PlaneGeometry(2.5, 0.35); // Wider and taller
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        this.background = new THREE.Mesh(bgGeometry, bgMaterial);
        this.container.add(this.background);
        
        // Health bar foreground (initially green for full health) - INCREASED SIZE
        const barGeometry = new THREE.PlaneGeometry(2.5, 0.35); // Matching background size
        const barMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Start with green
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        this.healthBar.position.z = 0.01; // Slightly in front of background
        this.container.add(this.healthBar);
        
        // Initial update
        this.updateHealth(this.currentHealth);
    }
    
    updateHealth(newHealth) {
        this.currentHealth = Math.max(0, Math.min(newHealth, this.maxHealth));
        
        // Update health bar width based on health ratio
        const healthRatio = this.currentHealth / this.maxHealth;
        this.healthBar.scale.x = healthRatio;
        this.healthBar.position.x = (healthRatio - 1) / 2 * 2.5; // Adjust based on new width
        
        // Change color based on health percentage
        if (healthRatio > 0.5) {
            this.healthBar.material.color.setHex(0x00ff00); // Green
        } else if (healthRatio > 0.25) {
            this.healthBar.material.color.setHex(0xffff00); // Yellow
        } else {
            this.healthBar.material.color.setHex(0xff0000); // Red
        }
    }
    
    update() {
        if (!this.zombie || !this.zombie.model) return;
        
        // Position the health bar above the zombie
        const zombieBox = new THREE.Box3().setFromObject(this.zombie.model);
        const height = zombieBox.max.y - zombieBox.min.y;
        
        this.container.position.set(
            this.zombie.position.x,
            zombieBox.max.y - 0.2, // Positioned closer to the head (was + 0.5)
            this.zombie.position.z
        );
        
        // Make health bar face the camera - get camera from scene globals
        if (window.camera) {
            this.container.quaternion.copy(window.camera.quaternion);
        }
    }
    
    remove() {
        this.scene.remove(this.container);
    }
}