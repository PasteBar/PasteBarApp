import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '~/lib/utils'

// Create a context to share the setting from TabsList to TabsTrigger
const TabsContext = React.createContext({
  disableKeyboardNavigation: false,
})

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    disableKeyboardNavigation?: boolean
  }
>(({ className, children, disableKeyboardNavigation = false, ...props }, ref) => (
  // The provider makes the 'disableKeyboardNavigation' value available to all child components
  <TabsContext.Provider value={{ disableKeyboardNavigation }}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  </TabsContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, onKeyDown, ...props }, ref) => {
  // Consume the context to get the setting from the parent TabsList
  const { disableKeyboardNavigation } = React.useContext(TabsContext)

  // Create a new keydown handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // If the feature is enabled, prevent arrow key navigation (with or without modifiers)
    if (disableKeyboardNavigation && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault()
      e.stopPropagation() // Also stop propagation to prevent other handlers from running
    }

    // IMPORTANT: Still call any original onKeyDown function that was passed in props
    onKeyDown?.(e)
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background dark:data-[state=active]:bg-gray-600 data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      // Conditionally apply our new handler ONLY if the prop is set
      onKeyDown={disableKeyboardNavigation ? handleKeyDown : onKeyDown}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
