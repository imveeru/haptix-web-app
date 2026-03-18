import { WebHaptics, Vibration } from 'web-haptics';
import { HapticsServiceOptions } from '../types';

interface InternalEvent {
  time: number;       // absolute seconds from video start
  duration: number;   // ms
  intensity: number;  // 0-1
}

export class HapticsService {
  private haptics: WebHaptics | null = null;
  private rafId: number | null = null;
  private events: InternalEvent[] = [];
  private eventIndex: number = 0;

  constructor(options: HapticsServiceOptions) {
    // Convert relative-delay format to absolute times
    let absoluteMs = 0;
    this.events = options.pattern.events.map((step) => {
      absoluteMs += (step.delay ?? 0);
      const event: InternalEvent = {
        time: absoluteMs / 1000,
        duration: step.duration,
        intensity: step.intensity,
      };
      absoluteMs += step.duration;
      return event;
    });

    // web-haptics provides an iOS fallback hack when navigator.vibrate is absent,
    // so we should always instantiate it.
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
    if (!this.isSupported) return;
    if (this.rafId !== null) return;

    const loop = () => {
      const currentTime = getCurrentTime();
      this.checkTriggers(currentTime);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  pause(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.haptics) {
      this.haptics.cancel();
    }
  }

  stop(): void {
    this.pause();
    this.eventIndex = 0;
  }

  seek(time: number): void {
    this.eventIndex = this.events.findIndex(e => e.time >= time);
    if (this.eventIndex === -1) {
      this.eventIndex = this.events.length;
    }
    if (this.haptics) {
      this.haptics.cancel();
    }
  }

  private checkTriggers(currentTime: number): void {
    if (!this.haptics) return;

    while (this.eventIndex < this.events.length) {
      const event = this.events[this.eventIndex];
      // Fire if current time is at or past the event time
      if (currentTime >= event.time) {
        // Only trigger if we haven't skipped past it by too much tracking distance (e.g. 0.1s lag spike)
        if (currentTime <= event.time + 0.1) {
          const vibration: Vibration = {
            duration: event.duration,
            intensity: event.intensity
          };
          this.haptics.trigger([vibration]);
        }
        this.eventIndex++;
      } else {
        // Event is still in the future
        break;
      }
    }
  }
}
