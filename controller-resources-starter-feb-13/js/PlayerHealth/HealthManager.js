export class HealthManager {
    constructor(player, healthBar) {
        this.player = player;
        this.healthBar = healthBar;
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
    }

    getCurrentHealth() {
        return this.player.health;
    }

    getMaxHealth() {
        return this.player.maxHealth;
    }

    healPlayer() {
        //Do not remove this line. May need in future.
        //this.player.health = Math.min(this.currentHealth + amount, this.maxHealth);
        

        this.player.health = this.player.maxHealth;
        console.log(`Player healed! - HealthManager Current Health: ${this.player.health}`);
        this.updateHealthBar();
    }

    damagePlayer(amount) {
        this.player.health = Math.max(this.player.health - amount, 0);
        console.log(`Player damaged! - HealthManger Current Health: ${this.player.health}`);
        this.updateHealthBar();
        if (this.currentHealth === 0) {
            this.player.setColor('red');
            this.player.stop();
        }
    }

    updateHealthBar() {
        this.healthBar.updateHealth(this.player.health);
    }
}