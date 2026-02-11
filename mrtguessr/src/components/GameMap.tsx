import { useEffect } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { CRS, Icon } from 'leaflet'
import { leafletToMinecraft, formatMinecraftCoords, minecraftToLeaflet } from '@/lib/coordinates'
import { API_URL, GuessResult, pinpointUrl } from '@/lib/api'

const actualIconMarker = new Icon({
  iconUrl: pinpointUrl.Actual,
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0,-10],
});
const guessIconMarker = new Icon({
  iconUrl: pinpointUrl.Guess,
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

function AutoCenterOnPlayer({ markerPosition, isMcGuessMode }: { markerPosition: [number, number] | null, isMcGuessMode: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (isMcGuessMode && markerPosition) {
      map.setView(markerPosition, map.getZoom(), { animate: true, duration: 0.5 })
    }
  }, [markerPosition, isMcGuessMode, map])

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
  onMapClick: (lat: number, lng: number) => void,
  isMcGuessMode?: boolean
}

export function GameMap({ isExpanded, isEndRoundView, markerPosition, guessResult, onMapClick, isMcGuessMode = false }: GameMapProps) {
  return (
    <MapContainer crs={CRS.Simple} center={[0, 0]} zoom={4} style={{ height: '100%', width: '100%', cursor: 'pointer' } }>
      <MapResizeHandler isExpanded={isExpanded} isEndRoundView={isEndRoundView} />
      <MapClickHandler onMapClick={onMapClick} />
      {guessResult && markerPosition && <AutoFitBounds markerPosition={markerPosition} guessResult={guessResult} />}
      {isMcGuessMode && !isEndRoundView && <AutoCenterOnPlayer markerPosition={markerPosition} isMcGuessMode={isMcGuessMode} />}
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
          <Marker position={markerPosition} icon={guessIconMarker}>
            <Popup>
              Your guess: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}
            </Popup>
          </Marker>
        )
      })()}
      {guessResult && markerPosition && (() => {
        const mcCoords = { x: guessResult.actualX, z: guessResult.actualZ };
        const leafletCoords = minecraftToLeaflet(mcCoords.x, mcCoords.z);
        console.log('Actual location in Leaflet coords:', leafletCoords);
        return (
          <>
            <Marker position={[leafletCoords.lat, leafletCoords.lng]} icon={actualIconMarker}>
              {/*<Popup>
                Actual location: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}<br />
                Distance: {guessResult.distance} blocks<br />
                Score: {guessResult.score}<br />
                Town: {guessResult.town}
              </Popup>*/}
            </Marker>
            <Polyline positions={[[markerPosition![0], markerPosition![1]], [leafletCoords.lat, leafletCoords.lng]]} color="black" dashArray="5, 10" />
          </>
        )
      })()}
    </MapContainer>
  )
}
