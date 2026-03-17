import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { CRS, Icon } from 'leaflet'
import { leafletToMinecraft, formatMinecraftCoords, minecraftToLeaflet } from '@/lib/coordinates'
import { API_URL, GuessResult, pinpointUrl, getPlayerFaceUrl } from '@/lib/api'
import { Fragment } from 'react'

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

function AutoFitBounds({ markerPosition, guessResult, playerPositions }: { markerPosition: [number, number] | null, guessResult: GuessResult | null, playerPositions?: Record<string, [number, number]> }) {
  const map = useMap()

  useEffect(() => {
    if (!guessResult) return;
    const actualLeaflet = minecraftToLeaflet(guessResult.actualX, guessResult.actualZ)
    const allPositions: [number, number][] = [[actualLeaflet.lat, actualLeaflet.lng]];

    // Include all player positions if present, otherwise fall back to markerPosition
    const playerPosValues = playerPositions ? Object.values(playerPositions) : [];
    if (playerPosValues.length > 0) {
      allPositions.push(...playerPosValues);
    } else if (markerPosition) {
      allPositions.push(markerPosition);
    }

    if (allPositions.length < 2) return;

    const lats = allPositions.map(p => p[0]);
    const lngs = allPositions.map(p => p[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];

    const timer = setTimeout(() => {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 })
    }, 100)

    return () => clearTimeout(timer)
  }, [markerPosition, guessResult, playerPositions, map])

  return null
}

function AutoCenterOnPlayer({ markerPosition, isMcGuessMode, playerPositions }: { markerPosition: [number, number] | null, isMcGuessMode: boolean, playerPositions?: Record<string, [number, number]> }) {
  const map = useMap()

  useEffect(() => {
    if (!isMcGuessMode) return;
    // If multiple players, fit bounds to show all; otherwise center on single player
    const positions = playerPositions ? Object.values(playerPositions) : [];
    if (positions.length > 1) {
      const lats = positions.map(p => p[0]);
      const lngs = positions.map(p => p[1]);
      map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [40, 40], maxZoom: 6, animate: true });
    } else if (markerPosition) {
      map.setView(markerPosition, map.getZoom(), { animate: true, duration: 0.5 })
    }
  }, [markerPosition, isMcGuessMode, playerPositions, map])

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
  isMcGuessMode?: boolean,
  // New: support multiple players
  mcGuessPlayers?: string[],
  playerPositions?: Record<string, [number, number]>,
  // Legacy single-player support (kept for backward compat)
  mcGuessPlayer?: string | null
}

export function GameMap({ isExpanded, isEndRoundView, markerPosition, guessResult, onMapClick, isMcGuessMode = false, mcGuessPlayers = [], playerPositions = {}, mcGuessPlayer = null }: GameMapProps) {
  // Build a map of player name -> Leaflet Icon for all tracked players
  const playerFaceIcons = useMemo(() => {
    const icons: Record<string, Icon> = {};
    const players = mcGuessPlayers.length > 0 ? mcGuessPlayers : (mcGuessPlayer ? [mcGuessPlayer] : []);
    if (isMcGuessMode) {
      for (const name of players) {
        icons[name] = new Icon({
          iconUrl: getPlayerFaceUrl(name),
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -13],
          className: 'pixelated-icon',
        });
      }
    }
    return icons;
  }, [isMcGuessMode, mcGuessPlayers, mcGuessPlayer]);

  // Effective positions: prefer playerPositions map, fall back to legacy markerPosition for single player
  const effectivePositions: Record<string, [number, number]> = useMemo(() => {
    if (Object.keys(playerPositions).length > 0) return playerPositions;
    if (mcGuessPlayer && markerPosition) return { [mcGuessPlayer]: markerPosition };
    return {};
  }, [playerPositions, mcGuessPlayer, markerPosition]);

  return (
    <MapContainer crs={CRS.Simple} center={[0, 0]} zoom={0} style={{ height: '100%', width: '100%', cursor: 'pointer' } }>
      <MapResizeHandler isExpanded={isExpanded} isEndRoundView={isEndRoundView} />
      <MapClickHandler onMapClick={onMapClick} />
      {guessResult && (markerPosition || Object.keys(effectivePositions).length > 0) && <AutoFitBounds markerPosition={markerPosition} guessResult={guessResult} playerPositions={isMcGuessMode ? effectivePositions : undefined} />}
      {isMcGuessMode && !isEndRoundView && (
        <AutoCenterOnPlayer
          markerPosition={markerPosition}
          isMcGuessMode={isMcGuessMode}
          playerPositions={effectivePositions}
        />
      )}
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

      {/* MC Guess mode: render a marker for each tracked player */}
      {isMcGuessMode && Object.entries(effectivePositions).map(([name, pos]) => {
        const icon = playerFaceIcons[name];
        const mcCoords = leafletToMinecraft(pos[0], pos[1]);
        return (
          <Fragment key={name}>
            <Marker position={pos} icon={icon || guessIconMarker}>
              <Popup>
                {name}: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}
              </Popup>
            </Marker>
          </Fragment>
        );
      })}

      {/* Normal guess mode: single pin dropped by clicking */}
      {!isMcGuessMode && markerPosition && (() => {
        const mcCoords = leafletToMinecraft(markerPosition[0], markerPosition[1])
        return (
          <Marker position={markerPosition} icon={guessIconMarker}>
            <Popup>
              Your guess: {formatMinecraftCoords(mcCoords.x, mcCoords.z)}
            </Popup>
          </Marker>
        )
      })()}

      {guessResult && (() => {
        const actualLeaflet = minecraftToLeaflet(guessResult.actualX, guessResult.actualZ);
        const actualPos: [number, number] = [actualLeaflet.lat, actualLeaflet.lng];

        // In MC_GUESS mode draw a line from each player to the actual location;
        // in normal mode draw a single line from the guess pin.
        const lineOrigins: [string, [number, number]][] = isMcGuessMode
          ? Object.entries(effectivePositions)
          : (markerPosition ? [['guess', markerPosition]] : []);

        if (lineOrigins.length === 0 && !markerPosition) return null;

        return (
          <>
            <Marker position={actualPos} icon={actualIconMarker} />
            {lineOrigins.map(([key, pos]) => (
              <Polyline key={key} positions={[pos, actualPos]} color="black" dashArray="5, 10" />
            ))}
          </>
        );
      })()}
    </MapContainer>
  )
}
