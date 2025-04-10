export class HealthManager {
    constructor(healthBar, player) {
        this.healthBar = healthBar;
        this.player = player;
        this.damageInterval = 500;
        this.lastDamageTime = Date.now();
        this.damageAmount = 10;
        console.log('HealthManager initialized with health:', player.getTotalHealth());
    }

    handleZombieAttack() {
        const currentTime = Date.now();
        // Always log current health in attack mode
        console.log('Attack Mode - Current Health:', this.player.getTotalHealth());
        
        if (currentTime - this.lastDamageTime >= this.damageInterval) {
            const currentHealth = this.player.getTotalHealth();
            const newHealth = Math.max(0, currentHealth - this.damageAmount);
            this.player.setTotalHealth(newHealth);
            this.healthBar.updateHealth(newHealth);
            this.lastDamageTime = currentTime;
            console.log('Damage dealt! Health reduced to:', newHealth);
            return true;
        }
        return false;
    }

    getCurrentHealth() {
        return this.player.getTotalHealth();
    }
}
