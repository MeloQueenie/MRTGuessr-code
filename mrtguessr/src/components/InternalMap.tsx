import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { CRS } from 'leaflet'
import { useQuery } from '@tanstack/react-query'
import { API_URL, fetchInternalPanoramaData, fetchDynmapNewData } from '@/lib/api'
import { minecraftToLeaflet } from '@/lib/coordinates'

// Generate a stable colour from a string (town name)
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert hash to HSL for better colour distribution
  const hue = Math.abs(hash % 360)
  const saturation = 65 + (Math.abs(hash >> 8) % 20) // 65-85%
  const lightness = 45 + (Math.abs(hash >> 16) % 15) // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export function InternalMap() {
  const { data: panoramaData, isLoading, error } = useQuery({
    queryKey: ['internalPanoramaData'],
    queryFn: fetchInternalPanoramaData,
  })

  const { data: dynmapData } = useQuery({
    queryKey: ['dynmapData'],
    queryFn: fetchDynmapNewData,
    refetchInterval: 1000, // Refresh player positions every 1 second
  })

  return (
    <div className="fixed inset-x-0 bottom-0 top-[72px]">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading panoramas...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="text-red-500">Error loading panoramas: {error.message}</div>
        </div>
      )}
      <MapContainer
        crs={CRS.Simple}
        center={[0, 0]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        minZoom={0}
        maxZoom={8}
      >
        <TileLayer
          attribution='&copy; MinecartRapidTransit'
          url={API_URL + "/tiles/{z}/{x}/{y}.png"}
          tileSize={128}
          minZoom={0}
          maxZoom={8}
          bounds={[[-500, -500], [500, 500]]}
          noWrap
        />
        {panoramaData && Object.entries(panoramaData).map(([panoramaId, data]) => {
          const { lat, lng } = minecraftToLeaflet(data.x, data.z)
          const townColor = stringToColor(data.town)
          return (
            <CircleMarker
              key={panoramaId}
              center={[lat, lng]}
              radius={3}
              color={townColor}
              fillColor={townColor}
              fillOpacity={0.6}
            >
              <Popup>
                <div>
                  <strong>Panorama #{panoramaId}</strong><br />
                  Town: {data.town}<br />
                  Rank: {data.rank}<br />
                  {data.notes && <>Notes: {data.notes}<br /></>}
                  Coords: ({data.x}, {data.z})
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
        {dynmapData && dynmapData.players
          .filter(player => player.world === 'new')
          .map(player => {
            const { lat, lng } = minecraftToLeaflet(player.x, player.z)
            return (
              <CircleMarker
                key={player.account}
                center={[lat, lng]}
                radius={5}
                color="blue"
                fillColor="cyan"
                fillOpacity={0.8}
              >
                <Popup>
                  <div>
                    <strong>{player.name}</strong><br />
                    World: {player.world}<br />
                    Coords: ({Math.round(player.x)}, {Math.round(player.y)}, {Math.round(player.z)})
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
      </MapContainer>
    </div>
  )
}
