import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { useState, useEffect } from 'react'
import { fetchRoundData, postGuess, GuessResult } from '@/lib/api'
import { useHeader } from '@/contexts/HeaderContext'
import { GameMap } from '@/components/GameMap'
import GuessButton from '@/components/GuessButton'
import { leafletToMinecraft } from '@/lib/coordinates'

export const Route = createFileRoute('/game/')({
  ssr: false,
  component: RouteComponent,
})

function HeaderContent({ roundNumber, timeLeft }: { roundNumber: number; timeLeft: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-lg font-semibold">
        Round {roundNumber}
      </div>
      <div className="text-lg font-mono">
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </div>
    </div>
  )
}

function RouteComponent() {
  const { setCenterContent } = useHeader()
  let [panoramaId, setPanoramaId] = useState();
  let [roundNumber, setRoundNumber] = useState(1);
  let [timeLeft, setTimeLeft] = useState(60);
  let [isMapExpanded, setIsMapExpanded] = useState(false);
  let [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  let [guessResult, setGuessResult] = useState<GuessResult | null>(null);

  async function getRoundData() {
    let data = await fetchRoundData();
    setPanoramaId(data.panoramaId);
    setTimeLeft(60);
  }

  useEffect(() => {
    const handleRefresh = () => {
      getRoundData();
    };

    window.addEventListener('game-refresh', handleRefresh);
    return () => window.removeEventListener('game-refresh', handleRefresh);
  }, []);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  useEffect(() => {
    setCenterContent(
      <HeaderContent roundNumber={roundNumber} timeLeft={timeLeft} />
    );
    return () => setCenterContent(null);
  }, [roundNumber, timeLeft, setCenterContent]);

  if (!panoramaId) {
    getRoundData();
    return <div>Loading...</div>;
  }
  return (
    <div className="relative" style={{ height: 'calc(100vh - 72px)' }}>
      
      <div className="w-full h-full bg-black">
        <ReactPhotoSphereViewer
          src={`http://localhost:5000/api/panorama/${panoramaId}`}
          height="100%"
          width="100%"
        ></ReactPhotoSphereViewer>
      </div>
      <div
        className="absolute bottom-15 right-4 w-[20%] h-[20%] hover:w-[50%] hover:h-[50%] bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-10"
        onMouseEnter={() => setIsMapExpanded(true)}
        onMouseLeave={() => setIsMapExpanded(false)}
      >
        <ClientOnly>
          <GameMap
            isExpanded={isMapExpanded}
            markerPosition={markerPosition}
            guessResult={guessResult}
            onMapClick={(lat, lng) => setMarkerPosition([lat, lng])}
          />
        </ClientOnly>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-[1000]">
          <GuessButton onClick={async () => { 
            if (markerPosition) {
              let coords = leafletToMinecraft(markerPosition[0], markerPosition[1]);
              console.log(`Guessing at Minecraft coords: x=${coords.x}, z=${coords.z}`);
              let result = await postGuess(panoramaId, coords.x, coords.z);
              setGuessResult(result);
            }
           }} />
        </div>
      </div>
    </div>
  )
}
