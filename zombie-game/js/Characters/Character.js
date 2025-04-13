import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';

export class Character {

  constructor(color = new THREE.Color(0xff0000), size = 5) {

    this.size = size;

    let coneGeo = new THREE.ConeGeometry(this.size / 2, this.size, 10);
    let coneMat = new THREE.MeshStandardMaterial({ color: color });
    let mesh = new THREE.Mesh(coneGeo, coneMat);
    mesh.rotation.x = Math.PI / 2;

    this.gameObject = new THREE.Group();
    this.gameObject.add(mesh);

    this.location = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.topSpeed = 20;

    this.mass = 1;
    this.maxForce = 15;

    // New additions:
    this.health = 100;
    this.mixer = null;
    this.animations = {};
  }

  setModel(model, animations = []) {
    let bbox = new THREE.Box3().setFromObject(model);
    let dz = bbox.max.z - bbox.min.z;
    let scale = this.size / dz;
    model.scale.set(scale, scale, scale);

    this.gameObject.clear();
    this.gameObject.add(model);

    if (animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      animations.forEach(clip => {
        this.animations[clip.name] = this.mixer.clipAction(clip);
      });
      this.playAnimation('Idle');
    }
  }

  playAnimation(name) {
    if (this.animations[name]) {
      Object.values(this.animations).forEach(a => a.stop());
      this.animations[name].reset().play();
    }
  }

  update(deltaTime, bounds) {
    if (this.mixer) this.mixer.update(deltaTime);

    this.velocity.addScaledVector(this.acceleration, deltaTime);
    if (this.velocity.length() > this.topSpeed) {
      this.velocity.setLength(this.topSpeed);
    }
    this.location.addScaledVector(this.velocity, deltaTime);

    if (this.velocity.length() > 0) {
      let angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.gameObject.rotation.y = angle;
    }

    this.checkBounds(bounds);
    this.gameObject.position.copy(this.location);
    this.acceleration.setLength(0);
  }

  checkBounds(bounds) {
    this.location.x = THREE.MathUtils.euclideanModulo(
      this.location.x - bounds.min.x,
      bounds.max.x - bounds.min.x
    ) + bounds.min.x;

    this.location.z = THREE.MathUtils.euclideanModulo(
      this.location.z - bounds.min.z,
      bounds.max.z - bounds.min.z
    ) + bounds.min.z;
  }

  applyForce(force) {
    force.divideScalar(this.mass);
    this.acceleration.add(force);
  }

  applyBrakes() {
    let brake = VectorUtil.multiplyScalar(this.velocity, -1);
    if (brake.length() > this.maxForce) brake.setLength(this.maxForce);
    return brake;
  }

  stop() {
    this.velocity.setLength(0);
  }

  // New health management:
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.onDeath();
    }
  }

  onDeath() {
    this.playAnimation('Death');
    // Remove character from scene after death animation or other logic
  }

  // Simple collision detection:
  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.gameObject);
  }

  checkCollision(otherCharacter) {
    return this.getBoundingBox().intersectsBox(otherCharacter.getBoundingBox());
  }
}
