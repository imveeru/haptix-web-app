import { WebHaptics } from 'web-haptics';
import { HapticsServiceOptions, HapticEvent } from '../types';

export class HapticsService {
  private haptics: WebHaptics | null = null;
  private timerId: number | null = null;
  private events: HapticEvent[] = [];
  private eventIndex: number = 0;
  private onEvent?: (event: HapticEvent) => void;

  constructor(options: HapticsServiceOptions) {
    this.events = options.pattern.events.sort((a, b) => a.time - b.time);
    this.onEvent = options.onEvent;

    if (WebHaptics.isSupported) {
      this.haptics = new WebHaptics();
    } else {
      if (options.onUnsupported) {
        options.onUnsupported();
      }
    }
  }

  get isSupported(): boolean {
    return !!this.haptics;
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
        // Safe to call trigger with any of the supported types
        this.haptics.trigger(event.trigger as any);
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
