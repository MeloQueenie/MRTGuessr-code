import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard, logoUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Trophy, User, ArrowLeft, Medal } from 'lucide-react'

export const Route = createFileRoute('/leaderboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  if (isLoading) {
    return (
      <div className="bg-black text-white text-4xl flex items-center justify-center h-[93.5vh]">
        Loading leaderboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[93.5vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <img src={logoUrl.Full} alt="MRTGuessr Logo" className="w-64 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Error Loading Leaderboard</h1>
            <p className="text-xl text-slate-300 mb-8">
              Something went wrong. Please try again later.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg" className="bg-slate-800 border-slate-600 hover:bg-slate-700">
                <ArrowLeft className="mr-2" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-400" size={32} />
    if (rank === 2) return <Medal className="text-slate-300" size={28} />
    if (rank === 3) return <Medal className="text-amber-600" size={24} />
    return null
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-600 to-yellow-500'
    if (rank === 2) return 'from-slate-400 to-slate-300'
    if (rank === 3) return 'from-amber-600 to-amber-500'
    return 'from-slate-700 to-slate-600'
  }

  return (
    <div className="min-h-[93.5vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logoUrl.Full} alt="MRTGuessr Logo" className="w-64 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy className="text-yellow-400" size={48} />
            Leaderboard
          </h1>
          <p className="text-xl text-slate-300">
            Top players by total score
          </p>
        </div>

        {/* Leaderboard Card */}
        <div className="bg-slate-800 rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden">
          {leaderboard && leaderboard.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {leaderboard.map((entry, index) => {
                const rank = index + 1
                const isTopThree = rank <= 3

                return (
                  <Link
                    key={entry.username}
                    to="/profile/$username"
                    params={{ username: entry.username }}
                    className="block hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-center gap-4 p-5">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-16 text-center">
                        {getRankIcon(rank) || (
                          <span className="text-2xl font-bold text-slate-400">
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        {entry.profilePicture ? (
                          <img
                            src={entry.profilePicture}
                            alt={entry.displayName}
                            className={`w-16 h-16 rounded-full border-2 ${
                              isTopThree ? 'border-yellow-400' : 'border-slate-600'
                            }`}
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-full border-2 ${
                            isTopThree ? 'border-yellow-400' : 'border-slate-600'
                          } bg-slate-700 flex items-center justify-center`}>
                            <User size={32} className="text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-grow min-w-0">
                        <div className="font-bold text-lg truncate">
                          {entry.displayName}
                        </div>
                        <div className="text-slate-400 text-sm truncate">
                          @{entry.username}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-2xl font-bold bg-gradient-to-r ${getRankColor(rank)} bg-clip-text text-transparent`}>
                          {entry.totalScore.toLocaleString()}
                        </div>
                        <div className="text-slate-400 text-sm">
                          points
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Trophy size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl">No players on the leaderboard yet!</p>
              <p className="mt-2">Be the first to play and set a score.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
