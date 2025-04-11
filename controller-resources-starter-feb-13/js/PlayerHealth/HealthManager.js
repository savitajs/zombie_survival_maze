export class HealthManager {
    constructor(player, healthBar) {
        this.player = player;
        this.healthBar = healthBar;
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
    }

    getCurrentHealth() {
        return this.currentHealth;
    }

    getMaxHealth() {
        return this.maxHealth;
    }

    healPlayer(amount) {
        this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
        this.updateHealthBar();
    }

    damagePlayer(amount) {
        this.currentHealth = Math.max(this.currentHealth - amount, 0);
        this.updateHealthBar();
        if (this.currentHealth === 0) {
            this.player.setColor('red');
            this.player.stop();
        }
    }

    updateHealthBar() {
        this.healthBar.setHealth(this.currentHealth);
    }
}