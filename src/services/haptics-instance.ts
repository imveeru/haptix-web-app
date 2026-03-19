import { WebHaptics } from 'web-haptics';

let _instance: WebHaptics | null = null;

export function getOrCreateHapticsInstance(): WebHaptics {
  if (!_instance) {
    _instance = new WebHaptics({ debug: false });
  }
  return _instance;
}

export function destroyHapticsInstance(): void {
  _instance?.destroy();
  _instance = null;
}
