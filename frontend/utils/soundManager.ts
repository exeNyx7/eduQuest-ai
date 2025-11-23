/**
 * Sound Manager for EduQuest AI
 * Handles all sound effects with volume control and on/off toggle
 */

export type SoundType =
  | "hover"
  | "click"
  | "success"
  | "error"
  | "achievement"
  | "quest-complete"
  | "xp-gain"
  | "rank-up"
  | "notification"
  | "whoosh"
  | "pop";

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
  soundPack: "default" | "retro" | "minimal";
}

class SoundManager {
  private settings: SoundSettings;
  private sounds: Map<SoundType, HTMLAudioElement>;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.sounds = new Map();
    this.initializeSounds();
  }

  private loadSettings(): SoundSettings {
    if (typeof window === "undefined") {
      return { enabled: true, volume: 0.5, soundPack: "default" };
    }

    const stored = localStorage.getItem("eduquest_sound_settings");
    if (stored) {
      return JSON.parse(stored);
    }
    return { enabled: true, volume: 0.5, soundPack: "default" };
  }

  private saveSettings() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "eduquest_sound_settings",
        JSON.stringify(this.settings)
      );
    }
  }

  private initializeSounds() {
    if (typeof window === "undefined") return;

    // Web Audio API frequency-based sounds (no external files needed!)
    this.createBeepSound("hover", 800, 0.05, "sine");
    this.createBeepSound("click", 1000, 0.1, "sine");
    this.createBeepSound("success", 1200, 0.2, "sine");
    this.createBeepSound("error", 300, 0.3, "sawtooth");
    this.createBeepSound("achievement", 1500, 0.4, "triangle");
    this.createBeepSound("quest-complete", 1300, 0.3, "triangle");
    this.createBeepSound("xp-gain", 900, 0.15, "sine");
    this.createBeepSound("rank-up", 1600, 0.5, "triangle");
    this.createBeepSound("notification", 1100, 0.2, "sine");
    this.createBeepSound("whoosh", 600, 0.15, "sine");
    this.createBeepSound("pop", 1400, 0.1, "sine");
  }

  private createBeepSound(
    type: SoundType,
    frequency: number,
    duration: number,
    waveType: OscillatorType = "sine"
  ) {
    // Create a data URL for the beep sound
    // This is a simple implementation - in production, you'd use Web Audio API or real sound files
    const canvas = document.createElement("canvas");
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    
    // Create silent audio (placeholder - sounds will be generated via Web Audio API on play)
    const audio = new Audio();
    audio.volume = this.settings.volume;
    
    // Store metadata for Web Audio API generation
    (audio as any)._soundData = { frequency, duration, waveType };
    
    this.sounds.set(type, audio);
  }

  private playWithWebAudio(frequency: number, duration: number, waveType: OscillatorType) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = waveType;

    // Envelope for smoother sound
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.settings.volume * 0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  play(type: SoundType) {
    if (!this.settings.enabled) return;

    const audio = this.sounds.get(type);
    if (audio) {
      const soundData = (audio as any)._soundData;
      if (soundData) {
        this.playWithWebAudio(
          soundData.frequency,
          soundData.duration,
          soundData.waveType
        );
      }
    }
  }

  // Settings methods
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    
    // Update all audio elements
    this.sounds.forEach((audio) => {
      audio.volume = this.settings.volume;
    });
  }

  setSoundPack(pack: SoundSettings["soundPack"]) {
    this.settings.soundPack = pack;
    this.saveSettings();
    
    // Re-initialize sounds with new pack
    this.sounds.clear();
    this.initializeSounds();
  }

  toggle() {
    this.settings.enabled = !this.settings.enabled;
    this.saveSettings();
    return this.settings.enabled;
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

// Helper hook for React components
export function useSound() {
  const soundManager = getSoundManager();

  return {
    play: (type: SoundType) => soundManager.play(type),
    settings: soundManager.getSettings(),
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
    setVolume: (volume: number) => soundManager.setVolume(volume),
    setSoundPack: (pack: SoundSettings["soundPack"]) => soundManager.setSoundPack(pack),
    toggle: () => soundManager.toggle(),
  };
}

export default getSoundManager;
