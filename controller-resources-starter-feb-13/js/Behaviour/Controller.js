import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

export class Controller {

  // Controller Constructor
  constructor(doc, camera) {
    this.doc = doc;
    this.camera = camera;

    // Add pointer lock for better mouse control
    this.doc.addEventListener('click', () => {
      this.doc.body.requestPointerLock();
    });

    // Initialize moveVector
    this.moveVector = new THREE.Vector3();

    this.left = false;
    this.right = false;
    this.forward = false;
    this.backward = false;

    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDelta = new THREE.Vector2();
    this.isMouseDown = false;

    this.doc.addEventListener('keydown', this);
    this.doc.addEventListener('keyup', this);
    this.doc.addEventListener('mousemove', this);
    this.doc.addEventListener('mousedown', this);
    this.doc.addEventListener('mouseup', this);
    this.doc.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleEvent(event) {
    if (event.type === 'keydown') {
      if (event.code === 'ArrowUp') { this.forward = true; }
      else if (event.code === 'ArrowDown') { this.backward = true; }
      else if (event.code === 'ArrowLeft') { this.left = true; }
      else if (event.code === 'ArrowRight') { this.right = true; }
    }
    
    else if (event.type === 'keyup') {
      if (event.code === 'ArrowUp') { this.forward = false; }
      else if (event.code === 'ArrowDown') { this.backward = false; }
      else if (event.code === 'ArrowLeft') { this.left = false; }
      else if (event.code === 'ArrowRight') { this.right = false; }      
    }

    if (event.type === 'mousemove' && this.isMouseDown) {
      this.mouseDelta.x = event.movementX;
      this.mouseDelta.y = event.movementY;
    }
    else if (event.type === 'mousedown' && event.button === 2) {
      this.isMouseDown = true;
    }
    else if (event.type === 'mouseup' && event.button === 2) {
      this.isMouseDown = false;
      this.mouseDelta.set(0, 0);
    }
  }

}
