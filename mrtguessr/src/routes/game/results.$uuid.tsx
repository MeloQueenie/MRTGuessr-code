import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { ClientOnly } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchResults, GuessResult, logoUrl, PUBLIC_URL } from '@/lib/api'
import { GameMap } from '@/components/GameMap'
import { minecraftToLeaflet } from '@/lib/coordinates'
import { Button } from '@/components/ui/button'
import { Repeat, Share2, Clock } from 'lucide-react'
import { useState } from 'react'

function formatDuration(createdAt: string, completedAt: string | null): string {
  if (!completedAt) return 'N/A'

  const startTime = new Date(createdAt).getTime()
  const endTime = new Date(completedAt).getTime()
  const durationMs = endTime - startTime

  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export const Route = createFileRoute('/game/results/$uuid')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const results = await fetchResults(params.uuid)
    return results
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: 'MRTGuessr - Game Results' },
        ],
      }
    }

    const displayName = loaderData.displayName || 'Player'
    const totalScore = loaderData.totalScore || 0
    const avgScore = Math.round(totalScore / 5)
    const title = `MRTGuessr - ${totalScore.toLocaleString()} points!`

    // Build detailed breakdown of rounds
    const roundBreakdown = loaderData.results
      .map((result) => `Round ${result.roundNumber}: ${result.town} - ${result.score.toLocaleString()} pts`)
      .join('\n')

    const description = `${displayName} scored ${totalScore.toLocaleString()} points in MRTGuessr!\n\n${roundBreakdown}`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: logoUrl.Full },
        { property: 'og:type', content: 'website' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: logoUrl.Full },
      ],
    }
  },
})

function RouteComponent() {
  const { uuid } = Route.useParams()
  const navigate = useNavigate()
  const [copySuccess, setCopySuccess] = useState(false)
  const loaderData = Route.useLoaderData()

  // Still use useQuery for reactivity, but initialize with loader data
  const { data: resultData, isLoading } = useQuery({
    queryKey: ['resultsData', uuid],
    queryFn: () => fetchResults(uuid),
    initialData: loaderData,
  });

  if (isLoading) {
    return <div className="bg-black text-white text-4xl flex items-center justify-center h-[93.5vh]">Loading results...</div>
  }

  const totalScore = resultData?.totalScore || 0;
  const duration = resultData ? formatDuration(resultData.createdAt, resultData.completedAt) : 'N/A';
  
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
            {totalScore.toLocaleString()} points
          </div>

          {/* Player Info */}
          {resultData && (
            <div className="flex items-center justify-center gap-3 mb-4">
              {resultData.profilePicture && (
                <img
                  src={resultData.profilePicture}
                  alt={resultData.displayName || 'Player'}
                  className="w-10 h-10 rounded-full border-2 border-emerald-400"
                />
              )}
              <div className="text-xl text-slate-300">
                Played by{' '}
                {resultData.username && resultData.username !== 'anonymous' ? (
                  <Link
                    to="/profile/$username"
                    params={{ username: resultData.username }}
                    className="font-semibold text-white hover:text-emerald-400 transition-colors"
                  >
                    {resultData.displayName || 'anonymous'}
                  </Link>
                ) : (
                  <span className="font-semibold text-white">{resultData.displayName || 'anonymous'}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-2 text-xl text-slate-300">
            <p className="flex items-center gap-2">
              <Clock size={20} />
              <span>{duration}</span>
            </p>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {resultData?.results.map((result, index) => {
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
