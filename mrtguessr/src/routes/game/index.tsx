import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  let [isEndRoundView, setIsEndRoundView] = useState(false);

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
        className={`
          absolute ${isEndRoundView ? `bottom-[25%] right-4 w-[98%] h-[80%]` : `bottom-15 right-4 w-[25%] h-[25%] hover:w-[50%] hover:h-[50%]`}
           bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-10
        `}
        onMouseEnter={() => setIsMapExpanded(true)}
        onMouseLeave={() => setIsMapExpanded(false)}
      >
        <ClientOnly>
          <GameMap
            isExpanded={isMapExpanded}
            isEndRoundView={isEndRoundView}
            markerPosition={markerPosition}
            guessResult={guessResult}
            onMapClick={(lat, lng) => setMarkerPosition([lat, lng])}
          />
        </ClientOnly>
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-[1000] transition-all duration-300 ease-in-out ${!isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <GuessButton onClick={async () => { 
            if (markerPosition) {
              let coords = leafletToMinecraft(markerPosition[0], markerPosition[1]);
              console.log(`Guessing at Minecraft coords: x=${coords.x}, z=${coords.z}`);
              let result = await postGuess(panoramaId, coords.x, coords.z);
              setGuessResult(result);
              setIsEndRoundView(true);
            }
           }} />
        </div>
      </div>
      {/* Endgame view stats - a white background color rectangle below the map, rounded and height 20% */}
      <div className={`absolute flex justify-center items-center flex-col
        bottom-4 left-1/2 -translate-x-1/2 w-[98%] h-[22%] rounded-lg z-[1000] transition-all duration-300 ease-in-out bg-slate-200 p-4 ${isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-2xl font-bold">Score: {guessResult?.score}</h1>
        <p>Distance: {guessResult?.distance}</p>
        <p>Actual Location: {guessResult?.town} ({guessResult?.actualX}, {guessResult?.actualZ})</p>
        <Button variant={"outline"} className="mt-4" onClick={() => {
          // Reset for next round
          getRoundData();
          setIsEndRoundView(false);
          setMarkerPosition(null);
          setGuessResult(null);
        }}>Next Round</Button>
      </div>
    </div>
  )
}
