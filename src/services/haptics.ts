import { WebHaptics } from 'web-haptics';
import { HapticsServiceOptions } from '../types';

interface InternalEvent {
  time: number;       // absolute seconds from video start
  delay: number;      // ms from previous event
  duration: number;   // ms
  intensity: number;  // 0-1
}

export class HapticsService {
  private haptics: WebHaptics | null = null;
  private events: InternalEvent[] = [];

  constructor(options: HapticsServiceOptions) {
    let absoluteMs = 0;
    this.events = [];
    
    // Parse the events to absolute times
    for (let i = 0; i < options.pattern.events.length; i++) {
      const step = options.pattern.events[i];
      // Skip the dummy 0/1 duration event we added at the start of JSON (if it has no delay)
      if (i === 0 && (step.delay === undefined || step.delay === null) && step.duration <= 1) {
        continue;
      }
      
      const delay = step.delay ?? 0;
      absoluteMs += delay;
      this.events.push({
        time: absoluteMs / 1000,
        delay: delay,
        duration: step.duration,
        intensity: step.intensity ?? 1,
      });
      absoluteMs += step.duration;
    }

    this.haptics = new WebHaptics();
  }

  get isSupported(): boolean {
    return !!this.haptics;
  }

  get isNativelySupported(): boolean {
    return WebHaptics.isSupported;
  }

  get hasFallbackSupport(): boolean {
    return navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad');
  }

  get isEffectivelySupported(): boolean {
    return this.isNativelySupported || this.hasFallbackSupport;
  }

  start(getCurrentTime: () => number): void {
    if (!this.haptics) return;
    
    // Stop any currently playing sequence
    this.haptics.cancel();
    
    const currentTime = getCurrentTime();
    
    // Find the first event that hasn't finished yet
    const index = this.events.findIndex(e => e.time + (e.duration / 1000) > currentTime);
    
    if (index === -1) return; // All events are in the past
    
    const pattern: any[] = [];
    const currentEvent = this.events[index];
    const timeUntilEventMs = (currentEvent.time - currentTime) * 1000;
    
    if (timeUntilEventMs > 0) {
      // Event is in the future, we need an initial padded delay.
      // web-haptics requires the first array element to be a Vibration (no delay).
      pattern.push({ duration: 1, intensity: 0 }); // Dummy initial vibration
      pattern.push({
        delay: timeUntilEventMs,
        duration: currentEvent.duration,
        intensity: currentEvent.intensity
      });
    } else {
      // Event is currently overlapping with our current time
      const remainingDuration = (currentEvent.time + (currentEvent.duration / 1000) - currentTime) * 1000;
      pattern.push({
        duration: Math.max(1, remainingDuration),
        intensity: currentEvent.intensity
      });
    }
    
    // Append the rest of the sequence
    for (let i = index + 1; i < this.events.length; i++) {
       const ev = this.events[i];
       pattern.push({
         delay: ev.delay,
         duration: ev.duration,
         intensity: ev.intensity
       });
    }
    
    this.haptics.trigger(pattern);
  }

  pause(): void {
    if (this.haptics) {
      this.haptics.cancel();
    }
  }

  stop(): void {
    this.pause();
  }

  seek(_time: number): void {
    if (this.haptics) {
      this.haptics.cancel();
    }
  }
}
