import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

export class Controller {

  // Controller Constructor
  constructor(doc, camera) {
    this.doc = doc;
    this.camera = camera;

    // Initialize moveVector
    this.moveVector = new THREE.Vector3();
    // For force-based movement
    this.moveForce = new THREE.Vector3();
    this.forceMultiplier = 20; // Adjust force strength

    // Movement keys state
    this.left = false;
    this.right = false;
    this.forward = false;
    this.backward = false;
    
    // Camera control keys
    this.cameraPanLeft = false;
    this.cameraPanRight = false;
    this.cameraPanUp = false;
    this.cameraPanDown = false;
    this.cameraZoomIn = false;
    this.cameraZoomOut = false;
    this.toggleCameraMode = false;

    // Mouse tracking for camera control
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDelta = new THREE.Vector2();
    this.mouseSensitivity = 0.005;
    
    // Flag to enable/disable mouse camera control
    this.mouseControlEnabled = true;
    this.rightMouseDown = false;

    // Set up event listeners
    this.doc.addEventListener('keydown', this.handleEvent.bind(this));
    this.doc.addEventListener('keyup', this.handleEvent.bind(this));
    this.doc.addEventListener('mousemove', this.handleEvent.bind(this));
    this.doc.addEventListener('mousedown', this.handleEvent.bind(this));
    this.doc.addEventListener('mouseup', this.handleEvent.bind(this));
    this.doc.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Add a key to toggle mouse control mode
    this.doc.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.mouseControlEnabled = !this.mouseControlEnabled;
        console.log(`Mouse camera control ${this.mouseControlEnabled ? 'enabled' : 'disabled'}`);
      }
    });
  }

  handleEvent(event) {
    if (event.type === 'keydown') {
      // Movement keys
      if (event.code === 'KeyW' || event.code === 'ArrowUp') { this.forward = true; }
      else if (event.code === 'KeyS' || event.code === 'ArrowDown') { this.backward = true; }
      else if (event.code === 'KeyA' || event.code === 'ArrowLeft') { this.left = true; }
      else if (event.code === 'KeyD' || event.code === 'ArrowRight') { this.right = true; }
      
      // Camera control keys
      else if (event.code === 'KeyP') { this.toggleCameraMode = true; }
      
      // Free camera movement keys (when in free camera mode)
      else if (event.code === 'KeyI') { this.cameraPanUp = true; }
      else if (event.code === 'KeyK') { this.cameraPanDown = true; }
      else if (event.code === 'KeyJ') { this.cameraPanLeft = true; }
      else if (event.code === 'KeyL') { this.cameraPanRight = true; }
      else if (event.code === 'Equal' || event.code === 'NumpadAdd') { this.cameraZoomIn = true; }
      else if (event.code === 'Minus' || event.code === 'NumpadSubtract') { this.cameraZoomOut = true; }
      
      // Update movement vector based on keys
      this.updateMoveVector();
    }
    
    else if (event.type === 'keyup') {
      // Movement keys
      if (event.code === 'KeyW' || event.code === 'ArrowUp') { this.forward = false; }
      else if (event.code === 'KeyS' || event.code === 'ArrowDown') { this.backward = false; }
      else if (event.code === 'KeyA' || event.code === 'ArrowLeft') { this.left = false; }
      else if (event.code === 'KeyD' || event.code === 'ArrowRight') { this.right = false; }
      
      // Camera control keys - these are one-shot events, handled elsewhere
      
      // Free camera movement keys
      else if (event.code === 'KeyI') { this.cameraPanUp = false; }
      else if (event.code === 'KeyK') { this.cameraPanDown = false; }
      else if (event.code === 'KeyJ') { this.cameraPanLeft = false; }
      else if (event.code === 'KeyL') { this.cameraPanRight = false; }
      else if (event.code === 'Equal' || event.code === 'NumpadAdd') { this.cameraZoomIn = false; }
      else if (event.code === 'Minus' || event.code === 'NumpadSubtract') { this.cameraZoomOut = false; }
      
      // Update movement vector based on keys
      this.updateMoveVector();
    }

    if (event.type === 'mousemove') {
      // Handle mouse movement for camera rotation
      const deltaX = event.clientX - this.mouseX;
      const deltaY = event.clientY - this.mouseY;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      
      // Only apply mouse movement if enabled or if right mouse button is pressed
      if (this.mouseControlEnabled || this.rightMouseDown) {
        if (this.onMouseMove) {
          this.onMouseMove(deltaX * this.mouseSensitivity, deltaY * this.mouseSensitivity);
        }
      }
    }
    else if (event.type === 'mousedown' && event.button === 2) {
      // Right mouse button down - alternative camera control mode
      this.rightMouseDown = true;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    }
    else if (event.type === 'mouseup' && event.button === 2) {
      // Right mouse button up
      this.rightMouseDown = false;
    }
  }
  
  updateMoveVector() {
    // Reset moveVector
    this.moveVector.set(0, 0, 0);
    
    // Add movement based on key states - fix direction mapping
    // In Three.js, negative Z is "forward" in the default coordinate system
    if (this.forward) this.moveVector.z = 1; // Move forward (negative Z)
    if (this.backward) this.moveVector.z = -1; // Move backward (positive Z)
    if (this.left) this.moveVector.x = 1; // Move left (negative X)
    if (this.right) this.moveVector.x = -1; // Move right (positive X)
    
    // Normalize if we have movement to maintain consistent speed in all directions
    if (this.moveVector.length() > 0) {
      this.moveVector.normalize();
      
      // Calculate the force to apply based on the movement direction
      this.moveForce.copy(this.moveVector).multiplyScalar(this.forceMultiplier);
    } else {
      this.moveForce.set(0, 0, 0);
    }
  }
  
  // Get the force to apply for movement
  getMoveForce() {
    return this.moveForce.clone();
  }
  
  // Returns true if any movement keys are pressed
  isMoving() {
    return this.forward || this.backward || this.left || this.right;
  }
  
  // Update free camera position and target based on input
  updateFreeCamera(cameraPosition, cameraTarget, deltaTime) {
    // Pan speed (units per second)
    const panSpeed = 50;
    // Zoom speed (units per second)
    const zoomSpeed = 30;
    
    // Calculate pan direction in camera's local XZ plane
    const panDirection = new THREE.Vector3(0, 0, 0);
    if (this.cameraPanLeft) panDirection.x -= 1;
    if (this.cameraPanRight) panDirection.x += 1;
    if (this.cameraPanUp) panDirection.z -= 1;
    if (this.cameraPanDown) panDirection.z += 1;
    
    // If there's pan input, normalize and apply movement
    if (panDirection.length() > 0) {
      panDirection.normalize();
      
      // Calculate world-space movement based on camera orientation
      // We're moving in the XZ plane, so we create a movement vector and rotate it
      const movement = new THREE.Vector3(
        panDirection.x * panSpeed * deltaTime,
        0,
        panDirection.z * panSpeed * deltaTime
      );
      
      // Apply the movement to both position and target to keep the camera angle
      cameraPosition.add(movement);
      cameraTarget.add(movement);
    }
    
    // Handle zooming (changing height)
    if (this.cameraZoomIn) {
      // Move camera closer to target (down)
      cameraPosition.y = Math.max(5, cameraPosition.y - zoomSpeed * deltaTime);
    }
    
    if (this.cameraZoomOut) {
      // Move camera away from target (up)
      cameraPosition.y += zoomSpeed * deltaTime;
    }
  }

  setMouseMoveCallback(callback) {
    this.onMouseMove = callback;
  }
  
  // New method to check if mouse control is enabled
  isMouseControlEnabled() {
    return this.mouseControlEnabled;
  }
}
