export class HealthBar {
    constructor(maxHealth) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;

        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.bottom = '20px';
        this.element.style.left = '20px';
        this.element.style.width = '200px';
        this.element.style.height = '20px';
        this.element.style.backgroundColor = 'red';
        this.element.style.border = '1px solid black';
        document.body.appendChild(this.element);

        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = 'green';
        this.element.appendChild(this.healthBar);
    }

    updateHealth(health) {
        this.currentHealth = health;
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercentage}%`;
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}