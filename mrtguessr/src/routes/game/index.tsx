import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { useState, useEffect, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { Button } from '@/components/ui/button'
import { fetchRoundData, postGuess, GuessResult, logoUrl } from '@/lib/api'
import { useHeader } from '@/contexts/HeaderContext'
import { GameMap } from '@/components/GameMap'
import GuessButton from '@/components/GuessButton'
import { leafletToMinecraft } from '@/lib/coordinates'
import confettiAnimation from '@/components/Confetti.json'
import { ArrowRight, Repeat } from 'lucide-react'

export const Route = createFileRoute('/game/')({
  ssr: false,
  component: RouteComponent,
})

function HeaderContent({ roundNumber, timeLeft }: { roundNumber: number; timeLeft: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-lg font-semibold">
        Round {roundNumber} / 5
      </div>
      <div className="text-lg font-mono">
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </div>
    </div>
  )
}

function RouteComponent() {
  const { setCenterContent } = useHeader()
  const [panoramaId, setPanoramaId] = useState<string | undefined>(undefined);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [isEndRoundView, setIsEndRoundView] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const confettiRef = useRef<LottieRefCurrentProps>(null);

  async function getRoundData() {
    let data = await fetchRoundData();
    setPanoramaId(data.panoramaId);
    setTimeout(() => {
      setShowLoadingScreen(false);
    }, 1000);
  }

  async function resetAll() {
    setPanoramaId(undefined);
    setRoundNumber(1);
    setTotalScore(0);
    setTimeLeft(0);
    setIsMapExpanded(false);
    setMarkerPosition(null);
    setGuessResult(null);
    setIsEndRoundView(false);
    setShowLoadingScreen(true);
    confettiRef.current?.stop();
    await getRoundData();
  }
  function resetRound() {
    setShowLoadingScreen(true);
    getRoundData();
    setIsEndRoundView(false);
    setMarkerPosition(null);
    setGuessResult(null);
    confettiRef.current?.stop();
  }

  useEffect(() => {
    const handleRefresh = () => {
      getRoundData();
    };

    window.addEventListener('game-refresh', handleRefresh);
    return () => window.removeEventListener('game-refresh', handleRefresh);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev >= 0 ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCenterContent(
      <HeaderContent roundNumber={roundNumber} timeLeft={timeLeft} />
    );
    return () => setCenterContent(null);
  }, [roundNumber, timeLeft, setCenterContent]);

  if (!panoramaId) {
    getRoundData();
  }
  return (
    <div className="relative" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Overlay loading screen with animation */}
      <div className={`absolute top-0 left-0 w-full h-full bg-black z-1500 flex flex-col justify-center items-center animate-all duration-500
        ${showLoadingScreen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} id="loading-screen">
        <img src={logoUrl.Full} alt="MRTGuessr Logo" className="w-128 mb-4" />
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      {/* Game winning stats overlay, visible after 5 rounds complete */}
      <div className={`absolute top-0 left-0 w-full h-full bg-black z-2000 flex flex-col justify-center items-center animate-all duration-500
        ${roundNumber > 5 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} id="game-complete-screen">
        <h1 className="text-5xl font-bold text-white mb-4">Game Complete!</h1>
        <h2 className="text-3xl font-semibold text-white">Total Score: {totalScore}</h2>
        <Button variant={"outline"} className="mt-8" onClick={resetAll}>Play Again <Repeat /></Button>
      </div>

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
              let result = await postGuess(panoramaId!, coords.x, coords.z);
              setGuessResult(result);
              setIsEndRoundView(true);
              setTimeout(() => {
                confettiRef.current?.play();
              }, 250);
            }
          }} />
        </div>
      </div>
      {/* Endgame view stats - a white background color rectangle below the map, rounded and height 20% */}
      <div className={`absolute flex justify-center items-center flex-col
        bottom-4 left-1/2 -translate-x-1/2 w-[98%] h-[22%] rounded-lg z-[1000] transition-all duration-300 ease-in-out bg-slate-200 p-4 ${isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Lottie lottieRef={confettiRef} animationData={confettiAnimation} loop={false} autoPlay={false} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        <h1 className="text-4xl font-bold">Score: {guessResult?.score}</h1>
        <div className='text-lg mt-2 text-center'>
          <p>Distance: {guessResult?.distance}</p>
          <p className='font-bold'>Actual Location: {guessResult?.town} ({guessResult?.actualX}, {guessResult?.actualZ})</p>
        </div>
        <Button variant={"outline"} className="mt-4" onClick={() => {
          // Reset for next round
          resetRound();
          setRoundNumber((prev) => prev + 1);
          setTotalScore((prev) => prev + (guessResult ? guessResult.score : 0));
        }}>Next Round <ArrowRight /></Button>
      </div>
    </div>
  )
}
