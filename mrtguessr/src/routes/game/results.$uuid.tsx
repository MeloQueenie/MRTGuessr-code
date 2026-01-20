import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ClientOnly } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchResults, GuessResult, logoUrl } from '@/lib/api'
import { GameMap } from '@/components/GameMap'
import { minecraftToLeaflet } from '@/lib/coordinates'
import { Button } from '@/components/ui/button'
import { Repeat, Share2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/game/results/$uuid')({
  ssr: false,
  component: RouteComponent,
})

function RouteComponent() {
  const { uuid } = Route.useParams()
  const navigate = useNavigate()
  const [copySuccess, setCopySuccess] = useState(false)
  const { data: resultData, isLoading } = useQuery({
    queryKey: ['resultsData', uuid],
    queryFn: () => fetchResults(uuid),
  });

  if (isLoading) {
    return <div className="bg-black text-white text-4xl flex items-center justify-center h-[93.5vh]">Loading results...</div>
  }

  const totalScore = resultData?.results.reduce((sum, result) => sum + result.score, 0) ?? 0;
  
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-[93.5vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoUrl.Full} alt="MRTGuessr Logo" className="w-64 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-2">Game Complete!</h1>
          <div className="text-6xl font-bold text-emerald-400 mb-4">
            {totalScore} points
          </div>
          <p className="text-xl text-slate-300">
            Average: {Math.round(totalScore / 5)} points per round
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {resultData.results.map((result, index) => {
            const guessLeaflet = minecraftToLeaflet(result.guessX, result.guessZ);
            const markerPosition: [number, number] = [guessLeaflet.lat, guessLeaflet.lng];

            return (
              <div key={index} className="bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl">
                <div className="h-64 relative">
                  <ClientOnly>
                    <GameMap
                      isExpanded={false}
                      isEndRoundView={true}
                      markerPosition={markerPosition}
                      guessResult={result}
                      onMapClick={() => {}}
                    />
                  </ClientOnly>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">Round {result.roundNumber}</h3>
                    <span className="text-2xl font-bold text-emerald-400">{result.score}</span>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p><span className="font-semibold">Location:</span> {result.town}</p>
                    <p><span className="font-semibold">Distance:</span> {Math.round(result.distance)}m</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate({ to: '/' })}
            className="bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            <Repeat className="mr-2" /> Back to Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className="bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            <Share2 className="mr-2" /> {copySuccess ? 'Copied!' : 'Share Results'}
          </Button>
        </div>
      </div>
    </div>
  )
}
