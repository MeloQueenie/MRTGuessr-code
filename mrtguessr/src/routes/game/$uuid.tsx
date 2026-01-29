import { ClientOnly, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin'
import { useState, useEffect, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Dot } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchRoundData, postGuess, GuessResult, logoUrl, API_URL } from '@/lib/api'
import { useHeader } from '@/contexts/HeaderContext'
import { GameMap } from '@/components/GameMap'
import GuessButton from '@/components/GuessButton'
import { leafletToMinecraft } from '@/lib/coordinates'
import confettiAnimation from '@/components/Confetti.json'

import '@photo-sphere-viewer/compass-plugin/index.css';

export const Route = createFileRoute('/game/$uuid')({
  ssr: false,
  component: RouteComponent,
})

function HeaderContent({ roundNumber, timeLeft, totalScore }: { roundNumber: number; timeLeft: number; totalScore: number }) {
  return (
    <>
    <div className="flex items-center gap-4">
      <div className="text-lg font-semibold">
        Round {roundNumber} / 5
      </div>
      <Dot />
      <div>
        Total Score: {totalScore.toLocaleString()}
      </div>
      <Dot />
      <div className="text-lg font-mono">
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </div>
    </div>
    </>
  )
}

function RouteComponent() {
  const { uuid } = Route.useParams()
  const { setCenterContent } = useHeader()
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [isEndRoundView, setIsEndRoundView] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const confettiRef = useRef<LottieRefCurrentProps>(null);
  const navigate = useNavigate({from: "/game/$uuid"});

  const { data: roundData, refetch: refetchRound, isError } = useQuery({
    queryKey: ['roundData', uuid],
    queryFn: () => fetchRoundData(uuid),
  })
  const roundNumber = roundData?.roundNumber || 1;
  const totalScore = roundData?.totalScore || 0;

  const guessMutation = useMutation({
    mutationFn: ({ guessX, guessZ }: { guessX: number; guessZ: number }) =>
      postGuess(uuid, guessX, guessZ),
    onSuccess: (result) => {
      setGuessResult(result)
      setIsEndRoundView(true)
      if(result.score >= 5000) {
        setTimeout(() => {
          confettiRef.current?.play()
        }, 250);
      }
    },
  });

  useEffect(() => {
    if (roundData) {
      setTimeout(() => {
        setShowLoadingScreen(false)
      }, 1000)
    }
  }, [roundData])

  async function resetAll() {
    setTimeLeft(0);
    setIsMapExpanded(false);
    setMarkerPosition(null);
    setGuessResult(null);
    setIsEndRoundView(false);
    setShowLoadingScreen(true);
    confettiRef.current?.stop();
    await refetchRound();
  }

  function resetRound() {
    setShowLoadingScreen(true);
    setIsEndRoundView(false);
    setMarkerPosition(null);
    confettiRef.current?.stop();
    refetchRound();
    setTimeout(() => {
      setGuessResult(null);
    }, 500);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev >= 0 ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCenterContent(
      <HeaderContent roundNumber={roundNumber} timeLeft={timeLeft} totalScore={totalScore} />
    );
    return () => setCenterContent(null);
  }, [roundNumber, timeLeft, totalScore, setCenterContent]);

  if (isError || roundData?.error ) {
    return <div className="bg-black text-white text-4xl flex items-center justify-center h-[93.5vh]">An error has occurred: {roundData?.error}</div>
  }
  return (
    <div className="relative" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Overlay loading screen with animation */}
      <div className={`absolute top-0 left-0 w-full h-full bg-black z-1500 flex flex-col justify-center items-center animate-all duration-500
        ${showLoadingScreen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} id="loading-screen">
        <img src={logoUrl.Full} alt="MRTGuessr Logo" className="w-64 md:w-128 mb-4" />
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div className="w-full h-full bg-black">
        {roundData && (
          <ReactPhotoSphereViewer
            key={roundData.panoramaId}
            src={`${API_URL}/panorama/${roundData.panoramaId}`}
            plugins={[
              CompassPlugin.withConfig({
                hotspots: [
                ],
              }),
            ]}
            height="100%"
            width="100%"
            navbar={false}
          ></ReactPhotoSphereViewer>
        )}
      </div>
      <div
        className={`
          absolute ${isEndRoundView
            ? `bottom-[30%] md:bottom-[25%] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 w-[95%] md:w-[98%] h-[60%] md:h-[80%] rounded-lg`
            : `bottom-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 w-[100%] md:w-[25%] h-[35%] md:h-[25%] md:hover:w-[50%] md:hover:h-[50%]`}
           bg-gray-900 border-2 border-gray-700 md:rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-100
        `}
        onMouseEnter={() => setIsMapExpanded(true)}
        onMouseLeave={() => setIsMapExpanded(false)}
      >
        <ClientOnly>
          <GameMap
            key={roundData?.panoramaId}
            isExpanded={isMapExpanded}
            isEndRoundView={isEndRoundView}
            markerPosition={markerPosition}
            guessResult={guessResult}
            onMapClick={(lat, lng) => isEndRoundView ? null : setMarkerPosition([lat, lng])}
          />
        </ClientOnly>
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-[1000] scale-75 md:scale-100 transition-all duration-300 ease-in-out ${!isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <GuessButton onClick={() => {
            if (markerPosition && roundData) {
              const coords = leafletToMinecraft(markerPosition[0], markerPosition[1]);
              console.log(`Guessing at Minecraft coords: x=${coords.x}, z=${coords.z}`);
              guessMutation.mutate({ guessX: coords.x, guessZ: coords.z });
            }
          }} />
        </div>
      </div>
      {/* Endgame view stats - a white background color rectangle below the map, rounded and height 20% */}
      <div className={`absolute flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8
        bottom-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[98%] h-auto md:h-[22%] rounded-lg z-[1000] transition-all duration-300 ease-in-out bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700 p-4 md:p-4 ${isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Lottie lottieRef={confettiRef} animationData={confettiAnimation} loop={false} autoPlay={false} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        <div className="flex flex-col justify-center text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-emerald-400">Score: {guessResult?.score.toLocaleString()}</h1>
          <div className='text-sm md:text-lg mt-2 text-slate-300'>
            <p>Distance: {Math.round(guessResult?.distance!).toLocaleString()}m</p>
            <p className='font-bold text-white'>Actual Location: {guessResult?.town} (X {Math.floor(guessResult?.actualX!)}, Z {Math.floor(guessResult?.actualZ!)})</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant={"outline"} size="lg" className="bg-white text-black border-white hover:bg-slate-200" onClick={() => {
            // Reset for next round
            if (roundNumber >= 5) {
              // Game complete, navigate to results page with uuid
              navigate({ to: `/game/results/${uuid}`, viewTransition: true });
              return;
            }
            resetRound();
          }}>Next Round <ArrowRight /></Button>
        </div>
      </div>
    </div>
  )
}
