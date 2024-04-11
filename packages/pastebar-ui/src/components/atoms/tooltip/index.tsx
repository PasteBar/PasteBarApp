import * as React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { clsx } from 'clsx'

export type TooltipProps = RadixTooltip.TooltipContentProps &
  Pick<
    RadixTooltip.TooltipProps,
    'open' | 'defaultOpen' | 'onOpenChange' | 'delayDuration'
  > & {
    text: React.ReactNode | string
    isDisabled?: boolean
    noPortal?: boolean
    isCompact?: boolean
    side?: 'bottom' | 'left' | 'top' | 'right'
    onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick']
    maxWidth?: number | string
  }

const ToolTip = ({
  children,
  text,
  open,
  isCompact,
  isDisabled,
  defaultOpen,
  onOpenChange,
  delayDuration,
  noPortal = false,
  align = 'center',
  alignOffset = 0,
  sideOffset = 4,
  maxWidth = 220,
  className,
  side,
  onClick,
  ...props
}: TooltipProps) => {
  if (isDisabled) return <span>{children}</span>

  const Portal = noPortal ? React.Fragment : RadixTooltip.Portal

  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
      >
        <RadixTooltip.Trigger onClick={onClick} asChild={true}>
          <span>{children}</span>
        </RadixTooltip.Trigger>
        <Portal>
          <RadixTooltip.Content
            side={side ?? 'top'}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            align={align}
            className={clsx(
              'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
              isCompact && '!px-1.5 !py-0.5 text-xs shadow-sm ',
              className
            )}
            {...props}
            style={{ ...props.style, maxWidth }}
          >
            <div
              className={`max-w-[${maxWidth}px] overflow-hidden text-ellipsis line-clamp-4`}
            >
              {text}
            </div>
          </RadixTooltip.Content>
        </Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

export default ToolTip
