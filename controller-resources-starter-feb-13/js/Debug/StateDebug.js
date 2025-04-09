import * as THREE from 'three';

export class StateDebug {
    constructor(scene) {
        this.scene = scene;
        this.stateText = document.createElement('div');
        this.setupStateDisplay();
    }

    setupStateDisplay() {
        this.stateText.style.position = 'absolute';
        this.stateText.style.top = '10px';
        this.stateText.style.left = '10px';
        this.stateText.style.color = 'white';
        this.stateText.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.stateText.style.padding = '10px';
        this.stateText.style.fontFamily = 'Arial';
        this.stateText.style.fontSize = '16px';
        document.body.appendChild(this.stateText);
    }

    updateState(state, distanceToPlayer) {
        let stateColor;
        switch(state) {
            case 'idle':
                stateColor = 'gray';
                break;
            case 'approach':
                stateColor = 'yellow';
                break;
            case 'attack':
                stateColor = 'red';
                break;
            case 'death':
                stateColor = 'black';
                break;
            default:
                stateColor = 'white';
        }

        this.stateText.innerHTML = `
            Zombie State: <span style="color:${stateColor}">${state}</span><br>
            Distance to Player: ${Math.round(distanceToPlayer * 10) / 10} units
        `;
    }

    cleanup() {
        if (this.stateText && this.stateText.parentNode) {
            this.stateText.parentNode.removeChild(this.stateText);
        }
    }
}
