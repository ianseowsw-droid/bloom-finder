export type FieldLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function formatCoords(location: FieldLocation) {
  const lat = location.latitude.toFixed(5);
  const lng = location.longitude.toFixed(5);
  return `${lat}, ${lng}`;
}

export function getCurrentFieldLocation(): Promise<FieldLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => reject(new Error("Location permission was denied or unavailable.")),
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 12_000,
      },
    );
  });
}
