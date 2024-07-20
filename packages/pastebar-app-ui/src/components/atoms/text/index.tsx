import { forwardRef } from 'react'
import { cva, VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

type TextProps = {
  className?: string
  onDoubleClick?: () => void
  onClick?: () => void
  title?: string
  children: React.ReactNode
}

const TextVariants = cva('flex flex-row items-center', {
  variants: {
    color: {
      default: 'text-slate-600 dark:text-slate-300',
      black: 'text-slate-700 dark:text-slate-300',
      muted: 'text-slate-100 dark:text-slate-500',
      waning: 'text-yellow-600 dark:text-yellow-300',
      danger: 'text-red-600 dark:text-red-300',
    },
    justify: {
      left: 'text-left',
      center: 'text-center',
      justify: 'text-justify',
      right: 'text-right',
    },
    size: {
      default: 'text-md',
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    weight: {
      default: 'font-normal',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    color: 'default',
    size: 'default',
    weight: 'default',
  },
})

const Text = forwardRef<HTMLInputElement, TextProps & VariantProps<typeof TextVariants>>(
  (
    {
      className,
      children,
      color,
      size,
      title,
      weight,
      justify,
      onDoubleClick = () => {},
      onClick = () => {},
    },
    ref
  ) => (
    <p
      ref={ref}
      title={title}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      className={clsx(TextVariants({ color, weight, size, justify, className }))}
    >
      {children}
    </p>
  )
)

const TextNormal: React.FC<TextProps & VariantProps<typeof TextVariants>> = ({
  className,
  children,
  size,
  weight,
  justify,
  onDoubleClick = () => {},
  onClick = () => {},
}) => (
  <p
    onDoubleClick={onDoubleClick}
    onClick={onClick}
    className={clsx('block' + TextVariants({ weight, size, justify, className }))}
  >
    {children}
  </p>
)

export { Text, TextNormal }
