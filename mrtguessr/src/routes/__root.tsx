import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostHogProvider, PostHogErrorBoundary } from "@posthog/react";

import Header from '../components/Header'
import { HeaderProvider } from '../contexts/HeaderContext'
import { AuthProvider } from '../contexts/AuthContext'

import '../styles.css'
import { logoUrl } from '@/lib/api'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

const description = 'MRTGuessr - Guess cities and locations around the MinecartRapidTransit Server!'
export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'MRTGuessr - Guess cities around the MRT!',
      },
      {
        name: 'description',
        content: description,
      },
      // Open Graph
      { property: 'og:title', content: "MRTGuessr" },
      { property: 'og:description', content: description },
      { property: 'og:image', content: logoUrl.Full },
      { property: 'og:type', content: 'game' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: "MRTGuessr" },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: logoUrl.Full },

      // PWA Manifest
      { rel: 'manifest', href: '/manifest.json', as: 'document' },
      // mobile-web-app-capable
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'stylesheet', href: '/leaflet/leaflet.css', type: 'text/css', defer: true },
    ],
    scripts: [
      { src: '/leaflet/leaflet.js', type: 'text/javascript', defer: true },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
          <PostHogErrorBoundary fallback={ErrorFallbackComponent}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <HeaderProvider>
                    <Header />
                    {children}
                  </HeaderProvider>
                </AuthProvider>
              <TanStackDevtools
                config={{
                  position: 'bottom-right',
                }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            </QueryClientProvider>
          </PostHogErrorBoundary>
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  )
}

const ErrorFallbackComponent = ({ error, componentStack, exceptionEvent }: {
  error: unknown;
  exceptionEvent: unknown;
  componentStack: string
}) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorName = error instanceof Error ? error.name : 'Error'
  const exceptionEventString = typeof exceptionEvent === 'object' ? JSON.stringify(exceptionEvent, null, 2) : String(exceptionEvent)

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }} className='min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white'>
      <h1 className="text-red-600 text-2xl font-bold">MRTGuessr - Something went wrong!</h1>
      <p className="mb-4 font-bold">Take a screenshot of this page and report this issue on <a className="underline decoration-dashed" href="https://discord.gg/qXYgrZmswW" target="_blank">Discord</a>.</p>
      <p><strong>{errorName}:</strong> {errorMessage}</p>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#1e293b', padding: '1rem', borderRadius: '4px' }}>
        {componentStack}
      </pre>
      <h2>Exception Event</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#1e293b', padding: '1rem', borderRadius: '4px' }}>
        {exceptionEventString}
      </pre>
    </div>
  )
}