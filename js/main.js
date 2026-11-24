import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { CONFIG } from './config.js';

const container = document.querySelector('#viewer');
const loading = document.querySelector('#loading');
const progress = document.querySelector('#progress');

// SCÈNE ET RENDU
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.background);
const camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, 1, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.exposure;
container.appendChild(renderer.domElement);

// ROTATION ET ZOOM
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = true;
controls.autoRotate = CONFIG.autoRotate;
controls.autoRotateSpeed = CONFIG.autoRotateSpeed;

// ÉCLAIRAGE DE STUDIO (la lumière ambiante est indépendante des dimensions du modèle)
scene.add(new THREE.AmbientLight(0xffffff, CONFIG.lightIntensity.ambient));
function areaLight(color, intensity, x, y, z, size) {
  const light = new THREE.PointLight(color, intensity, 0, 2);
  light.position.set(x, y, z);
  scene.add(light);
  return light;
}

// TEXTURES PBR : chaque image est optionnelle. Sans image, matériau neutre.
const material = new THREE.MeshStandardMaterial({
  color: CONFIG.fallbackColor,
  metalness: CONFIG.fallbackMetalness,
  roughness: CONFIG.fallbackRoughness,
});
const textureLoader = new THREE.TextureLoader();
function loadTexture(path, property, colorTexture = false) {
  textureLoader.load(path, (texture) => {
    texture.flipY = true; // OBJ : coordonnées UV conventionnelles
    if (colorTexture) texture.colorSpace = THREE.SRGBColorSpace;
    material[property] = texture;
    if (property === 'map') material.color.set(0xffffff); // préserver les couleurs exactes de BaseColor
    if (property === 'metalnessMap') material.metalness = 1;
    if (property === 'roughnessMap') material.roughness = 1;
    if (property === 'normalMap') material.normalScale.set(CONFIG.normalScale, CONFIG.normalScale);
    material.needsUpdate = true;
  }, undefined, () => {
    console.info(`Texture facultative absente : ${path}`);
  });
}
loadTexture(CONFIG.textures.baseColor, 'map', true);
loadTexture(CONFIG.textures.metallic, 'metalnessMap');
loadTexture(CONFIG.textures.roughness, 'roughnessMap');
loadTexture(CONFIG.textures.normal, 'normalMap');

// MODÈLE OBJ
new OBJLoader().load(CONFIG.model, (model) => {
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center); // centre le modèle sans altérer son maillage
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) / 2;
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.geometry.computeVertexNormals();
    }
  });
  scene.add(model);

  camera.position.set(radius * 0.25, radius * 0.12, radius * CONFIG.cameraDistanceMultiplier);
  camera.near = Math.max(radius / 1000, 0.001);
  camera.far = radius * 100;
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minDistance = radius * CONFIG.minZoomMultiplier;
  controls.maxDistance = radius * CONFIG.maxZoomMultiplier;
  controls.update();

  // Lumières adaptées automatiquement à l'échelle de la sphère
  const lightScale = Math.max(radius, 0.01);
  const lightPower = lightScale * lightScale;
  areaLight(0xffffff, CONFIG.lightIntensity.key * lightPower, -2 * lightScale, 3 * lightScale, 4 * lightScale);
  areaLight(0xd7e5ff, CONFIG.lightIntensity.fill * lightPower, 3 * lightScale, 0.5 * lightScale, 2 * lightScale);
  areaLight(0xffffff, CONFIG.lightIntensity.rim * lightPower, 0, 2 * lightScale, -3 * lightScale);
  loading.hidden = true;
}, (event) => {
  if (event.total) progress.textContent = `${Math.round(event.loaded / event.total * 100)} %`;
}, (error) => {
  console.error('Impossible de charger le modèle OBJ', error);
  loading.textContent = 'MODÈLE INTROUVABLE — VÉRIFIER LE SERVEUR LOCAL';
});

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
