import { forwardRef, ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

import { TooltipProvider } from '~/components/ui/tooltip'

type MainContainerProps = {
  children: ReactNode
}

const Container: React.ForwardRefRenderFunction<
  HTMLDivElement,
  MainContainerProps
> = props => {
  return <div className="flex flex-col items-center relative">{props.children}</div>
}

export const Component = () => {
  return (
    <div className="flex flex-col bg-slate-100 dark:bg-slate-700 overflow-hidden rounded-b-md mt-[40px]">
      <div data-tauri-drag-region>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </div>
    </div>
  )
}

export const MainContainer = forwardRef(Container)
