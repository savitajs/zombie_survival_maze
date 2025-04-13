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
        // Use player's takeDamage method instead of directly setting health
        this.player.takeDamage(amount);
        console.log(`Player damaged! - HealthManager Current Health: ${this.player.health}`);
        this.updateHealthBar();
        
        // Let the player object handle death state
        if (this.player.health <= 0) {
            console.log("Player health at 0 - should trigger death state");
        }
    }

    updateHealthBar() {
        this.healthBar.updateHealth(this.player.health);
    }
}