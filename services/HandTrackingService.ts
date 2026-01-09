import * as HandsNamespace from '@mediapipe/hands';
import * as CameraNamespace from '@mediapipe/camera_utils';
import { HandData } from '../types';

export class HandTrackingService {
  private hands: any = null;
  private camera: any = null;
  private onResultsCallback: (hands: HandData[]) => void;
  private onReadyCallback: () => void;
  
  // Smoothing state
  private lastHandPos: { x: number, y: number, z: number }[] = [];
  private smoothingAlpha: number = 0.25; // Lower is smoother but laggier

  constructor(
    videoElement: HTMLVideoElement, 
    onResults: (hands: HandData[]) => void,
    onReady: () => void
  ) {
    this.onResultsCallback = onResults;
    this.onReadyCallback = onReady;
    this.initialize(videoElement);
  }

  private async initialize(videoElement: HTMLVideoElement) {
    try {
      // Robust detection of MediaPipe classes across different ESM wrapping behaviors
      const HandsClass = (HandsNamespace as any).Hands || (HandsNamespace as any).default?.Hands || (window as any).Hands;
      const CameraClass = (CameraNamespace as any).Camera || (CameraNamespace as any).default?.Camera || (window as any).Camera;

      if (!HandsClass) throw new Error("MediaPipe Hands library failed to load.");
      if (!CameraClass) throw new Error("MediaPipe Camera utility failed to load.");

      this.hands = new HandsClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });

      this.hands.onResults(this.handleResults.bind(this));

      this.camera = new CameraClass(videoElement, {
        onFrame: async () => {
          if (this.hands && videoElement.readyState >= 2) {
            await this.hands.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.onReadyCallback();

    } catch (e) {
      console.error("HandTrackingService Initialization Failed:", e);
      // Trigger a custom event or callback to show a UI error if needed
    }
  }

  private handleResults(results: any): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.lastHandPos = [];
      this.onResultsCallback([]);
      return;
    }

    const processedHands: HandData[] = results.multiHandLandmarks.map((landmarks: any, hIdx: number) => {
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const wrist = landmarks[0];
      
      // Calculate raw target position
      const targetX = (1 - thumbTip.x) * 2 - 1;
      const targetY = -(thumbTip.y * 2 - 1);
      const targetZ = thumbTip.z;

      // Apply Exponential Smoothing
      if (!this.lastHandPos[hIdx]) {
        this.lastHandPos[hIdx] = { x: targetX, y: targetY, z: targetZ };
      } else {
        this.lastHandPos[hIdx].x += (targetX - this.lastHandPos[hIdx].x) * this.smoothingAlpha;
        this.lastHandPos[hIdx].y += (targetY - this.lastHandPos[hIdx].y) * this.smoothingAlpha;
        this.lastHandPos[hIdx].z += (targetZ - this.lastHandPos[hIdx].z) * this.smoothingAlpha;
      }

      // Gesture Logic
      const dist = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );
      
      const isPinching = dist < 0.075;

      const tips = [8, 12, 16, 20];
      let avgDist = 0;
      tips.forEach(idx => {
        avgDist += Math.sqrt(
          Math.pow(landmarks[idx].x - wrist.x, 2) + 
          Math.pow(landmarks[idx].y - wrist.y, 2)
        );
      });
      const isOpen = (avgDist / tips.length) > 0.38;

      return {
        landmarks,
        isPinching,
        isOpen,
        worldPos: { ...this.lastHandPos[hIdx] }
      };
    });

    this.onResultsCallback(processedHands);
  }

  public dispose(): void {
    if (this.camera) this.camera.stop();
    if (this.hands) this.hands.close();
  }
}