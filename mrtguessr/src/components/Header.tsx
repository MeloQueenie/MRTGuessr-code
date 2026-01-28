import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Network,
  RefreshCw,
  SquareFunction,
  StickyNote,
  X,
} from 'lucide-react'
import { useHeader } from '@/contexts/HeaderContext'
import { logoUrl } from '@/lib/api'

export default function Header() {
  const { centerContent } = useHeader()
  const [isOpen, setIsOpen] = useState(false)
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({})

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          {/* horizontal layout of logo icon and text */}
          <Link to="/" viewTransition>
            <div className="ml-4 flex items-center gap-2">
              <img src={logoUrl.Text} alt="MRTGuessr" className="h-4 md:h-8 w-auto" />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {centerContent}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>
        </nav>
        {__BUILD_DATE__ && __GIT_HASH__ && (
          <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
            Build Date: {new Date(__BUILD_DATE__).toLocaleString()} <br />
            Git Hash: {__GIT_HASH__}
          </div>
        )}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
          <img src="/pixl-wordmark-transparent.png" alt="Global Affairs Pixl Logo" className="h-6 w-auto mt-2 mx-auto"/>
          A Global Affairs Pixl development project.
        </div>
      </aside>
    </>
  )
}
