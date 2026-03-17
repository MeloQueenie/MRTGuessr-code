import { ClientOnly, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin'
import { useState, useEffect, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Dot, Minimize2, Maximize2 } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchRoundData, postGuess, GuessResult, logoUrl, API_URL, fetchDynmapNewData, GameType, DynmapPlayer } from '@/lib/api'
import { useHeader } from '@/contexts/HeaderContext'
import { GameMap } from '@/components/GameMap'
import GuessButton from '@/components/GuessButton'
import { leafletToMinecraft, minecraftToLeaflet } from '@/lib/coordinates'
import confettiAnimation from '@/components/Confetti.json'


import '@photo-sphere-viewer/compass-plugin/index.css';

export const Route = createFileRoute('/game/$uuid')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    players: typeof search.players === 'string' ? search.players : undefined,
  }),
  component: RouteComponent,
})

function HeaderContent({ roundNumber, timeLeft, totalScore, mcGuessPlayers, isViewer }: { roundNumber: number; timeLeft: number; totalScore: number; mcGuessPlayers?: string[]; isViewer?: boolean }) {
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
      {mcGuessPlayers && mcGuessPlayers.length > 0 && (
        <>
          <Dot />
          <div className="text-cyan-400">
            {mcGuessPlayers.length === 1
              ? `Tracking: ${mcGuessPlayers[0]}`
              : `Tracking ${mcGuessPlayers.length} players`}
          </div>
        </>
      )}
      {isViewer && (
        <>
          <Dot />
          <div className="text-yellow-400 text-sm">Viewer</div>
        </>
      )}
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
  const { players: playersParam } = Route.useSearch()
  const { setCenterContent } = useHeader()
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [isEndRoundView, setIsEndRoundView] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const confettiRef = useRef<LottieRefCurrentProps>(null);
  const navigate = useNavigate({from: "/game/$uuid"});
  const [isResultsMinimized, setIsResultsMinimized] = useState(false);

  // mcGuessPlayers: decoded from the ?players= search param (set by host at game start)
  const mcGuessPlayers: string[] = playersParam
    ? playersParam.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const { data: roundData, refetch: refetchRound, isError } = useQuery({
    queryKey: ['roundData', uuid],
    queryFn: () => fetchRoundData(uuid),
  })
  const roundNumber = roundData?.roundNumber || 1;
  const totalScore = roundData?.totalScore || 0;
  const isMcGuessMode = roundData?.gameType === GameType.MC_GUESS;

  // A viewer is anyone who opens the URL but didn't originate the game in this tab.
  // The host is identified by having the uuid stored in sessionStorage (written at game start).
  const isMultiplayer = mcGuessPlayers.length > 1;
  const isHost = typeof window !== 'undefined' && sessionStorage.getItem('mcGuessGameUuid') === uuid;
  // isViewer: MC_GUESS game with players in URL, but this tab isn't the one that started it
  const isViewer = isMcGuessMode && mcGuessPlayers.length > 0 && !isHost;


  const { data: dynmapData } = useQuery({
    queryKey: ['dynmapPlayers'],
    queryFn: fetchDynmapNewData,
    enabled: isMcGuessMode && !isEndRoundView,
    refetchInterval: isMcGuessMode && !isEndRoundView ? 1000 : false,
  });

  // Track live positions for all mcGuessPlayers
  // markerPosition is used for the single-player guess marker (not used in MC_GUESS mode for guessing)
  // playerPositions maps player name -> [lat, lng]
  const [playerPositions, setPlayerPositions] = useState<Record<string, [number, number]>>({});

  // Find the closest player to the actual location (used in end-round view).
  // Distance is computed in Minecraft blocks (same unit the backend uses).
  const closestPlayerResult: { name: string; distanceBlocks: number } | null =
    guessResult && Object.keys(playerPositions).length > 0
      ? (() => {
          let closest: { name: string; distanceBlocks: number } | null = null;
          for (const [name, pos] of Object.entries(playerPositions)) {
            const mc = leafletToMinecraft(pos[0], pos[1]);
            const dx = mc.x - guessResult.actualX;
            const dz = mc.z - guessResult.actualZ;
            const distanceBlocks = Math.sqrt(dx * dx + dz * dz);
            if (!closest || distanceBlocks < closest.distanceBlocks) {
              closest = { name, distanceBlocks };
            }
          }
          return closest;
        })()
      : null;

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



  // For viewers: poll roundData to detect when the host advances to the next round
  // (round number will change when the host clicks Next Round)
  useEffect(() => {
    if (!isViewer) return;
    const interval = setInterval(() => {
      refetchRound();
    }, 3000);
    return () => clearInterval(interval);
  }, [isViewer, refetchRound]);

  // Track live Dynmap positions for all players
  useEffect(() => {
    if (isMcGuessMode && mcGuessPlayers.length > 0 && dynmapData && !isEndRoundView) {
      const newPositions: Record<string, [number, number]> = {};
      for (const playerName of mcGuessPlayers) {
        const player = dynmapData.players.find((p: DynmapPlayer) => p.name === playerName);
        if (player) {
          const leafletCoords = minecraftToLeaflet(player.x, player.z);
          newPositions[playerName] = [leafletCoords.lat, leafletCoords.lng];
        }
      }
      setPlayerPositions(newPositions);
      // For single-player mode, also update markerPosition (used for AutoCenter)
      if (mcGuessPlayers.length === 1) {
        const pos = newPositions[mcGuessPlayers[0]];
        if (pos) setMarkerPosition(pos);
      }
    }
  }, [isMcGuessMode, mcGuessPlayers, dynmapData, isEndRoundView]);

  async function resetAll() {
    setTimeLeft(0);
    setIsMapExpanded(false);
    setMarkerPosition(null);
    setPlayerPositions({});
    setGuessResult(null);
    setIsEndRoundView(false);
    setShowLoadingScreen(true);
    confettiRef.current?.stop();
    sessionStorage.removeItem('mcGuessGameUuid');
    await refetchRound();
  }

  function resetRound() {
    setShowLoadingScreen(true);
    setIsEndRoundView(false);
    setMarkerPosition(null);
    setPlayerPositions({});
    setIsResultsMinimized(false);
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
      <HeaderContent
        roundNumber={roundNumber}
        timeLeft={timeLeft}
        totalScore={totalScore}
        mcGuessPlayers={isMcGuessMode ? mcGuessPlayers : []}
        isViewer={isViewer}
      />
    );
    return () => setCenterContent(null);
  }, [roundNumber, timeLeft, totalScore, isMcGuessMode, mcGuessPlayers, isViewer, setCenterContent]);

  useEffect(() => {
    if (roundNumber > 5) {
      navigate({ to: `/game/results/${uuid}`, replace: true } as any);
    }
  }, [roundNumber, navigate, uuid]);

  if (isError || roundData?.error ) {
    return <div className="bg-black text-white text-4xl flex items-center justify-center h-[93.5vh]">An error has occurred: {roundData?.error}</div>
  }

  // Viewer-only banner: shown to people viewing a multiplayer game they didn't start
  if (isViewer) {
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
                  hotspots: [],
                }),
              ]}
              height="100%"
              width="100%"
              navbar={false}
              defaultZoomLvl={0}
            ></ReactPhotoSphereViewer>
          )}
        </div>

        {/* Map panel for viewers */}
        <div
          className="absolute bottom-0 md:bottom-4 md:right-4 w-[100%] md:w-[25%] h-[35%] md:h-[25%] md:hover:w-[50%] md:hover:h-[50%] bg-gray-900 border-2 border-gray-700 md:rounded-lg shadow-2xl overflow-hidden z-100 transition-all duration-300 ease-in-out"
          onMouseEnter={() => setIsMapExpanded(true)}
          onMouseLeave={() => setIsMapExpanded(false)}
        >
          <ClientOnly>
            <GameMap
              key={roundData?.panoramaId}
              isExpanded={isMapExpanded}
              isEndRoundView={false}
              markerPosition={null}
              guessResult={null}
              isMcGuessMode={true}
              mcGuessPlayers={mcGuessPlayers}
              playerPositions={playerPositions}
              onMapClick={() => {}}
            />
          </ClientOnly>
        </div>

        {/* Viewer info banner */}
        <div className="absolute bottom-4 left-4 z-[1001] bg-yellow-900/80 border border-yellow-600 text-yellow-200 text-sm px-4 py-2 rounded-lg">
          Viewing — refresh to see the next round
        </div>
      </div>
    );
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
            defaultZoomLvl={0} 
          ></ReactPhotoSphereViewer>
        )}
      </div>
      <div
        className={`
          absolute ${isEndRoundView && !isResultsMinimized
            ? `bottom-[30%] md:bottom-[25%] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 w-[95%] md:w-[98%] h-[60%] md:h-[80%] rounded-lg`
            : isEndRoundView && isResultsMinimized
            ? `bottom-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 w-[100%] md:w-[25%] h-[35%] md:h-[25%]`
            : isMcGuessMode
            ? `bottom-0 md:bottom-4 md:right-4 w-[100%] md:w-[50%] h-[35%] md:h-[50%] rounded-lg`
            : `bottom-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 w-[100%] md:w-[25%] h-[35%] md:h-[25%] md:hover:w-[50%] md:hover:h-[50%]`}
           bg-gray-900 border-2 border-gray-700 md:rounded-lg shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-100
        `}
        onMouseEnter={() => !isEndRoundView && !isMcGuessMode && setIsMapExpanded(true)}
        onMouseLeave={() => !isEndRoundView && !isMcGuessMode && setIsMapExpanded(false)}
      >
        <ClientOnly>
          <GameMap
            key={roundData?.panoramaId}
            isExpanded={isMcGuessMode ? true : isMapExpanded}
            isEndRoundView={isEndRoundView}
            markerPosition={markerPosition}
            guessResult={guessResult}
            isMcGuessMode={isMcGuessMode}
            mcGuessPlayers={mcGuessPlayers}
            playerPositions={playerPositions}
            onMapClick={(lat, lng) => {
              if (isEndRoundView || isMcGuessMode) return;
              setMarkerPosition([lat, lng]);
            }}
          />
        </ClientOnly>
        {/* Minimize/Maximize button for end round view */}
        {isEndRoundView && (
          <div className="absolute top-2 right-2 z-[1001] flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/90 hover:bg-white border-gray-700"
              onClick={() => setIsResultsMinimized(!isResultsMinimized)}
            >
              {isResultsMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            {isResultsMinimized && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-black border-white hover:bg-slate-200"
                onClick={() => {
                  if (roundNumber >= 5) {
                    navigate({ to: `/game/results/${uuid}`, viewTransition: true } as any);
                    return;
                  }
                  resetRound();
                }}
              >
                Next Round <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
        {!isMcGuessMode && (
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] z-[1000] scale-75 md:scale-100 transition-all duration-300 ease-in-out ${!isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <GuessButton
              disabled={!markerPosition || guessMutation.isPending}
              onClick={() => {
                if (markerPosition && roundData && !guessMutation.isPending) {
                  const coords = leafletToMinecraft(markerPosition[0], markerPosition[1]);
                  guessMutation.mutate({ guessX: coords.x, guessZ: coords.z });
                }
              }}
            />
          </div>
        )}
      </div>
      {/* MC_GUESS mode: guess button sits outside and below the map, on the left */}
      {isMcGuessMode && (
        <div className={`absolute bottom-4 left-4 w-[45%] md:w-[24%] z-[1000] transition-all duration-300 ease-in-out ${!isEndRoundView ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <GuessButton
            disabled={Object.keys(playerPositions).length === 0 || guessMutation.isPending}
            onClick={() => {
              const positions = Object.values(playerPositions);
              if (positions.length === 0 || !roundData || guessMutation.isPending) return;
              const avgLat = positions.reduce((s, p) => s + p[0], 0) / positions.length;
              const avgLng = positions.reduce((s, p) => s + p[1], 0) / positions.length;
              const coords = leafletToMinecraft(avgLat, avgLng);
              guessMutation.mutate({ guessX: coords.x, guessZ: coords.z });
            }}
          />
        </div>
      )}
      {/* Endgame view stats - a white background color rectangle below the map, rounded and height 20% */}
      <div className={`absolute flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8
        bottom-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[98%] h-auto md:h-[22%] rounded-lg z-[1000] transition-all duration-300 ease-in-out bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700 p-4 md:p-4 ${isEndRoundView && !isResultsMinimized ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Lottie lottieRef={confettiRef} animationData={confettiAnimation} loop={false} autoPlay={false} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
        <div className="flex flex-col justify-center text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-emerald-400">Score: {guessResult?.score.toLocaleString()}</h1>
          <div className='text-sm md:text-lg mt-2 text-slate-300'>
            {isMultiplayer && closestPlayerResult ? (
              <>
                <p>Closest: <span className="text-cyan-400 font-semibold">{closestPlayerResult.name}</span> — {Math.round(closestPlayerResult.distanceBlocks).toLocaleString()}m away</p>
              </>
            ) : (
              <p>Distance: {Math.round(guessResult?.distance!).toLocaleString()}m</p>
            )}
            <p className='font-bold text-white'>Actual Location: {guessResult?.town} (X {Math.floor(guessResult?.actualX!)}, Z {Math.floor(guessResult?.actualZ!)})</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant={"outline"} size="lg" className="bg-white text-black border-white hover:bg-slate-200" onClick={() => {
            // Reset for next round
            if (roundNumber >= 5) {
              // Game complete, navigate to results page with uuid
              navigate({ to: `/game/results/${uuid}`, viewTransition: true } as any);
              return;
            }
            resetRound();
          }}>Next Round <ArrowRight /></Button>
        </div>
      </div>
    </div>
  )
}
