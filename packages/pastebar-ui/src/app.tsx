import { NavBar } from '~/layout/NavBar'
import { Outlet } from 'react-router-dom'

import { ThemeProvider } from '~/components/theme-provider'

function App() {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div>
          <div className="border rounded-lg shadow-window border-gray-100 dark:border-gray-800 relative bg-slate-100">
            <NavBar />
            <Outlet />
          </div>
        </div>
      </ThemeProvider>
    </>
  )
}

export default App
