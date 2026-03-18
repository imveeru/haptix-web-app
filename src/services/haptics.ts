import { Vibration } from 'web-haptics';
import { HapticsServiceOptions } from '../types';

export class HapticsService {
  readonly pattern: Vibration[] = [];
  readonly initialDelay: number = 0;

  constructor(options: HapticsServiceOptions) {
    for (let i = 0; i < options.pattern.events.length; i++) {
      const step = options.pattern.events[i];
      // Skip dummy 0/1 duration event at the start (no delay, tiny duration)
      if (i === 0 && !step.delay && step.duration <= 1) continue;

      const delay = step.delay ?? 0;

      if (this.pattern.length === 0) {
        // First real event — no delay on the entry, store it for setTimeout
        (this as any).initialDelay = delay;
        this.pattern.push({ duration: step.duration, intensity: step.intensity ?? 1 });
      } else {
        this.pattern.push({ delay, duration: step.duration, intensity: step.intensity ?? 1 });
      }
    }
  }

  static isNativelySupported(): boolean {
    // Import-free check using the same underlying API web-haptics uses
    return 'vibrate' in navigator;
  }

  static isEffectivelySupported(): boolean {
    return HapticsService.isNativelySupported() ||
      navigator.userAgent.includes('iPhone') ||
      navigator.userAgent.includes('iPad');
  }
}
