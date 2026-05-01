export type GeoCoords = { lat: number; lng: number };

export async function getCurrentPosition(timeoutMs = 8000): Promise<GeoCoords | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: GeoCoords | null) => {
      if (done) return;
      done = true;
      resolve(v);
    };
    const t = setTimeout(() => finish(null), timeoutMs);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(t);
          finish({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(t);
          finish(null);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
      );
    } catch {
      clearTimeout(t);
      finish(null);
    }
  });
}
