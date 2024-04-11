import * as React from 'react'

import { cn } from '~/lib/utils'

const Box = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
)
Box.displayName = 'Box'

export { Box }

const Flex = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-center', className)}
      {...props}
    />
  )
)
Flex.displayName = 'Flex'

export { Flex }
