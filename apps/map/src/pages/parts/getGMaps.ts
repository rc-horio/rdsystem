export const getGMaps = () =>
  (window as any).google.maps as unknown as typeof google.maps;
