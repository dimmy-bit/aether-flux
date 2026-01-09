
import React, { useEffect, useRef } from 'react';
import { SceneManager } from '../three/SceneManager';
import { HandTrackingService } from '../services/HandTrackingService';
import { AppSettings } from '../types';

interface ExperienceProps {
  settings: AppSettings;
  onHandDetectionChange: (detected: boolean) => void;
  onCameraReady: () => void;
}

const Experience: React.FC<ExperienceProps> = ({ settings, onHandDetectionChange, onCameraReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const handTrackingRef = useRef<HandTrackingService | null>(null);

  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    // 1. Init Three.js
    const sceneManager = new SceneManager(containerRef.current);
    sceneManagerRef.current = sceneManager;

    // 2. Init Hand Tracking
    const handTracking = new HandTrackingService(videoRef.current, (hands) => {
      onHandDetectionChange(hands.length > 0);
      if (sceneManagerRef.current) {
        sceneManagerRef.current.updateHandData(hands);
      }
    }, () => {
      onCameraReady();
    });
    handTrackingRef.current = handTracking;

    // 3. Start Animation Loop
    let animationId: number;
    const animate = () => {
      sceneManager.render();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // 4. Handle Resize
    const handleResize = () => {
      sceneManager.onWindowResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      sceneManager.dispose();
      handTracking.dispose();
    };
  }, []);

  // Update Three.js scene when settings change
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateSettings(settings);
    }
  }, [settings]);

  return (
    <div ref={containerRef} className="w-full h-full cursor-none">
      <video 
        ref={videoRef} 
        className="hidden" 
        playsInline 
        muted 
      />
    </div>
  );
};

export default Experience;
