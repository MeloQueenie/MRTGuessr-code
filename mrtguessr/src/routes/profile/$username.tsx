import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUserProfile, updateUserProfile, fetchUserGames, logoUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, User, ArrowLeft, LogOut, Edit, Save, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GamesDataTable } from '@/components/GamesDataTable'

export const Route = createFileRoute('/profile/$username')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const profile = await fetchUserProfile(params.username)
    return profile
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: 'MRTGuessr - User Profile' },
        ],
      }
    }

    const title = `${loaderData.displayName} (@${loaderData.username}) - MRTGuessr`
    const description = loaderData.description
      ? `${loaderData.description.substring(0, 200)}${loaderData.description.length > 200 ? '...' : ''}`
      : `Check out ${loaderData.displayName}'s MRTGuessr profile!`

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: loaderData.profilePicture || logoUrl.Full },
        { property: 'og:type', content: 'profile' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: loaderData.profilePicture || logoUrl.Full },
      ],
    }
  },
})

function RouteComponent() {
  const { username } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [gamesPage, setGamesPage] = useState(1)
  const gamesLimit = 10
  const loaderData = Route.useLoaderData()

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => fetchUserProfile(username),
    initialData: loaderData,
    retry: false,
  })

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['userGames', username, gamesPage, gamesLimit],
    queryFn: () => fetchUserGames(username, gamesPage, gamesLimit),
    enabled: !!profile,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (description: string) => updateUserProfile(username, description),
    onSuccess: (data) => {
      queryClient.setQueryData(['userProfile', username], data)
      setIsEditing(false)
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    },
  })

  const isOwnProfile = isAuthenticated && user && user.username === username

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  const handleEditClick = () => {
    setEditedDescription(profile?.description || '')
    setIsEditing(true)
  }

  const handleSaveClick = () => {
    updateProfileMutation.mutate(editedDescription)
  }

  const handleCancelClick = () => {
    setIsEditing(false)
    setEditedDescription('')
  }

  if (isLoading) {
    return (
      <div className="bg-black text-white text-4xl flex items-center justify-center h-[93.5vh]">
        Loading profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[93.5vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <img src={logoUrl.Full} alt="MRTGuessr Logo" className="w-64 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">User Not Found</h1>
            <p className="text-xl text-slate-300 mb-8">
              The user "{username}" could not be found.
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

  if (!profile) {
    return null
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-[93.5vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-slate-800 rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-32"></div>

          {/* Profile Content */}
          <div className="relative px-8 pb-8">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-8">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full border-4 border-slate-800 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-slate-800 shadow-xl bg-slate-700 flex items-center justify-center">
                  <User size={64} className="text-slate-400" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="pt-20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-1">{profile.displayName}</h1>
                  <p className="text-xl text-slate-400">@{profile.username}</p>
                </div>
                {isOwnProfile && (
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="lg"
                    className="bg-red-500 border-red-600 hover:bg-red-600 text-white"
                  >
                    <LogOut className="mr-2" size={20} />
                    Logout
                  </Button>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-6 text-slate-400 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <span>Joined {joinDate}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-3">
                  <h2 className="text-xl font-bold"></h2>
                  {isOwnProfile && !isEditing && (
                    <Button
                      onClick={handleEditClick}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Write yourself a description! (Markdown supported)"
                        className="min-h-[150px] font-mono text-sm"
                        maxLength={4096}
                      />
                      <div className={`text-sm mt-1 ${editedDescription.length > 3900 ? 'text-orange-400' : 'text-slate-500'}`}>
                        {editedDescription.length} / 4096 characters
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveClick}
                        disabled={updateProfileMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save size={16} className="mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        onClick={handleCancelClick}
                        variant="outline"
                        disabled={updateProfileMutation.isPending}
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                      >
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-300 leading-relaxed">
                    {profile.description ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-white">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 text-white">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xl font-bold mb-2 text-white">{children}</h3>,
                          h4: ({ children }) => <h4 className="text-lg font-bold mb-2 text-white">{children}</h4>,
                          p: ({ children }) => <p className="mb-4">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-4">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 text-sm font-mono">{children}</code>,
                          pre: ({ children }) => <pre className="bg-slate-900 p-4 rounded-lg mb-4 overflow-x-auto">{children}</pre>,
                          a: ({ href, children }) => <a href={href} className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-600 pl-4 italic my-4">{children}</blockquote>,
                          del: ({ children }) => <del className="line-through text-slate-400">{children}</del>,
                        }}
                      >
                        {profile.description}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-slate-500 italic">
                        {isOwnProfile ? 'Click "Edit" to add a description about yourself.' : 'No description yet.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div className="border-t border-slate-700 pt-6">
                <h2 className="text-2xl font-bold mb-4">Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">
                      {gamesData?.stats.totalGames ?? '-'}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Games Played</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">
                      {gamesData?.stats.totalScore
                        ? gamesData.stats.totalScore.toLocaleString()
                        : '-'}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Total Score</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">
                      {gamesData?.stats.avgScore
                        ? gamesData.stats.avgScore.toLocaleString()
                        : '-'}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Avg Score</div>
                  </div>
                </div>
              </div>

              {/* Games Played */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Games Played</h2>
                {gamesLoading ? (
                  <div className="text-center text-slate-400 py-8">
                    Loading games...
                  </div>
                ) : gamesData && gamesData.games.length > 0 ? (
                  <GamesDataTable
                    data={gamesData.games}
                    page={gamesPage}
                    limit={gamesLimit}
                    total={gamesData.total}
                    onPageChange={setGamesPage}
                  />
                ) : (
                  <div className="text-center text-slate-400 py-8 bg-slate-900 rounded-lg border border-slate-700">
                    No games played yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
