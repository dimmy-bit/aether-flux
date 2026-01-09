import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ParticleSystem } from './ParticleSystem';
import { AppSettings, HandData } from '../types';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private particles: ParticleSystem;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private particleGroup: THREE.Group;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.scene.background = new THREE.Color(0x020205);
    this.scene.fog = new THREE.FogExp2(0x020205, 0.01);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    container.appendChild(this.renderer.domElement);

    // High-Quality Bloom Setup
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      2.2, // Strength: Boosted for luminous feel
      0.4, // Radius: Tighter glow
      0.15 // Threshold: Glow starts early for vivid colors
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 20, 100);
    pointLight.position.set(0, 10, 20);
    this.scene.add(pointLight);

    this.particles = new ParticleSystem();
    this.particleGroup.add(this.particles.mesh);
  }

  public updateHandData(hands: HandData[]): void {
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
    const visibleWidth = visibleHeight * this.camera.aspect;

    const scaledHands = hands.map(h => ({
      ...h,
      worldPos: {
        x: h.worldPos.x * (visibleWidth / 2) * 1.1,
        y: h.worldPos.y * (visibleHeight / 2) * 1.1,
        z: 0 
      }
    }));

    this.particles.updateInteractions(scaledHands);
  }

  public updateSettings(settings: AppSettings): void {
    this.particles.applySettings(settings);
  }

  public render(): void {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    // Subtle breathing motion for the entire system
    this.particleGroup.rotation.y += delta * 0.05;
    this.particleGroup.rotation.x = Math.sin(this.clock.elapsedTime * 0.2) * 0.05;

    this.particles.update(delta);
    this.composer.render();
  }

  public onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  public dispose(): void {
    this.particles.dispose();
    this.renderer.dispose();
    this.composer.dispose();
  }
}