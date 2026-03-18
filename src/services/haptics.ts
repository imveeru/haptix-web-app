import { WebHaptics, Vibration } from 'web-haptics';
import { HapticsServiceOptions } from '../types';

export class HapticsService {
  private pattern: Vibration[] = [];
  private initialDelay = 0;
  private haptics: WebHaptics | null = null;
  private triggerTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HapticsServiceOptions) {
    for (let i = 0; i < options.pattern.events.length; i++) {
      const step = options.pattern.events[i];
      // Skip dummy 0/1 duration event at the start (no delay, tiny duration)
      if (i === 0 && !step.delay && step.duration <= 1) continue;

      const delay = step.delay ?? 0;

      if (this.pattern.length === 0) {
        // First real event — no delay on the entry, store delay for setTimeout
        this.initialDelay = delay;
        this.pattern.push({ duration: step.duration, intensity: step.intensity ?? 1 });
      } else {
        this.pattern.push({ delay, duration: step.duration, intensity: step.intensity ?? 1 });
      }
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

  start(): void {
    if (this.triggerTimeout !== null) {
      clearTimeout(this.triggerTimeout);
      this.triggerTimeout = null;
    }
    this.haptics?.cancel();

    if (this.pattern.length === 0) return;

    console.log('[Haptics] Final pattern:', this.pattern);

    this.haptics = new WebHaptics();

    if (this.initialDelay > 0) {
      this.triggerTimeout = setTimeout(() => {
        this.triggerTimeout = null;
        this.haptics?.trigger(this.pattern);
      }, this.initialDelay);
    } else {
      this.haptics.trigger(this.pattern);
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
