import { useEffect } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { CRS, Icon } from 'leaflet'
import { leafletToMinecraft, formatMinecraftCoords, minecraftToLeaflet } from '@/lib/coordinates'
import { API_URL, GuessResult, pinpointUrl } from '@/lib/api'
import 'leaflet/dist/leaflet.css'
import 'leaflet/dist/leaflet.js'

const circleIconMarker = new Icon({
  iconUrl: pinpointUrl.Circle,
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0,-10],
});
const squareIconMarker = new Icon({
  iconUrl: pinpointUrl.Square,
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0,-10],
});

function MapResizeHandler({ isExpanded, isEndRoundView }: { isExpanded: boolean, isEndRoundView: boolean }) {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300)
    return () => clearTimeout(timer)
  }, [isExpanded, isEndRoundView, map])

  return null
}

function AutoFitBounds({ markerPosition, guessResult }: { markerPosition: [number, number] | null, guessResult: GuessResult | null }) {
  const map = useMap()

  useEffect(() => {
    if (markerPosition && guessResult) {
      const actualLeaflet = minecraftToLeaflet(guessResult.actualX, guessResult.actualZ)
      const bounds: [[number, number], [number, number]] = [
        [markerPosition[0], markerPosition[1]],
        [actualLeaflet.lat, actualLeaflet.lng]
      ]

      const timer = setTimeout(() => {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 })
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [markerPosition, guessResult, map])

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
  isEndRoundView: boolean,
  markerPosition: [number, number] | null,
  guessResult?: GuessResult | null,
  onMapClick: (lat: number, lng: number) => void
}

export function GameMap({ isExpanded, isEndRoundView, markerPosition, guessResult, onMapClick }: GameMapProps) {
  return (
    <MapContainer crs={CRS.Simple} center={[0, 0]} zoom={8} style={{ height: '100%', width: '100%' }}>
      <MapResizeHandler isExpanded={isExpanded} isEndRoundView={isEndRoundView} />
      <MapClickHandler onMapClick={onMapClick} />
      {guessResult && markerPosition && <AutoFitBounds markerPosition={markerPosition} guessResult={guessResult} />}
      <TileLayer
        attribution='&copy; MinecartRapidTransit'
        url={API_URL + "/tiles/{z}/{x}/{y}.png"}
        tileSize={128}
        minZoom={0}
        maxZoom={8}
        bounds={
          [[-500, -500], [500, 500]]
        }
        noWrap
      />
      <CircleMarker center={[-0.5, 0]} radius={5} color="white">
        <Popup>
          Central City
        </Popup>
      </CircleMarker>
      {markerPosition && (() => {
        const mcCoords = leafletToMinecraft(markerPosition[0], markerPosition[1])
        return (
          <Marker position={markerPosition} icon={squareIconMarker}>
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
            <Marker position={[leafletCoords.lat, leafletCoords.lng]} icon={circleIconMarker}>
              {/*<Popup>
                Actual location: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}<br />
                Distance: {guessResult.distance} blocks<br />
                Score: {guessResult.score}<br />
                Town: {guessResult.town}
              </Popup>*/}
            </Marker>
            <Polyline positions={[[markerPosition![0], markerPosition![1]], [leafletCoords.lat, leafletCoords.lng]]} />
          </>
        )
      })()}
    </MapContainer>
  )
}
