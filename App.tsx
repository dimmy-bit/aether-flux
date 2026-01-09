
import React, { useState } from 'react';
import Experience from './components/Experience';
import { Settings, Hand, Camera, Sliders, Palette, Zap } from 'lucide-react';
import { AppSettings } from './types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    particleCount: 2500,
    particleSize: 0.15,
    interactionStrength: 1.5,
    idleSpeed: 0.5,
    colorTheme: 'cyber'
  });

  const [showSettings, setShowSettings] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020205] select-none font-['Inter']">
      {/* 3D Scene */}
      <Experience 
        settings={settings} 
        onHandDetectionChange={setHandDetected}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Floating Header */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none z-20">
        <div className="animate-in fade-in slide-in-from-top duration-1000">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-400 to-fuchsia-600">
            AETHER FLUX
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-1 w-8 bg-cyan-500 rounded-full animate-pulse" />
             <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Neural Engine v2.0</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="pointer-events-auto p-4 glass rounded-2xl transition-all duration-500 hover:scale-110 active:scale-95 group"
        >
          <Settings className="w-5 h-5 text-white/70 group-hover:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      {/* Hand Interaction Legend */}
      {!handDetected && isCameraReady && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center space-y-8 z-10 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full animate-pulse" />
            <div className="w-32 h-32 mx-auto glass rounded-full flex items-center justify-center animate-bounce border-white/20">
              <Hand className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <div className="space-y-2 animate-in fade-in zoom-in duration-700 delay-300">
            <h2 className="text-xl font-bold tracking-tight text-white/90">Gesture Detected Required</h2>
            <p className="text-sm text-white/40 max-w-xs mx-auto">Move your hand into the camera view to begin interacting with the aether flux.</p>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-8 left-0 w-full px-8 flex justify-between items-end pointer-events-none z-20">
        <div className="flex gap-3">
          <div className={`px-5 py-2 glass rounded-full flex items-center gap-3 transition-all duration-500 ${handDetected ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'opacity-40'}`}>
            <div className={`w-2 h-2 rounded-full ${handDetected ? 'bg-cyan-400 animate-ping' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
              {handDetected ? 'Active Interaction' : 'Standby'}
            </span>
          </div>
          
          <div className={`px-5 py-2 glass rounded-full flex items-center gap-3 transition-all duration-500 ${isCameraReady ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
            <Camera className={`w-3 h-3 ${isCameraReady ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
              {isCameraReady ? 'Optics Online' : 'Booting...'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 opacity-20 hover:opacity-100 transition-opacity">
           <p className="text-[9px] uppercase tracking-widest font-bold">Pinch = Attract</p>
           <p className="text-[9px] uppercase tracking-widest font-bold">Palm = Repel</p>
        </div>
      </div>

      {/* Advanced Control Panel (GUI) */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md glass rounded-[2.5rem] p-10 space-y-8 relative animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest">Flux Core Settings</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <Zap className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Particle Density</label>
                  <span className="text-xs font-mono text-cyan-400">{settings.particleCount}</span>
                </div>
                <input 
                  type="range" min="500" max="5000" step="100"
                  value={settings.particleCount}
                  onChange={(e) => setSettings({...settings, particleCount: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Interaction Strength</label>
                  <span className="text-xs font-mono text-fuchsia-400">{settings.interactionStrength.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0.5" max="4.0" step="0.1"
                  value={settings.interactionStrength}
                  onChange={(e) => setSettings({...settings, interactionStrength: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Chromatic Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['cyber', 'sunset', 'nature'] as const).map(theme => (
                    <button
                      key={theme}
                      onClick={() => setSettings({...settings, colorTheme: theme})}
                      className={`relative overflow-hidden px-4 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all duration-300 ${
                        settings.colorTheme === theme 
                        ? 'bg-white/10 border-white/40 text-white shadow-lg' 
                        : 'bg-transparent border-white/5 text-white/30 hover:border-white/20'
                      }`}
                    >
                      <span className="relative z-10">{theme}</span>
                      {settings.colorTheme === theme && (
                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${
                          theme === 'cyber' ? 'from-cyan-400 to-blue-600' : 
                          theme === 'sunset' ? 'from-orange-400 to-rose-600' : 
                          'from-emerald-400 to-cyan-600'
                        }`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-5 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 transition-all duration-300 transform active:scale-[0.98]"
            >
              Apply Real-time Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
