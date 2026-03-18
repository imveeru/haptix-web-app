import { WebHaptics, Vibration } from 'web-haptics';
import { HapticsServiceOptions } from '../types';

interface InternalEvent {
  time: number;       // absolute seconds from video start
  delay: number;      // ms from end of previous event
  duration: number;   // ms
  intensity: number;  // 0-1
}

export class HapticsService {
  private events: InternalEvent[] = [];
  private haptics: WebHaptics | null = null;
  private triggerTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HapticsServiceOptions) {
    let absoluteMs = 0;

    for (let i = 0; i < options.pattern.events.length; i++) {
      const step = options.pattern.events[i];
      // Skip dummy 0/1 duration event at the start of JSON (if it has no delay)
      if (i === 0 && (step.delay === undefined || step.delay === null) && step.duration <= 1) {
        continue;
      }

      const delay = step.delay ?? 0;
      absoluteMs += delay;
      this.events.push({
        time: absoluteMs / 1000,
        delay,
        duration: step.duration,
        intensity: step.intensity ?? 1,
      });
      absoluteMs += step.duration;
    }
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
    // Cancel any in-progress haptics and pending trigger
    if (this.triggerTimeout !== null) {
      clearTimeout(this.triggerTimeout);
      this.triggerTimeout = null;
    }
    this.haptics?.cancel();

    const currentTime = getCurrentTime();

    // Find the first event that hasn't finished yet
    const startIndex = this.events.findIndex(e => e.time + e.duration / 1000 > currentTime);
    if (startIndex === -1) return;

    const pattern: Vibration[] = [];
    const first = this.events[startIndex];
    const msUntilFirst = (first.time - currentTime) * 1000;
    let triggerDelay = 0;

    if (msUntilFirst > 0) {
      // Event is in the future — defer the trigger, no delay on first pattern entry
      triggerDelay = msUntilFirst;
      pattern.push({ duration: first.duration, intensity: first.intensity });
    } else {
      // We're mid-event — play the remaining portion
      const remaining = (first.time + first.duration / 1000 - currentTime) * 1000;
      pattern.push({ duration: Math.max(1, remaining), intensity: first.intensity });
    }

    for (let i = startIndex + 1; i < this.events.length; i++) {
      const ev = this.events[i];
      pattern.push({ delay: ev.delay, duration: ev.duration, intensity: ev.intensity });
    }

    console.log('[Haptics] Final pattern:', pattern);

    // Create a fresh instance and trigger once — same approach as Test Haptics
    this.haptics = new WebHaptics();
    if (triggerDelay > 0) {
      this.triggerTimeout = setTimeout(() => {
        this.triggerTimeout = null;
        this.haptics?.trigger(pattern);
      }, triggerDelay);
    } else {
      this.haptics.trigger(pattern);
    }
  }

  stop(): void {
    if (this.triggerTimeout !== null) {
      clearTimeout(this.triggerTimeout);
      this.triggerTimeout = null;
    }
    this.haptics?.cancel();
  }
}
