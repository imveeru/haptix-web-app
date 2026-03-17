import { WebHaptics } from 'web-haptics';
import { HapticsServiceOptions } from '../types';

interface InternalEvent {
  time: number;       // absolute seconds from video start
  duration: number;   // ms
  intensity: number;  // 0-1
}

export class HapticsService {
  private haptics: WebHaptics | null = null;
  private timerId: number | null = null;
  private events: InternalEvent[] = [];
  private eventIndex: number = 0;
  private onEvent?: (event: InternalEvent) => void;

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
    if (this.timerId !== null) return;

    this.timerId = window.setInterval(() => {
      const currentTime = getCurrentTime();
      this.checkTriggers(currentTime);
    }, 100);
  }

  pause(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
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
  }

  private checkTriggers(currentTime: number): void {
    if (!this.haptics) return;

    while (this.eventIndex < this.events.length) {
      const event = this.events[this.eventIndex];
      // Fire if current time is within 0.05s of the event time
      if (currentTime >= event.time - 0.05 && currentTime <= event.time + 0.05) {
        this.haptics.trigger([{ duration: event.duration, intensity: event.intensity }] as any);
        if (this.onEvent) {
          this.onEvent(event);
        }
        this.eventIndex++;
      } else if (currentTime > event.time + 0.05) {
        // Skip over missed events (e.g., if user seeked past them)
        this.eventIndex++;
      } else {
        // Event is still in the future
        break;
      }
    }
  }
}
