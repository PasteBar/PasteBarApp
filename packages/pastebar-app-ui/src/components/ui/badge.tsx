import * as React from 'react'
import { cva, VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center border rounded-full px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        slate:
          'bg-slate-500 dark:bg-slate-700 hover:bg-slate-100/80 border-transparent text-primary-foreground dark:text-slate-200',
        slateSecondary:
          'bg-secondary dark:bg-slate-600 dark:text-slate-200 hover:bg-secondary/80 border-transparent text-secondary-foreground',
        default:
          'bg-slate-500 hover:bg-slate-500/80 border-transparent text-primary-foreground',
        secondary:
          'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground',
        pro: 'border-transparent dark:text-green-950 text-slate-50 bg-green-500 dark:bg-green-600',
        destructive:
          'bg-destructive dark:bg-red-800 hover:bg-destructive/80 border-transparent text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

Badge.displayName = 'Badge'

const BadgeWithRef = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)

BadgeWithRef.displayName = 'BadgeWithRef'

export { Badge, BadgeWithRef, badgeVariants }
