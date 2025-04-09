export class HealthBar {
    constructor(maxHealth = 100) {
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.element = this.createHealthBar();
    }

    createHealthBar() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.width = '200px';
        container.style.height = '20px';
        container.style.backgroundColor = '#333';
        container.style.border = '2px solid #fff';

        const fill = document.createElement('div');
        fill.style.width = '100%';
        fill.style.height = '100%';
        fill.style.backgroundColor = '#ff0000';
        fill.style.transition = 'width 0.2s ease-in-out';

        const text = document.createElement('div');
        text.style.position = 'absolute';
        text.style.width = '100%';
        text.style.textAlign = 'center';
        text.style.color = 'white';
        text.style.fontFamily = 'Arial';
        text.style.fontSize = '14px';
        text.style.lineHeight = '20px';
        text.textContent = `${this.currentHealth}/${this.maxHealth}`;

        container.appendChild(fill);
        container.appendChild(text);
        document.body.appendChild(container);

        this.fillElement = fill;
        this.textElement = text;
        return container;
    }

    updateHealth(newHealth) {
        this.currentHealth = Math.max(0, Math.min(newHealth, this.maxHealth));
        const percentage = (this.currentHealth / this.maxHealth) * 100;
        this.fillElement.style.width = `${percentage}%`;
        this.textElement.textContent = `${this.currentHealth}/${this.maxHealth}`;

        // Change color based on health percentage
        if (percentage > 60) {
            this.fillElement.style.backgroundColor = '#00ff00'; // Green
        } else if (percentage > 30) {
            this.fillElement.style.backgroundColor = '#ffff00'; // Yellow
        } else {
            this.fillElement.style.backgroundColor = '#ff0000'; // Red
        }
    }

    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
