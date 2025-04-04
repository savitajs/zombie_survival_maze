import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Player } from './Behaviour/Player.js';
import { Controller } from './Behaviour/Controller.js';
import { Resources } from './Util/Resources.js';
import { FlowField } from './Util/FlowField.js';
import { ZombieAI } from './Behaviour/ZombieAI.js';

// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

scene.add( camera );

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );

// Create clock
const clock = new THREE.Clock();

// Declare bounds
let bounds;

// Create controller
const controller = new Controller(document, camera);

// Create player
const player = new Player();

// Load in our resources
let files = [{name:"delorean",url:"/models/delorean.glb"},
             {name:"sportscar",url:"/models/sportscar.glb"},
             {name:"zombie",url:"/models/zombie.glb"},];
const resources = new Resources(files);
await resources.loadAll();

player.setModel(resources.get("zombie"));

// Create flow field
const flowField = new FlowField(100, 100, 5);
scene.add(flowField.debugMesh);

// Create zombies
const zombies = [];
for(let i = 0; i < 15; i++) {
    const zombie = new ZombieAI();
    zombie.location.set(
        Math.random() * 80 - 40,
        0,
        Math.random() * 80 - 40
    );
    scene.add(zombie.gameObject);
    zombies.push(zombie);
}

// Setup our scene
function init() {

  scene.background = new THREE.Color(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.y = 60;
  camera.lookAt(0,0,0);

  // Create Light
  let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);

  // Initialize bounds
  bounds = new THREE.Box3(
    new THREE.Vector3(-50,0,-50), // scene min
    new THREE.Vector3(50,0,50) // scene max
  );

  // Add the characters to the scene
  scene.add(player.gameObject);


  // First call to animate
  animate();
}



// animate loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Change in time
  let deltaTime = clock.getDelta();

  player.update(deltaTime, bounds, controller);
  
  flowField.update(player.location);
  
  zombies.forEach(zombie => {
      zombie.update(deltaTime, bounds, flowField, player.location, zombies);
  });
}


init();
