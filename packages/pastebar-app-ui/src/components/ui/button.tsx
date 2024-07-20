import * as React from 'react'
import { cva, VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'bg-slate-600 text-primary-foreground dark:bg-slate-500 hover:bg-slate-900/90 dark:hover:bg-slate-600/90',
        danger: 'bg-red-600 text-destructive-foreground hover:bg-red-900/90',
        outline:
          'border border-input hover:bg-accent hover:text-bg-slate-900 dark:hover:bg-accent/80 dark:border-slate-500 dark:text-slate-500',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent dark:hover:bg-transparent hover:text-accent-slate-600',
        light:
          'bg-slate-100 dark:bg-slate-800 hover:bg-accent hover:text-accent-slate-600',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-9 py-3 px-4',
        sm: 'h-8 px-3 rounded-md',
        xs: 'h-7 px-3 rounded-md',
        mini: 'rounded-md',
        lg: 'h-10 px-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
      const buttonClassName = React.useMemo(() => {
        return cn(buttonVariants({ variant, size, className }))
      }, [variant, size, className])

      return <button className={buttonClassName} ref={ref} {...props} />
    }
  )
)
Button.displayName = 'Button'

const ButtonGhost = ({ className = '', ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent dark:hover:bg-transparent hover:text-accent-slate-600 ${className}`}
      {...props}
    />
  )
}

Button.displayName = 'ButtonGhost'

export { Button, ButtonGhost, buttonVariants }
