import React from 'react'

import { cn } from '~/lib/utils'

type Intent = 'primary' | 'secondary'
type Size = 'sm' | 'md' | 'lg' | 'xs'

interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  intent?: Intent // can add more
  size?: Size
}

const colorMap: Record<Intent, string> = {
  primary: 'bg-amber-600 text-white',
  secondary:
    'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 hover:dark:bg-gray-700/80',
}

const sizeMap: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  xs: 'h-6 w-6',
  lg: 'h-12 w-12',
}

export default function IconButton({
  intent = 'primary',
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  const colorClass = colorMap[intent]
  const sizeClass = sizeMap[size]
  const classes = cn(
    'rounded-full cursor-pointer flex items-center justify-center ring-offset-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-default',
    colorClass,
    sizeClass,
    className
  )
  return <button className={classes} {...props} />
}
