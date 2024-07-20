import * as React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { clsx } from 'clsx'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import DOMPurify from '~/components/libs/dompurify'

import { useSignal } from '~/hooks/use-signal'

export type TooltipNotesProps = RadixTooltip.TooltipContentProps &
  Pick<
    RadixTooltip.TooltipProps,
    'open' | 'defaultOpen' | 'onOpenChange' | 'delayDuration'
  > & {
    text: React.ReactNode | string
    isDisabled?: boolean
    noPortal?: boolean
    isHTML?: boolean
    isDark?: boolean
    classNameTrigger?: string
    side?: 'bottom' | 'left' | 'top' | 'right'
    onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick']
    maxHeight?: number | string
    maxWidth?: number | string
  }

const ToolTipNotes = ({
  children,
  text,
  open,
  isDisabled,
  isDark,
  defaultOpen,
  onOpenChange,
  delayDuration,
  noPortal = false,
  align = 'center',
  alignOffset = 0,
  sideOffset = 4,
  maxHeight = 120,
  maxWidth = 220,
  className,
  classNameTrigger,
  side,
  onClick,
  ...props
}: TooltipNotesProps) => {
  const Portal = noPortal ? React.Fragment : RadixTooltip.Portal

  const noteHTML = useSignal('')

  React.useEffect(() => {
    // @ts-expect-error unknown type markdown
    window['markdown'].ready.then(markdown => {
      try {
        const html = markdown.parse(text)
        noteHTML.value = DOMPurify.sanitize(html as string, {
          USE_PROFILES: { html: true },
        })
      } catch (e) {
        noteHTML.value = DOMPurify.sanitize(text as string, {
          USE_PROFILES: { html: true },
        })
      }
    })
  }, [text])

  if (isDisabled) return <span className={classNameTrigger}>{children}</span>

  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
      >
        <RadixTooltip.Trigger onClick={onClick} asChild={true}>
          <span className={classNameTrigger}>{children}</span>
        </RadixTooltip.Trigger>
        <Portal>
          <RadixTooltip.Content
            side={side ?? 'top'}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            align={align}
            className={clsx(
              'z-50 overflow-hidden rounded-md border bg-popover px-2.5 py-1.5 text-[13px] text-popover-foreground shadow-sm animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
              className
            )}
            {...props}
            style={{ ...props.style, maxWidth }}
          >
            <div className={`max-w-[${maxWidth}px]`}>
              <OverlayScrollbarsComponent
                options={{
                  scrollbars: {
                    theme: isDark ? 'os-theme-light' : 'os-theme-dark',
                    autoHide: 'move',
                  },
                }}
                style={{
                  maxHeight,
                  maxWidth: '100%',
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: noteHTML.value }}
                  className="note-content"
                />
              </OverlayScrollbarsComponent>
            </div>
          </RadixTooltip.Content>
        </Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

export default ToolTipNotes
