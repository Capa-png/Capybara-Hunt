import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { STLLoader } from 'https://unpkg.com/three@0.152.2/examples/jsm/loaders/STLLoader.js';

function init() {
  const container = document.getElementById('stl-viewer');
  if(!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);  // transparent background
  const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  camera.position.set(0, 0, 150);

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(0, 200, 100);
  scene.add(dir);

  const meshGroup = new THREE.Group();
  scene.add(meshGroup);

  function loadSTL(url){
    const loader = new STLLoader();
    loader.load(url, function(geometry){
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const size = new THREE.Vector3(); bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 80 / maxDim;
      const material = new THREE.MeshStandardMaterial({color:0xdab06b, metalness:0.2, roughness:0.6});
      const mesh = new THREE.Mesh(geometry, material);
      geometry.center();
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.x = -Math.PI/2;
      meshGroup.clear();
      meshGroup.add(mesh);
    }, undefined, function(err){
      meshGroup.clear();
      const geom = new THREE.BoxGeometry(40,40,40);
      const mat = new THREE.MeshStandardMaterial({color:0x8888ff});
      const box = new THREE.Mesh(geom, mat);
      meshGroup.add(box);
    });
  }

  loadSTL('samples/capybara.stl');

  function onWindowResize(){
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
  }
  window.addEventListener('resize', onWindowResize);

  function animate(){
    requestAnimationFrame(animate);
    meshGroup.rotation.y += 0.004; // gentle auto-rotate
    renderer.render(scene, camera);
  }
  animate();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
else init();
