import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { CRS } from 'leaflet'
import { leafletToMinecraft, formatMinecraftCoords, minecraftToLeaflet } from '@/lib/coordinates'
import { GuessResult } from '@/lib/api'

import 'leaflet/dist/leaflet.css'
import 'leaflet/dist/leaflet.js'


function MapResizeHandler({ isExpanded }: { isExpanded: boolean }) {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300)
    return () => clearTimeout(timer)
  }, [isExpanded, map])

  return null
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      console.log('Map clicked at', e.latlng)
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface GameMapProps {
  isExpanded: boolean
  markerPosition: [number, number] | null,
  guessResult?: GuessResult | null,
  onMapClick: (lat: number, lng: number) => void
}

export function GameMap({ isExpanded, markerPosition, guessResult, onMapClick }: GameMapProps) {
  return (
    <MapContainer crs={CRS.Simple} center={[0, 0]} zoom={8} style={{ height: '100%', width: '100%' }}>
      <MapResizeHandler isExpanded={isExpanded} />
      <MapClickHandler onMapClick={onMapClick} />
      <TileLayer
        attribution='&copy; MinecartRapidTransit'
        url="http://localhost:5000/api/tiles/{z}/{x}/{y}.png"
        tileSize={128}
        minZoom={0}
        maxZoom={8}
        // bounds={
        //   [[-0, 0], [61, 61]]
        // }
        noWrap
      />
      {markerPosition && (() => {
        const mcCoords = leafletToMinecraft(markerPosition[0], markerPosition[1])
        return (
          <Marker position={markerPosition}>
            <Popup>
              Your guess: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}
            </Popup>
          </Marker>
        )
      })()}
      {guessResult && (() => {
        const mcCoords = { x: guessResult.actualX, z: guessResult.actualZ };
        const leafletCoords = minecraftToLeaflet(mcCoords.x, mcCoords.z);
        console.log('Actual location in Leaflet coords:', leafletCoords);
        return (
          <>
            <Marker position={[leafletCoords.lat, leafletCoords.lng]}>
              <Popup>
                Actual location: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}<br />
                Distance: {guessResult.distance} blocks<br />
                Score: {guessResult.score}<br />
                Town: {guessResult.town}
              </Popup>
            </Marker>
            <Polyline positions={[[markerPosition![0], markerPosition![1]], [leafletCoords.lat, leafletCoords.lng]]} />
          </>
        )
      })()}
    </MapContainer>
  )
}
