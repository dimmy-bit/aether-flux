import * as THREE from 'three';
import { AppSettings, HandData } from '../types';

export class ParticleSystem {
  public mesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private opacities: Float32Array;
  private originalPositions: Float32Array;
  
  private ghostCount: number = 4; // Head + 4 trailing segments
  private count: number = 2500;
  private totalPoints: number;
  
  private currentSettings: AppSettings | null = null;
  private hands: HandData[] = [];
  private time: number = 0;

  constructor() {
    this.totalPoints = this.count * (1 + this.ghostCount);
    this.geometry = new THREE.BufferGeometry();
    
    this.positions = new Float32Array(this.totalPoints * 3);
    this.originalPositions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.totalPoints * 3);
    this.opacities = new Float32Array(this.totalPoints);

    this.initParticles();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uSize: { value: 0.18 },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        uniform float uSize;
        void main() {
          vColor = color;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distScale = 400.0 / -mvPosition.z;
          gl_PointSize = uSize * (1.0 + vOpacity * 0.5) * distScale;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float strength = pow(1.0 - d * 2.0, 1.5);
          gl_FragColor = vec4(vColor, strength * vOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  private initParticles(): void {
    const range = 50;
    for (let i = 0; i < this.count; i++) {
      const x = (Math.random() - 0.5) * range * 1.5;
      const y = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * 8;

      this.originalPositions[i * 3] = x;
      this.originalPositions[i * 3 + 1] = y;
      this.originalPositions[i * 3 + 2] = z;

      this.velocities[i * 3] = 0;
      this.velocities[i * 3 + 1] = 0;
      this.velocities[i * 3 + 2] = 0;

      const baseColor = new THREE.Color();
      this.getThemeColor(baseColor, i / this.count, 'cyber');

      for (let g = 0; g <= this.ghostCount; g++) {
        const idx = (i * (1 + this.ghostCount) + g);
        this.positions[idx * 3] = x;
        this.positions[idx * 3 + 1] = y;
        this.positions[idx * 3 + 2] = z;
        
        // Ghost opacity curve: Head (brightest) to Tail (dimmest)
        this.opacities[idx] = g === 0 ? 1.0 : Math.pow(0.7, g);
        
        this.colors[idx * 3] = baseColor.r;
        this.colors[idx * 3 + 1] = baseColor.g;
        this.colors[idx * 3 + 2] = baseColor.b;
      }
    }
  }

  private getThemeColor(target: THREE.Color, factor: number, theme: string) {
    if (theme === 'cyber') {
      target.setHSL(0.5 + factor * 0.25, 1.0, 0.65); // Neon Cyan/Pink
    } else if (theme === 'sunset') {
      target.setHSL(0.0 + factor * 0.12, 1.0, 0.6); // Red/Orange
    } else {
      target.setHSL(0.3 + factor * 0.3, 0.8, 0.55); // Forest/Ocean
    }
  }

  public applySettings(settings: AppSettings): void {
    if (this.count !== settings.particleCount) {
        this.count = settings.particleCount;
        this.totalPoints = this.count * (1 + this.ghostCount);
        this.positions = new Float32Array(this.totalPoints * 3);
        this.originalPositions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.colors = new Float32Array(this.totalPoints * 3);
        this.opacities = new Float32Array(this.totalPoints);
        this.initParticles();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));
    }

    if (!this.currentSettings || this.currentSettings.colorTheme !== settings.colorTheme) {
        const tempColor = new THREE.Color();
        for(let i=0; i<this.count; i++) {
            this.getThemeColor(tempColor, i / this.count, settings.colorTheme);
            for(let g=0; g<=this.ghostCount; g++) {
                const idx = (i * (1 + this.ghostCount) + g) * 3;
                this.colors[idx] = tempColor.r;
                this.colors[idx + 1] = tempColor.g;
                this.colors[idx + 2] = tempColor.b;
            }
        }
        this.geometry.attributes.color.needsUpdate = true;
    }

    this.material.uniforms.uSize.value = settings.particleSize * 2.8;
    this.currentSettings = settings;
  }

  public updateInteractions(hands: HandData[]): void {
    this.hands = hands;
  }

  public update(delta: number): void {
    this.time += delta;
    if (!this.currentSettings) return;

    const friction = 0.94;
    const returnForce = 0.035;
    const interactionRadius = 22;
    const strength = this.currentSettings.interactionStrength * 10;

    for (let i = 0; i < this.count; i++) {
      const vIdx = i * 3;
      const headIdx = i * (1 + this.ghostCount);
      const headPosIdx = headIdx * 3;

      let px = this.positions[headPosIdx];
      let py = this.positions[headPosIdx + 1];
      let pz = this.positions[headPosIdx + 2];

      // 1. Fluid Idle Flow
      const noise = this.currentSettings.idleSpeed * 0.1;
      this.velocities[vIdx] += Math.sin(this.time * 0.7 + py * 0.2) * noise;
      this.velocities[vIdx + 1] += Math.cos(this.time * 0.7 + px * 0.2) * noise;

      // 2. Hand Gesture Forces
      this.hands.forEach(hand => {
        const dx = px - hand.worldPos.x;
        const dy = py - hand.worldPos.y;
        const dz = pz - hand.worldPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist < interactionRadius) {
            const f = (1.0 - dist / interactionRadius) * strength;
            if (hand.isPinching) {
                // Attract (Gravity Well)
                this.velocities[vIdx] -= (dx / dist) * f * 0.75;
                this.velocities[vIdx+1] -= (dy / dist) * f * 0.75;
                this.velocities[vIdx+2] -= (dz / dist) * f * 0.75;
            } else if (hand.isOpen) {
                // Repel (Blast Wave)
                this.velocities[vIdx] += (dx / dist) * f;
                this.velocities[vIdx+1] += (dy / dist) * f;
                this.velocities[vIdx+2] += (dz / dist) * f;
            }
        }
      });

      // 3. Elastic Return Force
      this.velocities[vIdx] += (this.originalPositions[vIdx] - px) * returnForce;
      this.velocities[vIdx + 1] += (this.originalPositions[vIdx + 1] - py) * returnForce;
      this.velocities[vIdx + 2] += (this.originalPositions[vIdx + 2] - pz) * returnForce;

      this.velocities[vIdx] *= friction;
      this.velocities[vIdx + 1] *= friction;
      this.velocities[vIdx + 2] *= friction;

      // Update Segments (Trails)
      for (let g = this.ghostCount; g > 0; g--) {
        const curr = (headIdx + g) * 3;
        const prev = (headIdx + g - 1) * 3;
        const segmentSpeed = 0.25; 
        this.positions[curr] += (this.positions[prev] - this.positions[curr]) * segmentSpeed;
        this.positions[curr + 1] += (this.positions[prev + 1] - this.positions[curr + 1]) * segmentSpeed;
        this.positions[curr + 2] += (this.positions[prev + 2] - this.positions[curr + 2]) * segmentSpeed;
      }

      // Final Head Movement
      this.positions[headPosIdx] += this.velocities[vIdx];
      this.positions[headPosIdx + 1] += this.velocities[vIdx + 1];
      this.positions[headPosIdx + 2] += this.velocities[vIdx + 2];
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}