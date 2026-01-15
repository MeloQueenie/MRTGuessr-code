import { createContext, useContext, useState, ReactNode } from 'react'

interface HeaderContextType {
  centerContent: ReactNode
  setCenterContent: (content: ReactNode) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [centerContent, setCenterContent] = useState<ReactNode>(null)

  return (
    <HeaderContext.Provider value={{ centerContent, setCenterContent }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeader must be used within HeaderProvider')
  }
  return context
}
