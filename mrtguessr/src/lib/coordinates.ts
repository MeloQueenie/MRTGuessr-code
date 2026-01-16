/**
 * Converts between Leaflet CRS.Simple coordinates and Minecraft world coordinates
 *
 * Minecraft world: -30000 to 30000 on both X and Z axes
 * Map coordinates: Uses CRS.Simple with tileSize 128 at zoom level 8
 *
 * Coordinate mapping:
 * - Leaflet lng (X axis) → Minecraft X (east-west)
 * - Leaflet lat (Y axis) → Minecraft Z (north-south)
 *
 * Scale factor: Each map unit × SCALE_FACTOR = Minecraft blocks
 */

// Scale factor to convert map coordinates to Minecraft coordinates
// Minecraft world range: 60000 blocks (-30000 to 30000)
// Map coordinate range: 
export const SCALE_FACTOR = 64

// Maximum Minecraft coordinate
export const MC_MAX = 30000

// Maximum map coordinate (MC_MAX / SCALE_FACTOR)
export const MAP_MAX = MC_MAX / SCALE_FACTOR

/**
 * Converts Leaflet CRS.Simple coordinates to Minecraft world coordinates
 * @param lat Leaflet latitude (Y axis, corresponds to Minecraft Z - north/south)
 * @param lng Leaflet longitude (X axis, corresponds to Minecraft X - east/west)
 * @returns Object with minecraft X and Z coordinates, clamped to world bounds
 */
export function leafletToMinecraft(lat: number, lng: number): { x: number; z: number } {
  // Direct scaling: map coordinates × 64 = Minecraft coordinates
  let x = Math.round(lng * SCALE_FACTOR)
  let z = Math.round(-lat * SCALE_FACTOR) // Negate lat to flip Z axis

  // Clamp to Minecraft world bounds
  x = Math.max(-MC_MAX, Math.min(MC_MAX, x))
  z = Math.max(-MC_MAX, Math.min(MC_MAX, z))

  return { x, z }
}

/**
 * Converts Minecraft world coordinates to Leaflet CRS.Simple coordinates
 * @param x Minecraft X coordinate (east-west)
 * @param z Minecraft Z coordinate (north-south)
 * @returns Object with leaflet lat and lng
 */
export function minecraftToLeaflet(x: number, z: number): { lat: number; lng: number } {
  // Inverse scaling: Minecraft coordinates / 61 = map coordinates
  const lng = x / SCALE_FACTOR
  const lat = -z / SCALE_FACTOR // Negate z to flip Z axis

  return { lat, lng }
}

/**
 * Formats Minecraft coordinates as a string
 */
export function formatMinecraftCoords(x: number, z: number): string {
  return `X: ${x}, Z: ${z}`
}
