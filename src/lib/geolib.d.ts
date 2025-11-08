declare module 'geolib/es/getDistance' {
  interface Coordinates {
    latitude: number;
    longitude: number;
  }

  function getDistance(
    start: Coordinates,
    end: Coordinates,
    accuracy?: number
  ): number;

  export default getDistance;
}
