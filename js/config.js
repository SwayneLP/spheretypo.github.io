// Tous les réglages faciles à personnaliser sont regroupés ici.
export const CONFIG = {
  model: './assets/models/sphere.obj',
  textures: {
    baseColor: './assets/textures/BaseColor.png',
    metallic: './assets/textures/Metallic.png',
    roughness: './assets/textures/Roughness.png',
    normal: './assets/textures/Normal_OpenGL.png',
    height: './assets/textures/Height.png', // disponible pour un displacement ultérieur
    glyphMask: './assets/textures/GlyphMask.png', // masque pour effets personnalisés
  },
  background: 0x000000,
  fallbackColor: 0xb7b7b7,
  fallbackMetalness: 0.0,
  fallbackRoughness: 0.68,
  normalScale: 1.0,
  cameraFov: 100,
  cameraDistanceMultiplier: 3.3,
  minZoomMultiplier: 1.25,
  maxZoomMultiplier: 8,
  autoRotate: true,
  autoRotateSpeed: 0.7,
  exposure: 0.9,
  lightIntensity: { ambient: 0.9, key: 115, fill: 65, rim: 100 },
};
