import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Header from '../components/Header'
import { HeaderProvider } from '../contexts/HeaderContext'
import { AuthProvider } from '../contexts/AuthContext'

import '../styles.css'
import { logoUrl } from '@/lib/api'

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
      { rel: 'stylesheet', href: '/leaflet/leaflet.css' },
    ],
    scripts: [
      { src: '/leaflet/leaflet.js', type: 'text/javascript' },
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
        <Scripts />
      </body>
    </html>
  )
}
