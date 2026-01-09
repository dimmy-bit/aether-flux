
export interface HandData {
  landmarks: Array<{ x: number; y: number; z: number }>;
  isPinching: boolean;
  isOpen: boolean;
  worldPos: { x: number; y: number; z: number };
}

export interface AppSettings {
  particleCount: number;
  particleSize: number;
  interactionStrength: number;
  idleSpeed: number;
  colorTheme: 'cyber' | 'sunset' | 'nature';
}

export enum GestureType {
  IDLE = 'IDLE',
  ATTRACT = 'ATTRACT', // Pinch
  REPEL = 'REPEL'     // Palm Open
}
