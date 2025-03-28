import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

export class Controller {

  // Controller Constructor
  constructor(doc, camera) {
    this.doc = doc;
    this.camera = camera;

    this.left = false;
    this.right = false;
    this.forward = false;
    this.backward = false;

    this.doc.addEventListener('keydown', this);
    this.doc.addEventListener('keyup', this);
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
  }

}
