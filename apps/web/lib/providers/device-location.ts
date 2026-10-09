export type DeviceLocation = { latitude: number; longitude: number; accuracy_m: number; method: 'gps' };
type DeviceGeolocation = Pick<Geolocation, 'getCurrentPosition'>;

// One explicit device request. Abort discards callbacks; it cannot cancel the OS prompt.
// No watch, storage, network transport, raw device payload or error-message logging.
export function locateDevice(device: DeviceGeolocation | null | undefined, signal: AbortSignal): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Location request cancelled.', 'AbortError')); return; }
    if (!device) { reject(new Error('Device location is unavailable in this browser. Place your field pin manually or skip location.')); return; }
    let settled = false;
    const finish = (result: DeviceLocation | Error) => {
      if (settled) return; settled = true; signal.removeEventListener('abort', abort);
      if (result instanceof Error) reject(result); else resolve(result);
    };
    const abort = () => finish(new DOMException('Location request cancelled.', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    try {
      device.getCurrentPosition(position => {
        if (settled || signal.aborted) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(accuracy) || accuracy < 0) {
          finish(new Error('The device returned an invalid location. Retry or place your field pin manually.')); return;
        }
        finish({ latitude, longitude, accuracy_m: accuracy, method: 'gps' });
      }, failure => {
        if (settled || signal.aborted) return;
        const message = failure.code === 1 ? 'Location access was denied. Allow it for this site in your browser/device settings, or place the pin manually.'
          : failure.code === 3 ? 'Finding your location timed out. Retry outdoors, place the pin manually, or skip location.'
          : 'Your device could not determine its location. Check device location services, retry, or place the pin manually.';
        finish(new Error(message));
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } catch { finish(new Error('Device location could not start. Retry, place the pin manually, or skip location.')); }
  });
}
