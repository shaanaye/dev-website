import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

renderer.render(scene, camera);

// const bookGeometry = new THREE.BoxGeometry(10, 15, 4);
// const bookMaterial = new THREE.MeshStandardMaterial({color: 0xFFFFFF});
// const book = new THREE.Mesh(bookGeometry, bookMaterial);
// scene.add(book);

const ambientLight = new THREE.AmbientLight( 0xffffff );
const pointLight = new THREE.PointLight(0xffffff);
ambientLight.position.set(25,25,25);
pointLight.position.set(25,25,25);
scene.add(ambientLight, pointLight);

// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);

const controls = new OrbitControls(camera, renderer.domElement);

function addStar(){
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}

const mo = new THREE.TextureLoader().load('mo.PNG');
scene.background = mo;

const ammarTexture = new THREE.TextureLoader().load('gang.PNG');
const ammar = new THREE.Mesh(
  new THREE.SphereGeometry(5,5,5),
  new THREE.MeshBasicMaterial({map: ammarTexture})
);

scene.add(ammar);

Array(200).fill().forEach(addStar);

function animate(){
  requestAnimationFrame(animate);

  // book.rotation.x += 0.01;
  // book.rotation.y += 0.05;
  // book.rotation.z += 0.01;
  ammar.rotation.x += 0.01;
  ammar.rotation.y += 0.05;
  ammar.rotation.z += 0.01;
  controls.update();
  renderer.render(scene, camera);
}

animate();