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
import { createFileRoute, Link } from '@tanstack/react-router'
import { logoUrl } from '@/lib/api'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src={logoUrl.Full}
              alt="TanStack Logo"
              className="w-[50%] h-auto mx-auto"
            />
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Guess cities and locations around the MRT New World!
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Don't forget to ask Melody to write something for this section!
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/game"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
              viewTransition
            >
              Play Now!
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
        </div>
      </section>

      <div className="py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Seshpenguin & MeloQueen.
      </div>
    </div>
  )
}
