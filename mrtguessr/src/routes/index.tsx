  // MRTGuessr - Frontend
  // Copyright (C) 2026 Seshan Ravikumar

  // This program is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Affero General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.

  // This program is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Affero General Public License for more details.

  // You should have received a copy of the GNU Affero General Public License
  // along with this program.  If not, see <https://www.gnu.org/licenses/>.
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { logoUrl, getHealth, startGame, fetchGameStatistics } from '@/lib/api'
import { ConstructionIcon } from 'lucide-react'

export const Route = createFileRoute('/')({component: App })

function App() {
  const navigate = useNavigate({
    from: "/"
  });

  const {data: healthData} = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 10000,
  });
  const {refetch: refetchStart, isRefetching} = useQuery({
    queryKey: ['startGame'],
    queryFn: startGame,
    enabled: false,
  });

  const { data: gameStatistics } = useQuery({
    queryKey: ['gameStatistics'],
    queryFn: fetchGameStatistics,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src={logoUrl.Full}
              alt="MRTGuessr Logo"
              className="w-[50%] h-auto mx-auto"
            />
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Guess cities and locations around the MRT New World!
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8 text-orange-400">
            <ConstructionIcon className="inline-block mr-2 mb-1 animate-pulse" size={20} />
            MRTGuessr is under construction! There will be missing features, bugs and data resets!
            <ConstructionIcon className="inline-block ml-2 mb-1 animate-pulse" size={20} />
          </p>
          <div className={`flex flex-col items-center gap-4 animate-all duration-500 ${isRefetching ? 'opacity-0' : 'opacity-100'}`}>
            {healthData ? (
              <>
                <div
                  onClick={() => {
                    refetchStart().then(({ data }) => {
                      if (data && data.uuid) {
                        navigate({ to: `/game/${data.uuid}`, viewTransition: true });
                      }
                    });
                  }}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 select-none cursor-pointer"
                >
                  Play Now!
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  {gameStatistics ? (
                    <>
                      <span>{gameStatistics.totalPanoramas.toLocaleString()} panoramas</span>
                      <span className="mx-2">•</span>
                      <span>{gameStatistics.uniqueCities.toLocaleString()} unique cities</span>
                    </>
                  ) : (
                    <>Loading game statistics...</>
                  )}
                </p>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  </span>
                  <span>API Status: {healthData}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                </span>
                <span>Connecting to API...</span>
              </div>
            )}

          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
        </div>
      </section>

      <div className="py-6 text-center text-sm text-gray-500" suppressHydrationWarning>
        © {new Date().getFullYear()} Seshpenguin & MeloQueen.
      </div>
    </div>
  )
}
