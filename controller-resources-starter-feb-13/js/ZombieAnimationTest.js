import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

class ZombieAnimationTest {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        this.stats = new Stats();
        this.animationClips = {};
        this.zombies = [];
        this.currentAnimations = {};

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(this.stats.dom);
        
        // Add scene background
        this.scene.background = new THREE.Color(0x333333);

        // Setup camera
        this.camera.position.set(5, 5, 10);
        
        // Add orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0);
        this.controls.update();

        // Add lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(5, 5, 5);
        directional.castShadow = true;
        this.scene.add(directional);
        
        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Load model
        this.loadZombieModel();

        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate();
    }
    
    loadZombieModel() {
        console.log('Loading zombie model...');
        const loader = new GLTFLoader();
        loader.load(
            './models/low_poly_zombie_game_animation.glb',
            (gltf) => {
                console.log('Model loaded successfully!');
                console.log('Available animations:', gltf.animations.map(a => a.name));
                
                // Store animation clips
                gltf.animations.forEach(clip => {
                    this.animationClips[clip.name] = clip;
                    console.log(`Animation clip stored: ${clip.name}, duration: ${clip.duration}s`);
                });
                
                // Create multiple zombies for testing
                this.createZombie(-4, 0, 'Original');
                this.createZombie(0, 0, 'Clone 1');
                this.createZombie(4, 0, 'Clone 2');
                
                // Setup GUI after zombies are created
                this.setupGUI();
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }
    
    createZombie(x, z, label) {
        // Create a new zombie instance
        const loader = new GLTFLoader();
        loader.load('./models/low_poly_zombie_game_animation.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(x, 0, z);
            model.scale.set(0.8, 0.8, 0.8);
            
            // Add to scene
            this.scene.add(model);
            
            // Create mixer for this zombie
            const mixer = new THREE.AnimationMixer(model);
            
            // Create animation actions for all clips
            const actions = {};
            Object.keys(this.animationClips).forEach(clipName => {
                const action = mixer.clipAction(this.animationClips[clipName]);
                actions[clipName] = action;
            });
            
            // Add text label
            const textDiv = document.createElement('div');
            textDiv.className = 'label';
            textDiv.textContent = label;
            textDiv.style.position = 'absolute';
            textDiv.style.color = 'white';
            textDiv.style.padding = '2px';
            textDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
            textDiv.style.fontSize = '12px';
            document.body.appendChild(textDiv);
            
            // Store zombie data
            this.zombies.push({
                model,
                mixer,
                actions,
                label,
                labelElement: textDiv,
                position: new THREE.Vector3(x, 0, z),
                currentAnimation: null
            });
            
            console.log(`Created zombie "${label}" with ${Object.keys(actions).length} animations`);
        });
    }
    
    playAnimation(zombieIndex, animationName) {
        if (zombieIndex >= this.zombies.length) {
            console.warn(`Zombie index ${zombieIndex} does not exist`);
            return;
        }
        
        const zombie = this.zombies[zombieIndex];
        
        // Check if animation exists
        if (!zombie.actions[animationName]) {
            console.warn(`Animation "${animationName}" not found for zombie ${zombie.label}`);
            const availableAnims = Object.keys(zombie.actions).join(', ');
            console.log(`Available animations: ${availableAnims}`);
            return;
        }
        
        // Stop current animation
        if (zombie.currentAnimation && zombie.actions[zombie.currentAnimation]) {
            zombie.actions[zombie.currentAnimation].fadeOut(0.5);
        }
        
        // Play new animation
        zombie.actions[animationName].reset().fadeIn(0.5).play();
        zombie.currentAnimation = animationName;
        this.currentAnimations[zombieIndex] = animationName;
        
        console.log(`Playing "${animationName}" on zombie "${zombie.label}"`);
    }
    
    updateLabels() {
        // Update position of each label
        this.zombies.forEach(zombie => {
            if (zombie.labelElement) {
                const position = new THREE.Vector3();
                position.setFromMatrixPosition(zombie.model.matrixWorld);
                position.y += 2.5; // Position above head
                
                const screenPosition = position.clone();
                screenPosition.project(this.camera);
                
                const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
                const y = (- screenPosition.y * 0.5 + 0.5) * window.innerHeight;
                
                zombie.labelElement.style.transform = `translate(-50%, -50%)`;
                zombie.labelElement.style.left = `${x}px`;
                zombie.labelElement.style.top = `${y}px`;
                
                // Update label text with current animation
                zombie.labelElement.textContent = `${zombie.label}: ${zombie.currentAnimation || 'None'}`;
            }
        });
    }

    setupGUI() {
        const gui = new GUI({ width: 300 });
        
        // Create folders for each zombie
        this.zombies.forEach((zombie, index) => {
            const folder = gui.addFolder(`Zombie ${index}: ${zombie.label}`);
            
            // Add animation controls
            const anims = Object.keys(this.animationClips);
            anims.forEach(animName => {
                folder.add({ 
                    play: () => this.playAnimation(index, animName)
                }, 'play').name(`Play ${animName}`);
            });
            
            folder.add({
                stop: () => {
                    if (zombie.currentAnimation && zombie.actions[zombie.currentAnimation]) {
                        zombie.actions[zombie.currentAnimation].stop();
                        zombie.currentAnimation = null;
                        this.currentAnimations[index] = null;
                    }
                }
            }, 'stop').name('Stop Animation');
            
            folder.open();
        });
        
        // Add global controls
        const globalFolder = gui.addFolder('Global Controls');
        
        globalFolder.add({
            playAllIdle: () => {
                this.zombies.forEach((zombie, index) => {
                    this.playAnimation(index, 'Idle');
                });
            }
        }, 'playAllIdle').name('All Idle');
        
        globalFolder.add({
            playAllWalk: () => {
                this.zombies.forEach((zombie, index) => {
                    this.playAnimation(index, 'Walk');
                });
            }
        }, 'playAllWalk').name('All Walk');
        
        globalFolder.add({
            playAllAttack: () => {
                this.zombies.forEach((zombie, index) => {
                    this.playAnimation(index, 'Attack');
                });
            }
        }, 'playAllAttack').name('All Attack');
        
        globalFolder.add({
            playAllDeath: () => {
                this.zombies.forEach((zombie, index) => {
                    this.playAnimation(index, 'Death');
                });
            }
        }, 'playAllDeath').name('All Death');
        
        globalFolder.add({
            stopAll: () => {
                this.zombies.forEach((zombie) => {
                    if (zombie.currentAnimation && zombie.actions[zombie.currentAnimation]) {
                        zombie.actions[zombie.currentAnimation].stop();
                        zombie.currentAnimation = null;
                    }
                });
                this.currentAnimations = {};
            }
        }, 'stopAll').name('Stop All');
        
        globalFolder.open();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Update mixers
        this.zombies.forEach(zombie => {
            if (zombie.mixer) zombie.mixer.update(delta);
        });
        
        // Update label positions
        this.updateLabels();

        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }
}

// Start test
window.addEventListener('DOMContentLoaded', () => {
    new ZombieAnimationTest();
});
