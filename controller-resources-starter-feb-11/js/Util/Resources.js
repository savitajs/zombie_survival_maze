import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/**
 * 
 * The purpose of this class is to load 
 * resources into your three.js project
 * 
 * Resources can be accessed through a dictionary "dict"
 * 
 */
export class Resources {

  constructor(files) {

    this.files = files;

    this.dict = {};

    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    
    
  }

  get(string) {
    return this.dict[string].clone();
  }

  // Loads all specified resources via their URLs
  async loadAll() {
    let promises = []
    
    this.files.forEach((file) => {
      
      let promise = this.loadGLTF(
        file.name, 
        file.url
      ).then(([name, data]) => {
        this.dict[name] = data;
      });
      
      promises.push(promise);
    });

    return Promise.all(promises);
  }


  // Load GLB or GLTF files
  loadGLTF(name, url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, data=> resolve([name, data.scene]), null, reject);
    });
  }


}

